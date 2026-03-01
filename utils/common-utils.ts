import {Dimensions} from "react-native";

export const formatIdr = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getOperatorSymbol = (transactionTypeId: number) => {
  // Asumsikan ID 1 untuk Income, ID 2 untuk Expense
  if (transactionTypeId === 1) return "+ ";
  if (transactionTypeId === 2) return "- ";
  return ""; // Default jika tipe tidak dikenali
};

export const screenHeight = Dimensions.get("window").height;
export const screenWidth = Dimensions.get("window").width;
