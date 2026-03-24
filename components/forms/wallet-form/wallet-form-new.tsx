import {Dropdown} from "@/components/inputs";
import {LoadingState, Snackbar} from "@/components/ui";
import {SUPPORTED_APPS_CONFIG} from "@/constants/supported-apps";
import {useFetch, useMutation} from "@/hooks/axios";
import {useWalletsStore} from "@/store";
import {Wallet} from "@/types";
import {Stack, useRouter} from "expo-router";
import React, {FC, useCallback, useEffect, useMemo, useState} from "react";
import {StyleSheet, View} from "react-native";
import {Button, Switch, Text, TextInput, useTheme} from "react-native-paper";

interface WalletFormProps {
  id?: string;
}

const formatBalanceInput = (raw: string): string => {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
};

const parseBalance = (formatted: string): number => {
  return Number(formatted.replace(/[^0-9]/g, "")) || 0;
};

const WalletForm: FC<WalletFormProps> = ({id}) => {
  const {colors} = useTheme();
  const router = useRouter();
  const isEdit = !!id;

  // FIX: Pisahkan selector store untuk menghindari infinite loop & "getSnapshot" error
  const wallets = useWalletsStore((s) => s.wallets);
  const setRefetch = useWalletsStore((s) => s.setNeedsRefetch);

  const [form, setForm] = useState({name: "", balance: "", appName: ""});
  const [isSupported, setIsSupported] = useState(false);
  const [isError, setIsError] = useState(false);

  // ─── Options for Dropdown ──────────────────────────────────────────────────
  const appOptions = useMemo(() => {
    const filtered = SUPPORTED_APPS_CONFIG.filter((app) => {
      const alreadyUsed = wallets.find((w) => w.appName === app.name);
      // Jika sedang edit, biarkan app yang sedang dipakai tetap muncul di list
      if (isEdit && form.appName === app.name) return true;
      return !alreadyUsed;
    });

    return filtered.map((app) => ({
      label: app.label,
      value: app.name,
    }));
  }, [wallets, isEdit, form.appName]);

  // ─── Data fetching ──────────────────────────────────────────────────────────
  const {data: existingData, loading: loadingExisting} = useFetch<{
    data: Wallet;
  }>(`/wallets/${id}`, {}, !isEdit);

  const {
    mutate: mutateWallet,
    loading: loadingSubmit,
    error: saveError,
  } = useMutation(isEdit ? `/wallets/${id}` : "/wallets", {
    method: isEdit ? "patch" : "post",
  });

  // Sync data saat mode Edit
  useEffect(() => {
    if (existingData?.data) {
      const {name, balance, appName} = existingData.data;
      setForm({
        name,
        balance: formatBalanceInput(String(balance)),
        appName: appName || "",
      });
      if (appName) setIsSupported(true);
    }
  }, [existingData]);

  // FIX: Gunakan setter langsung (bukan toggle) untuk menghindari loop pada error snackbar
  useEffect(() => {
    if (saveError) {
      setIsError(true);
    }
  }, [saveError]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleAppSelect = useCallback((val?: string) => {
    const selectedApp = SUPPORTED_APPS_CONFIG.find((a) => a.name === val);
    setForm((p) => ({
      ...p,
      appName: val || "",
      name: selectedApp?.label || "",
    }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await mutateWallet({
        name: form.name.trim(),
        balance: parseBalance(form.balance),
        appName: isSupported ? form.appName : null,
      });
      setRefetch(true);
      router.back();
    } catch {
      // Error ditangani oleh useEffect di atas
    }
  }, [form, isSupported, mutateWallet, router, setRefetch]);

  if (loadingExisting) return <LoadingState />;

  const disabledSave = isSupported ? !form.appName : !form.name;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Stack.Screen options={{title: isEdit ? "Edit Wallet" : "New Wallet"}} />

      <View style={styles.fields}>
        {/* Toggle Integrasi (Sesuai request: Paling atas & simple) */}
        {!isEdit && (
          <View style={styles.row}>
            <Text variant="labelLarge">Supported App?</Text>
            <Switch
              value={isSupported}
              onValueChange={(val) => {
                setIsSupported(val);
                setForm((p) => ({...p, appName: "", name: ""}));
              }}
              color={colors.primary}
            />
          </View>
        )}

        {isSupported ? (
          <Dropdown
            label="Select Wallet"
            value={form.appName}
            onSelect={handleAppSelect}
            options={appOptions}
            disabled={isEdit}
          />
        ) : (
          <TextInput
            mode="outlined"
            label="Wallet Name"
            value={form.name}
            onChangeText={(v) => setForm((p) => ({...p, name: v}))}
          />
        )}

        <TextInput
          mode="outlined"
          label="Balance"
          value={form.balance}
          onChangeText={(v) =>
            setForm((p) => ({...p, balance: formatBalanceInput(v)}))
          }
          keyboardType="numeric"
          left={<TextInput.Affix text="Rp" />}
        />
      </View>

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loadingSubmit}
        style={styles.submitBtn}
        disabled={disabledSave || loadingSubmit}
      >
        {isEdit ? "Update Wallet" : "Save Wallet"}
      </Button>

      {/* Snackbar menggunakan setter isError(false) untuk tutup */}
      <Snackbar
        visible={isError}
        onDismiss={() => setIsError(false)}
        text={saveError || "Terjadi kesalahan sistem"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16, justifyContent: "space-between"},
  fields: {gap: 12},
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  submitBtn: {borderRadius: 8},
});

export default WalletForm;
