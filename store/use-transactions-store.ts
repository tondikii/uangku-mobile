import {Transaction, TransactionResponse, TransactionSummary} from "@/types";
import {create} from "zustand";

interface TransactionState {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  transactions: Transaction[];
  summary: TransactionSummary | undefined;
  setTransactionData: (data: TransactionResponse["data"]) => void;
  needsRefetch: boolean;
  setNeedsRefetch: (val: boolean) => void;
}

export const useTransactionsStore = create<TransactionState>((set) => ({
  selectedDate: new Date(),
  setSelectedDate: (date) => set({selectedDate: date}),
  transactions: [],
  summary: undefined,
  setTransactionData: (data) =>
    set({
      transactions: data?.data || [],
      summary: data?.summary,
    }),
  needsRefetch: false,
  setNeedsRefetch: (val) => set({needsRefetch: val}),
}));
