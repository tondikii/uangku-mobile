import {
  ALLOWED_APP_NAMES,
  SUPPORTED_APPS_CONFIG,
} from "@/constants/supported-apps";
import {api} from "@/lib/axios";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import {AppRegistry, Platform} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedNotification {
  app: string;
  appLabel: string; // Human-readable label e.g. "BCA mobile", "GoPay"
  title: string;
  text: string;
  date: string;
  amount: number;
  transactionTypeId: number; // 1 = Income, 2 = Expense
}

// ─── Config ───────────────────────────────────────────────────────────────────

const NOTIFICATION_CHANNEL_ID = "uangku_transactions";

// ─── Token Management ─────────────────────────────────────────────────────────

/**
 * Read auth token from SecureStore (Zustand persist key)
 * Used by notification action listeners to authenticate API calls
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    const raw = await SecureStore.getItemAsync("auth-store");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
};

// ─── Setup ────────────────────────────────────────────────────────────────────

/**
 * Create Android notification channel for transaction confirmations.
 * Must be called before scheduling any notification.
 */
export const setupNotificationChannel = async (): Promise<void> => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: "Transaction Confirmations",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
    enableVibrate: true,
    enableLights: true,
    sound: "default",
  });
};

/**
 * Setup notification action categories (Konfirmasi / Lewati buttons).
 * Must be called once at app startup.
 */
