import {SUPPORTED_APPS_CATEGORIZED} from "@/constants/supported-apps";
import React from "react";
import {ScrollView, StyleSheet, View} from "react-native";
import {Divider, Text, useTheme} from "react-native-paper";

/**
 * SupportedApps
 *
 * Section 3: Supported Apps
 * Displays all supported financial apps categorized by type (Mobile Banking & E-Wallets).
 * Uses SUPPORTED_APPS_CATEGORIZED from constants (single source of truth).
 */
export default function SupportedApps() {
  const {colors} = useTheme();

  return (
    <View
      style={[styles.container, {backgroundColor: colors.elevation.level2}]}
    >
      <Text
        variant="titleMedium"
        style={{fontWeight: "bold", marginBottom: 16}}
      >
        Supported Applications
      </Text>

      <ScrollView
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {SUPPORTED_APPS_CATEGORIZED.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.categoryContainer}>
            <Text
              variant="labelLarge"
              style={{color: colors.primary, marginBottom: 8}}
            >
              {group.category}
            </Text>
            <View style={styles.appsList}>
              <View style={styles.columnContainer}>
                {group.apps.map((app, appIndex) => (
                  <View key={appIndex} style={styles.appItem}>
                    <Text
                      variant="labelMedium"
                      style={{paddingVertical: 6, paddingLeft: 8}}
                    >
                      • {app}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            {groupIndex < SUPPORTED_APPS_CATEGORIZED.length - 1 && (
              <Divider style={{marginVertical: 12}} />
            )}
          </View>
        ))}
      </ScrollView>

      <Text
        variant="labelSmall"
        style={{
          color: colors.onSurfaceVariant,
          marginTop: 16,
          fontStyle: "italic",
        }}
      >
        We never store your login credentials or payment info.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  appsList: {
    marginHorizontal: -4,
  },
  columnContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  appItem: {
    width: "33.333%",
    paddingHorizontal: 4,
  },
});
