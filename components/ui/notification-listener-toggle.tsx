import React, {useEffect, useRef, useState} from "react";
import {AppState, AppStateStatus, StyleSheet, View} from "react-native";
import RNAndroidNotificationListener from "react-native-android-notification-listener";
import {Switch, Text, useTheme} from "react-native-paper";

/**
 * NotificationListenerToggle
 *
 * Section 2: Notification Settings
 * Allows users to enable/disable notification listening for automatic transaction confirmation.
 *
 * Architecture (Secure-Sync):
 * - When ON: Headless service listens for transaction notifications
 * - Sends local push → User confirms on dedicated screen → Final API call
 * - When OFF: No automatic transaction interception
 */
export default function NotificationListenerToggle() {
  const {colors} = useTheme();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const appState = useRef(AppState.currentState);

  const checkPermission = async () => {
    try {
      const status = await RNAndroidNotificationListener.getPermissionStatus();
      setIsEnabled(status === "authorized");
    } catch (error) {
      console.error("Error checking notification permission:", error);
      setIsEnabled(false);
    }
  };

  useEffect(() => {
    checkPermission();

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (appState.current !== "active" && nextAppState === "active") {
          checkPermission();
        }
        appState.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, []);

  const handleToggle = async (value: boolean) => {
    setIsLoading(true);
    try {
      RNAndroidNotificationListener.requestPermission();
      await checkPermission();
    } catch (error) {
      console.error("Error toggling notification permission:", error);
      // Re-check to get actual permission state
      await checkPermission();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, {backgroundColor: colors.elevation.level2}]}
    >
      <View style={{flex: 1, marginRight: 16}}>
        <Text variant="titleMedium" style={{fontWeight: "bold"}}>
          Enable Notification Listening
        </Text>
        <Text
          variant="bodySmall"
          style={{color: colors.onSurfaceVariant, marginTop: 4}}
        >
          {isEnabled
            ? "UangKu will send you a notification to confirm each transaction."
            : "Grant notification access so UangKu can track and confirm transactions automatically."}
        </Text>
      </View>

      <Switch
        value={isEnabled}
        onValueChange={handleToggle}
        disabled={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
});