export const setupNotificationCategories = async (): Promise<void> => {
  await Notifications.setNotificationCategoryAsync("transaction_actions", [
    {
      buttonTitle: "Konfirmasi",
      identifier: "confirm",
      options: {opensAppToForeground: false},
    },
    {
      buttonTitle: "Lewati",
      identifier: "skip",
      options: {opensAppToForeground: false},
    },
  ]);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize a raw amount string to integer rupiah.
 *
 * Indonesian banks use inconsistent formats:
 *   - "50.000"        → dot as thousand separator  → 50000
 *   - "50,000"        → comma as thousand separator → 50000
 *   - "11,000.00"     → BCA BI-Fast format          → 11000  ← was broken
 *   - "1.500.000,00"  → dot-thousand + comma-decimal → 1500000
 *
 * Strategy:
 *   If the string ends with exactly 2 decimal digits after a separator
 *   (either ".00"/",00"), strip the decimal part first, then remove
 *   all remaining separators.
 */
const normalizeAmountStr = (raw: string): number | null => {
  let str = raw.trim();

  // Strip trailing decimal part: ",00" or ".00" (exactly 2 digits)
  str = str.replace(/[.,]\d{2}$/, "");

  // Now remove all remaining separators (dots and commas used as thousands)
  str = str.replace(/[.,]/g, "");

  const value = parseInt(str, 10);
  return isNaN(value) || value <= 0 ? null : value;
};

/**
 * Extract transaction amount from notification text.
 *
 * Priority:
 *   1. "Rp 50.000" / "Rp50.000" / "Rp 11,000.00" (BCA BI-Fast)
 *   2. "sebesar 100.000" / "senilai Rp11.000"
 *   3. Indonesian thousand-separator number as last resort
 *      — restricted to \d{1,3}(?:[.,]\d{3})+ to avoid matching
 *        phone numbers, reference codes, dates, etc.
 */
const extractAmount = (text: string): number | null => {
  // 1. Explicit Rp/IDR prefix — most reliable signal
  const rpMatch = text.match(/(?:rp\.?|idr)\s*([\d.,]+)/i);
  if (rpMatch) return normalizeAmountStr(rpMatch[1]);

  // 2. "sebesar" or "senilai" keyword
  const keywordMatch = text.match(
    /(?:sebesar|senilai)\s+(?:rp\.?\s*)?([\d.,]+)/i,
  );
  if (keywordMatch) return normalizeAmountStr(keywordMatch[1]);

  // 3. Indonesian thousand-formatted number only
  // Matches "50.000", "1.500.000", "50,000", "1,500,000"
  // Requires consistent separator groups of exactly 3 digits
  const thousandMatch = text.match(/\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?\b/);
  if (thousandMatch) return normalizeAmountStr(thousandMatch[0]);

  return null;
};

// ─── App Label ────────────────────────────────────────────────────────────────

/**
 * Resolve human-readable app label from package name.
 * e.g. "id.co.bankbkemobile.digitalbank" → "SeaBank"
 * Falls back to the raw package name if not found.
 */
const getAppLabel = (appName: string): string => {
  const config = SUPPORTED_APPS_CONFIG.find(
    (app) => app.name.toLowerCase() === appName.toLowerCase(),
  );
  return config?.label ?? appName;
};

// ─── Transaction Type Detection ───────────────────────────────────────────────

/**
 * Detect whether a notification describes an Income or Expense transaction.
 * Ported from BE BaseNotificationParser.detectType() to keep logic consistent.
 *
 * Returns:
 *   1 = Income
 *   2 = Expense (default)
 */
const detectTransactionType = (title: string, text: string): number => {
  const combined = `${title} ${text}`.toLowerCase();

  const incomePatterns = [
    /uang masuk/,
    /dana masuk/,
    /saldo (kamu )?bertambah/,
    /anda telah menerima/,
    /telah menerima/,
    /kamu menerima/,
    /telah mengirim.{0,30}ke kamu/,
    /transfer masuk/,
    /diterima/,
    /top.?up/,
    /isi saldo/,
    /tambah saldo/,
    /cashback/,
    /refund/,
    /pengembalian/,
    /hadiah|bonus|reward/,
    /you (have )?received/,
    /money received/,
    /has sent you/,
    /sent you/,
    /incoming (transfer|payment)/,
    /credited (to your|to)/,
    /deposit(ed)?/,
    /payment received/,
    /transfer in/,
    /added to (your )?account/,
    /top.?up (successful|berhasil)/,
    /menerima/,
  ];

  if (incomePatterns.some((rx) => rx.test(combined))) return 1;
  return 2;
};

// ─── Filters ──────────────────────────────────────────────────────────────────

const isNonTransactionNotification = (combined: string): boolean => {
  const lower = combined.toLowerCase();

  const hasAmount =
    /(?:rp\.?|idr)\s*[\d.,]+/.test(lower) ||
    /sebesar\s+[\d.,]+/.test(lower) ||
    /\b\d{1,3}(?:\.\d{3})+\b/.test(lower);

  if (!hasAmount) return true;

  if (
    /\botp\b|kode verifikasi|verification code|\bkode\b.{0,10}\d{4,8}/.test(
      lower,
    )
  )
    return true;

  if (
    /login baru|masuk dari|perangkat baru|new (login|sign.?in|device)|signed in from/.test(
      lower,
    )
  )
    return true;

  return false;
};

// ─── Local Notification Trigger ───────────────────────────────────────────────

/**
 * Trigger local push notification with Konfirmasi / Lewati action buttons.
 * All transaction data is embedded in notification.data — no SecureStore pending queue.
 */
const triggerConfirmationNotification = async (
  payload: ParsedNotification,
): Promise<void> => {
  const isIncome = payload.transactionTypeId === 1;

  // Amount with sign prefix — most important info, visible without expanding
  const amountFormatted = `${isIncome ? "+" : "-"}Rp ${payload.amount.toLocaleString("id-ID")}`;

  // Use original notification text as body if available and different from title,
  // otherwise fall back to title — gives user context to verify the transaction
  const bodyText =
    payload.text && payload.text !== payload.title
      ? payload.text
      : payload.title;

  const content: Notifications.NotificationContentInput = {
    // Fokus utama tetap pada nominal transaksi
    title: amountFormatted,

    // Format: UangKu · [Nama Aplikasi] · [Tipe Transaksi]
    // Contoh: UangKu · BCA mobile · Dana Masuk
    subtitle: `UangKu · ${payload.appLabel} · ${isIncome ? "Dana Masuk" : "Dana Keluar"}`,

    // Isi notifikasi asli dari bank tetap bersih tanpa tambahan teks/emoji
    body: bodyText,

    categoryIdentifier: "transaction_actions",
    data: {
      type: "transaction_confirmation",
      app: payload.app,
      appLabel: payload.appLabel,
      title: payload.title,
      text: payload.text,
      date: payload.date,
      amount: payload.amount.toString(),
      transactionTypeId: payload.transactionTypeId.toString(),
    },
  };

  await Notifications.scheduleNotificationAsync({
    content,
    trigger: null,
  });
};

// ─── API Handlers ─────────────────────────────────────────────────────────────

/**
 * Called when user taps "Konfirmasi" on the push notification button.
 * Reads transaction data embedded in notification.data and POSTs to backend.
 * Dismisses the notification afterward regardless of API result.
 *
 * FIX: Removed manual Authorization header injection — the `api` axios instance
 * already handles this via its request interceptor.
 *
 * FIX: Token check is now a hard guard — throws immediately if not authenticated
 * so the caller (_layout.tsx) can handle the error and inform the user.
 *
 * FIX: Added notificationIdentifier param so notification is dismissed after
 * action — previously tapping Konfirmasi/Lewati left the notification hanging.
 */
export const handleNotificationActionFromButton = async (
  notificationData: Record<string, any>,
  notificationIdentifier: string,
): Promise<void> => {
  await Notifications.dismissNotificationAsync(notificationIdentifier).catch(
    () => {},
  );

  const token = await getAuthToken();
  if (!token) {
    throw new Error(
      "[NotificationService] User not authenticated — cannot confirm transaction",
    );
  }

  const amount = parseInt(notificationData.amount, 10);
  if (isNaN(amount)) {
    throw new Error(
      "[NotificationService] Invalid amount in notification data",
    );
  }
  const {app, title = "", text, date} = notificationData;

  const transactionTypeId = detectTransactionType(title, text);

  await api.post("/notifications/sync", {
    appName: app,
    title,
    text,
    date,
    amount,
    transactionTypeId,
  });
};

// ─── Headless Task ────────────────────────────────────────────────────────────

const headlessNotificationListener = async ({
  notification,
}: any): Promise<void> => {
  if (!notification) return;

  let parsed: any;
  try {
    parsed = JSON.parse(notification);
  } catch {
    return;
  }

  // FIX: ALLOWED_APP_NAMES contains exact package names with mixed case
  // (e.g. "com.jago.digitalBanking"). Previously appName was lowercased
  // before comparison, causing all matches to fail. Now we compare
  // case-insensitively by lowercasing both sides.
  const appName: string = parsed.app?.toLowerCase() ?? "";
  const isAllowed = ALLOWED_APP_NAMES.find((app) => app === appName);
  if (!isAllowed) return;

  const text: string = parsed.text?.trim() || parsed.bigText?.trim() || "";
  const title: string = parsed.title?.trim() || "";

  if (!title && !text) return;

  const combinedText = `${title} ${text}`;

  if (isNonTransactionNotification(combinedText)) return;

  const amount = extractAmount(combinedText);
  if (!amount) return;

  const appLabel = getAppLabel(appName);
  const transactionTypeId = detectTransactionType(title, text);

  const payload: ParsedNotification = {
    app: parsed.app,
    appLabel,
    title,
    text,
    date: parsed.time
      ? new Date(parseInt(parsed.time, 10)).toISOString()
      : new Date().toISOString(),
    amount,
    transactionTypeId,
  };

  await triggerConfirmationNotification(payload);
};

// ─── Registration ─────────────────────────────────────────────────────────────

if (Platform.OS === "android") {
  AppRegistry.registerHeadlessTask(
    "RNAndroidNotificationListenerHeadlessJs",
    () => headlessNotificationListener,
  );
}
