import {useColorScheme} from "@/hooks/use-color-scheme";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import React, {useEffect} from "react";
import {PaperProvider, adaptNavigationTheme} from "react-native-paper";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";

import {darkTheme, lightTheme} from "@/constants/theme";
import {useAuthStore} from "@/store";
import {GoogleSignin} from "@react-native-google-signin/google-signin";
import * as Notifications from "expo-notifications";
import {en, registerTranslation} from "react-native-paper-dates";
import "react-native-reanimated";

import {
  handleNotificationActionFromButton,
  setupNotificationCategories,
  setupNotificationChannel,
} from "@/services/NotificationService";

registerTranslation("en", en);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const {LightTheme, DarkTheme} = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const {user} = useAuthStore();

  // One-time app startup setup
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: ["profile", "email"],
    });
    setupNotificationChannel();
    setupNotificationCategories();
  }, []);

  // Request push notification permission once user is authenticated
  useEffect(() => {
    if (!user) return;

    Notifications.requestPermissionsAsync();
  }, [user]);

  // Handle notification action button responses (Konfirmasi / Lewati)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const {actionIdentifier, notification} = response;
        const {data} = notification.request.content;
        const identifier = notification.request.identifier;

        // Ignore non-transaction notifications
        if (data?.type !== "transaction_confirmation") return;

        if (actionIdentifier === "confirm") {
          try {
            await handleNotificationActionFromButton(data, identifier);
          } catch (error: any) {
            const responseMessage = error?.response?.data?.message;
            // NestJS message bisa berupa string atau array string
            const errorCode = Array.isArray(responseMessage)
              ? responseMessage[0]
              : responseMessage;

            let displayMessage = "Gagal memproses transaksi";

            // Mapping Error Code ke Bahasa Indonesia yang User-Friendly
            if (errorCode === "Wallet not found") {
              const appLabel = data?.appLabel || data?.app || "terkait";
              displayMessage = `Wallet untuk aplikasi ${appLabel} belum dibuat. Silakan buat wallet terkait untuk bisa membuat transaksi secara otomatis`;
            } else if (error?.message) {
              // Jika error dari network/auth, gunakan message aslinya
              displayMessage = error.message;
            }

            // Tampilkan notifikasi error ke user
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Transaksi Gagal",
                body: displayMessage,
                // Kita tidak pakai subtitle/UangKu di sini agar fokus pada pesan error
              },
              trigger: null,
            });
          }
        } else if (actionIdentifier === "skip") {
          await Notifications.dismissNotificationAsync(identifier).catch(
            () => {},
          );
        }
      },
    );

    return () => subscription.remove();
  }, []);

  const isDark = colorScheme === "dark";
  const paperTheme = isDark ? darkTheme : lightTheme;
  const navigationTheme = isDark ? DarkTheme : LightTheme;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={navigationTheme}>
          <Stack screenOptions={{headerShown: false}}>
            <Stack.Protected guard={!user}>
              <Stack.Screen name="auth" />
            </Stack.Protected>

            <Stack.Protected guard={Boolean(user)}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="modal" options={{presentation: "modal"}} />
            </Stack.Protected>
          </Stack>

          <StatusBar style={isDark ? "light" : "dark"} />
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
