import {DateStepper} from "@/components/inputs";
import {SummaryCard} from "@/components/ui";
import {useTransactionsStore} from "@/store/use-transactions-store";
import {Stack} from "expo-router";
import {View} from "react-native";
import {useTheme} from "react-native-paper";

export default function TransactionsLayout() {
  const theme = useTheme();
  const {selectedDate, setSelectedDate, summary} = useTransactionsStore();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Transactions",
          headerTitleAlign: "center",
          header: () => (
            <View
              style={{backgroundColor: theme.colors.surface, paddingTop: 50}}
            >
              <DateStepper date={selectedDate} onChange={setSelectedDate} />
              <SummaryCard data={summary} />
            </View>
          ),
        }}
      />
      <Stack.Screen name="add" options={{title: "Add Transaction"}} />
    </Stack>
  );
}
