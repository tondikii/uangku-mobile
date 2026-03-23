# UangKu: AI Engineering Guidelines

## 🎯 Project Vision & Context

- **Product:** UangKu (Automated Financial Tracker for Indonesians).
- **Goal:** Help users consolidate "scattered money" (Banks/E-Wallets) into one view.
- **Core USP:** Notification Listening for Jago, GoPay, OVO, Dana, BCA, etc.
- **Tone:** Professional, Secure, and Reliable, but with a "Relatable/Fun" UX.

## 🛠 Tech Stack Standards

- **Framework:** Expo React Native (Latest SDK) — **Android-only**
- **UI Kit:** React Native Paper (Follow Material Design 3 patterns).
- **State:** Zustand (Keep stores small, use `create` with `devtools` and `persist` where needed).
- **API:** Axios (Centralized instance in `src/services/api.ts`).
- **Icons:** MaterialCommunityIcons (via `@expo/vector-icons`).
- **Secure Storage:** `expo-secure-store` for all sensitive data (tokens, pending transactions).
- **General Storage:** AsyncStorage for UI preferences only (theme, language, non-sensitive cache).

## 🧠 Business Logic Rules

1. **The "Secure-Sync" Confirmation Flow (CRITICAL):**
   - **Headless Notification Listener**: Parse notification + save to SecureStore as "Pending" + trigger local push (NO API calls)
   - **Foreground Sync**: Check SecureStore for pending records; if found, navigate to `/transactions/confirm` screen
   - **Confirmation Screen**: User verifies amount, selects wallet, **assigns category** (NOT pre-filled), then submits
   - **Final API Call**: Only happens when user confirms on the confirmation screen with authenticated Zustand token
   - **Never** auto-assign category as "Notification" — let user choose

2. **Storage Strategy (Strict):**
   - **SecureStore**: Auth tokens, pending transaction queue, sensitive user data
   - **AsyncStorage**: UI preferences only (theme, language, non-sensitive cache)
   - **Zustand**: In-memory cache for fast access; persisted selectively with `persist` middleware

3. **Auth Flow:**
   - New Users: Google Sign-In → Intro Screens → Permission Request → Wallet Checklist.
   - Existing Users: Google Sign-In → `screens/main/TransactionList`.
   - Token stored in SecureStore, read into Zustand on app start.

4. **Wallet Logic:**
   - Use `ALLOWED_APPS_REGEX` to filter which notifications to parse.
   - Total Balance in headers must always be a derived state from all active wallets.

## 🎨 Design System (Strict)

- **Income:** `colors.primary` (Green)
- **Expense:** `colors.error` (Red)
- **Transfer:** `colors.tertiary` (Yellow)
- **Components:** Reuse `transaction-form` and `wallet-form`. Do not duplicate form logic.

## ✍️ Coding Style

- **Naming:** CamelCase for functions/variables, PascalCase for Components.
- **Structure:** Modular (Separation of Concerns). Business logic in `hooks/` or `services/`, UI in `components/`.
- **Language:** Code/Comments in **English**. User-facing strings/UI in **Indonesian** (Friendly & Professional).
- **Safety:** Always wrap Notification parsing logic in `try-catch` to prevent service crashes.

## 💡 Copilot Behavior

- When suggesting UI, prioritize **React Native Paper** components.
- When suggesting logic for the `NotificationListener`, refer to the `ALLOWED_APPS_REGEX` constant.
- Always check `src/components/reusable` before suggesting a new component.
- **Headless Service Code**: Remember that headless tasks cannot make API calls. Parse & save to SecureStore only.
- **Confirmation Screen**: When implementing `/transactions/confirm`, ensure:
  - Amount, wallet, and date are pre-filled (read-only)
  - Category field is EMPTY (required, user must assign)
  - Note field is optional and can include original notification text
- **Token Management**: Always retrieve auth token from Zustand when making API calls in the foreground app. Headless tasks do NOT need tokens (they only parse locally).
