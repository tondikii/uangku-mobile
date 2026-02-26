import {TransactionSummary} from "@/types";
import {formatIdr} from "@/utils/common-utils";
import {StyleSheet, View} from "react-native";
import {Surface, Text} from "react-native-paper";

interface SummaryCardProps {
  data?: TransactionSummary;
}

const SummaryCard = ({data}: SummaryCardProps) => {
  return (
    <Surface style={styles.wrapper}>
      <View style={styles.summaryItem}>
        <Text variant="labelSmall">Income</Text>
        <Text variant="titleSmall">+ {formatIdr(data?.income || 0)}</Text>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryItem}>
        <Text variant="labelSmall">Expenses</Text>
        <Text variant="titleSmall">- {formatIdr(data?.expense || 0)}</Text>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryItem}>
        <Text variant="labelSmall">Balance</Text>
        <Text variant="titleSmall">
          {data?.balance && data.balance >= 0 ? "+" : "-"}{" "}
          {formatIdr(Math.abs(data?.balance || 0))}
        </Text>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    margin: 16,
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 2,
    justifyContent: "space-between",
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 6,
  },

  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});

export default SummaryCard;
