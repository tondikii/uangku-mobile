import {ALLOWED_PACKAGES} from "@/constants/supported-apps";
import {api} from "@/lib/axios";
import * as Notifications from "expo-notifications";
import {AppRegistry, Platform} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedNotification {
  app: string;
  title: string;
  text: string;
  date: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const NOTIFICATION_CHANNEL_ID = "uangku_transactions";

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

const triggerConfirmationNotification = async (
  payload: ParsedNotification,
): Promise<void> => {
  try {
    const content: any = {
      title: `Confirm: ${payload.app}`,
      body: payload.title ? `${payload.title}\n${payload.text}` : payload.text,
      data: {
        type: "transaction_confirmation",
        payload: JSON.stringify(payload),
      },
    };

    // Add Android-specific configuration
    if (Platform.OS === "android") {
      content.android = {
        channelId: NOTIFICATION_CHANNEL_ID,
        allowWhileIdle: true,
        priority: "high",
      };
    }

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error("Failed to trigger confirmation notification:", error);
  }
};

// ─── Action Handler ───────────────────────────────────────────────────────────

export const handleNotificationAction = async (
  payload: ParsedNotification,
): Promise<void> => {
  try {
    await api.post("/notifications/sync", {
      app: payload.app,
      title: payload.title,
      text: payload.text,
      date: payload.date,
    });
  } catch (error) {
    console.error("Failed to sync transaction notification:", error);
    // Axios interceptors handle token refresh and 401 errors automatically
    throw error;
  }
};

// ─── Headless task ────────────────────────────────────────────────────────────

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

  const appName: string = parsed.app?.toLowerCase() || "";
  console.log("app name: ", appName);
  console.log("title: ", parsed.title);

  const isAllowed = ALLOWED_PACKAGES.find((pkg) => appName === pkg);
  if (!isAllowed) return;

  const text: string = parsed.text?.trim() || parsed.bigText?.trim() || "";
  const title: string = parsed.title?.trim() || "";

  if (!title && !text) return;

  const combinedText = `${title} ${text}`;
  if (isNonTransactionNotification(combinedText)) return;

  // Prepare notification payload
  const payload: ParsedNotification = {
    app: parsed.app,
    title,
    text,
    date: parsed.time
      ? new Date(parseInt(parsed.time)).toISOString()
      : new Date().toISOString(),
  };

  // Trigger local notification for user confirmation
  // User must tap "Confirm" to execute the API call
  await triggerConfirmationNotification(payload);
};

// ─── Registration ─────────────────────────────────────────────────────────────

if (Platform.OS === "android") {
  AppRegistry.registerHeadlessTask(
    "RNAndroidNotificationListenerHeadlessJs",
    () => headlessNotificationListener,
  );
}
