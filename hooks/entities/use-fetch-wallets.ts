import {getErrorMessage} from "@/lib/axios";
import {GetWalletsResponse} from "@/types";
import {useFetch} from "../axios/use-fetch";

export const useFetchWallets = () => {
  const fetched = useFetch<GetWalletsResponse>("/wallets");

  const data = fetched.data?.data || [];

  return {
    data,
    loading: fetched.loading,
    error: getErrorMessage(fetched.error),
    refetch: fetched.refetch,
    success: fetched?.data?.success,
  };
};
