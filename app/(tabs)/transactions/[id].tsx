import TransactionForm from "@/components/forms/transaction-form/transaction-form";
import {Stack, useLocalSearchParams} from "expo-router";
import React from "react";

export default function DetailTransactionScreen() {
  const {id} = useLocalSearchParams();

  return (
    <>
      <Stack.Screen options={{title: "Transaction"}} />
      <TransactionForm id={id as string} />
    </>
  );
}
