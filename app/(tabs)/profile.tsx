import {NotificationListenerToggle, SupportedApps} from "@/components/ui";
import {clearHeadlessToken} from "@/services/NotificationService";
import {useAuthStore} from "@/store";
import {screenHeight} from "@/utils/common-utils";
import {GoogleSignin} from "@react-native-google-signin/google-signin";
import {format} from "date-fns";
import React, {useState} from "react";
import {ScrollView, StyleSheet, View} from "react-native";
import {
  Avatar,
  Button,
  Dialog,
  Divider,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import {SafeAreaView} from "react-native-safe-area-context";

export default function ProfileScreen() {
  const {colors} = useTheme();
  const {signout, user} = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogoutConfirm = async () => {
    try {
      setLoading(true);
      setShowLogoutDialog(false);
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      await clearHeadlessToken();
      signout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar.Image
            size={100}
            source={{uri: user?.avatar}}
            style={styles.avatar}
          />
          <Text variant="headlineSmall" style={styles.userName}>
            {user?.name}
          </Text>
          <Text variant="bodyMedium" style={{color: colors.outline}}>
            {user?.email}
          </Text>
        </View>

        <View
          style={[styles.infoBox, {backgroundColor: colors.elevation.level1}]}
        >
          <View style={styles.infoRow}>
            <Text variant="labelLarge">Joined Since</Text>
            <Text variant="bodyMedium">
              {user?.createdAt ? format(user.createdAt, "dd MMM yyyy") : "-"}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={{paddingHorizontal: 16}}>
          <NotificationListenerToggle />
          <SupportedApps />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.actionsSection}>
          <View
            style={[
              styles.actionCard,
              {backgroundColor: colors.elevation.level2},
            ]}
          >
            <View style={{flex: 1}}>
              <Text variant="titleMedium" style={{fontWeight: "600"}}>
                Sign Out
              </Text>
              <Text
                variant="bodySmall"
                style={{color: colors.onSurfaceVariant, marginTop: 4}}
              >
                Sign out from your UangKu account
              </Text>
            </View>
            <Button
              mode="outlined"
              onPress={() => setShowLogoutDialog(true)}
              textColor={colors.error}
              disabled={loading}
              loading={loading}
            >
              Sign Out
            </Button>
          </View>
        </View>

        {/* Footer Version */}
        <View style={styles.footer}>
          <Text
            variant="labelSmall"
            style={{color: colors.outline, letterSpacing: 1}}
          >
            Versi 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={showLogoutDialog}
          onDismiss={() => setShowLogoutDialog(false)}
        >
          <Dialog.Title>Sign Out from UangKu?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              You can always sign back in with your Google account.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowLogoutDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onPress={handleLogoutConfirm}
              textColor={colors.error}
              loading={loading}
              disabled={loading}
            >
              Sign Out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    alignItems: "center",
    marginTop: screenHeight * 0.025,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  avatar: {marginBottom: 16, elevation: 4},
  userName: {fontWeight: "700", textAlign: "center"},
  infoBox: {
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    marginVertical: 8,
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
});
