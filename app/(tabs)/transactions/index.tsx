import React, {useEffect} from "react";
import {FlatList, RefreshControl, StyleSheet, View} from "react-native";
import {
  ActivityIndicator,
  Button,
  Divider,
  List,
  Text,
  useTheme,
} from "react-native-paper";

import {AddButton, Icon, TransactionBadge} from "@/components/ui";
import {useFetch} from "@/hooks/axios/use-fetch";
import {useTransactionsStore} from "@/store/use-transactions-store";
import {TransactionResponse} from "@/types";
import {formatIdr, getOperatorSymbol, screenWidth} from "@/utils/common-utils";
import {useRouter} from "expo-router";

export default function TransactionScreen() {
  const {colors} = useTheme();
  const router = useRouter();

  const {
    selectedDate,
    setTransactionData,
    transactions,
    needsRefetch,
    setNeedsRefetch,
  } = useTransactionsStore();

  const {
    data: fetchedData,
    loading,
    error,
    refetch,
  } = useFetch<TransactionResponse>("/transactions", {
    params: {
      date: selectedDate.toLocaleDateString("sv-SE"),
    },
  });

  const renderItem = ({item}: any) => {
    const typeId = item.transactionType.id;

    const getTypeColor = () => {
      if (typeId === 1) return colors.primary;
      if (typeId === 2) return colors.error;
      return colors.tertiary;
    };

    const typeColor = getTypeColor();

    const handlePress = () => {
      router.push(`/transactions/${item.id}`);
    };

    return (
      <List.Item
        title={item.transactionCategory.name}
        titleStyle={styles.title}
        descriptionStyle={styles.description}
        contentStyle={styles.content}
        style={styles.item}
        left={() => (
          <View style={styles.leftContainer}>
            <View style={[styles.iconWrapper, {backgroundColor: typeColor}]}>
              <Icon
                name={item.transactionCategory.iconName || ""}
                size={18}
                color={colors.surface}
              />
            </View>
          </View>
        )}
        right={() => (
          <View style={styles.rightContainer}>
            <Text style={styles.amount}>
              {getOperatorSymbol(typeId)}
              {formatIdr(item.amount)}
            </Text>

            {item.adminFee > 0 && (
              <Text style={styles.fee}>{formatIdr(item.adminFee)} fee</Text>
            )}

            <View style={styles.badgeContainer}>
              {item.transactionWallets.map((tw: any) => (
                <TransactionBadge key={tw.id} isIncome={tw.isIncoming}>
                  {tw.wallet.name}
                </TransactionBadge>
              ))}
            </View>
          </View>
        )}
        onPress={handlePress}
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{marginTop: 12}}>Loading transactions...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="triangle-exclamation" size={32} color={colors.error} />
          <Text style={{marginTop: 12, marginBottom: 8}}>
            Something went wrong
          </Text>
          <Button mode="contained" onPress={refetch}>
            Retry
          </Button>
        </View>
      );
    }

    if (!transactions.length) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="receipt" size={32} color={colors.secondary} />
          <Text style={{marginTop: 12}}>No transactions yet</Text>
          <Text style={{fontSize: 12, color: colors.secondary}}>
            Your transactions will appear here
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <Divider />}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    );
  };

  useEffect(() => {
    if (fetchedData?.data) {
      setTransactionData(fetchedData.data);
    }
  }, [fetchedData, setTransactionData]);

  useEffect(() => {
    if (needsRefetch) {
      refetch();
      setNeedsRefetch(false);
    }
  }, [needsRefetch, refetch, setNeedsRefetch]);

  return (
    <View style={styles.container}>
      {renderContent()}
      <AddButton screenName="transactions" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  item: {
    paddingHorizontal: 16,
    alignItems: "center",
  },

  content: {
    paddingVertical: 8,
    justifyContent: "center",
  },

  title: {
    fontSize: 14,
    alignSelf: "flex-start",
  },

  description: {
    fontSize: 11,
    opacity: 0.7,
  },

  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  rightContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
  },

  leftContainer: {
    justifyContent: "center",
  },

  amount: {
    fontSize: 14,
  },

  fee: {
    fontSize: 11,
    opacity: 0.6,
  },

  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
  },
  listContent: {
    paddingBottom: screenWidth * 0.25,
  },
});
