import {Icon} from "@/components/ui";
import {useMutation} from "@/hooks/axios";
import React, {memo, useCallback, useEffect, useState} from "react";
import {FlatList, StyleSheet, TouchableOpacity, View} from "react-native";
import {
  Button,
  Dialog,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

// ─── (Material Community Icons) ──────────────────────────────
const ICON_OPTIONS = [
  // Finance & Shopping
  "tag",
  "cash",
  "wallet",
  "bank",
  "credit-card",
  "cart-outline",
  "shopping",
  "gift-outline",
  "sale",
  "ticket-percent-outline",
  // Food & Drink
  "silverware-fork-knife",
  "coffee",
  "food-apple-outline",
  "cookie-outline",
  "hamburger",
  "ice-cream",
  "glass-wine",
  "muffin",
  // Transport & Travel
  "car-outline",
  "bus-side",
  "airplane",
  "motorbike",
  "train-variant",
  "gas-station-outline",
  "map-marker-outline",
  "taxi",
  // Home & Bills
  "home-variant-outline",
  "sofa-outline",
  "tools",
  "flash-outline",
  "water-outline",
  "broom",
  "shield-check-outline",
  "percent-outline",
  // Lifestyle & Health
  "heart-pulse",
  "medical-bag",
  "pill",
  "dumbbell",
  "gamepad-variant-outline",
  "movie-open-outline",
  "music-note",
  "camera-outline",
  "book-open-variant",
  // Tech & Communication
  "laptop",
  "cellphone-wireless",
  "wifi",
  "television",
  "controller-classic-outline",
  "printer-outline",
  "web",
  // People & Others
  "account-group-outline",
  "baby-face-outline",
  "paw",
  "tshirt-crew-outline",
  "briefcase-outline",
  "school-outline",
  "church-outline",
  "star-outline",
  "alert-circle-outline",
  "circle-outline",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TransactionCategoryFormData {
  id?: number;
  name: string;
  iconName: string;
  transactionTypeId: number;
}

interface TransactionCategoryFormSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  onDeleteRequest?: (data: TransactionCategoryFormData) => void;
  transactionTypeId: number;
  editData?: TransactionCategoryFormData | null;
}

// ─── Icon picker item ─────────────────────────────────────────────────────────

const IconOption = memo(
  ({
    name,
    isSelected,
    onPress,
  }: {
    name: string;
    isSelected: boolean;
    onPress: (name: string) => void;
  }) => {
    const {colors} = useTheme();
    const handlePress = useCallback(() => onPress(name), [name, onPress]);
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.iconOption,
          {
            backgroundColor: isSelected
              ? colors.primary
              : colors.surfaceVariant,
          },
        ]}
      >
        <Icon
          name={name}
          size={22}
          color={isSelected ? colors.onPrimary : colors.onSurfaceVariant}
        />
      </TouchableOpacity>
    );
  },
);
IconOption.displayName = "IconOption";

// ─── Main component ───────────────────────────────────────────────────────────

const TransactionCategoryFormSheet = ({
  visible,
  onDismiss,
  onSuccess,
  onDeleteRequest,
  transactionTypeId,
  editData,
}: TransactionCategoryFormSheetProps) => {
  const {colors} = useTheme();
  const isEdit = !!editData?.id;

  const [name, setName] = useState("");
  const [iconName, setIconName] = useState("tag");

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setIconName(editData.iconName || "tag");
    } else {
      setName("");
      setIconName("tag");
    }
  }, [editData, visible]);

  const {
    mutate: createCategory,
    loading: loadingCreate,
    error: createError,
  } = useMutation("/transaction-categories", {method: "post"});

  const {
    mutate: updateCategory,
    loading: loadingUpdate,
    error: updateError,
  } = useMutation(`/transaction-categories/${editData?.id}`, {method: "patch"});

  const loading = loadingCreate || loadingUpdate;
  const error = createError || updateError;

  const handleSave = useCallback(async () => {
    try {
      if (isEdit) {
        await updateCategory({name: name.trim(), iconName, transactionTypeId});
      } else {
        await createCategory({
          name: name.trim(),
          iconName,
          transactionTypeId,
        });
      }
      onSuccess();
      onDismiss();
    } catch {
      // error ditampilkan via Snackbar
    }
  }, [
    name,
    iconName,
    transactionTypeId,
    isEdit,
    createCategory,
    updateCategory,
    onSuccess,
    onDismiss,
  ]);

  const handleNameChange = useCallback((val: string) => {
    setName(val);
  }, []);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>
          {isEdit ? "Ubah Kategori" : "Kategori Baru"}
        </Dialog.Title>

        <Dialog.Content style={styles.dialogContent}>
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.previewBox,
                {backgroundColor: colors.primaryContainer},
              ]}
            >
              <Icon name={iconName} size={28} color={colors.primary} />
            </View>

            <TextInput
              mode="outlined"
              label="Nama Kategori"
              value={name}
              onChangeText={handleNameChange}
              style={styles.nameInput}
            />
          </View>

          <Text
            variant="labelMedium"
            style={[styles.iconLabel, {color: colors.onSurfaceVariant}]}
          >
            Pilih Ikon
          </Text>

          {/* Grid Ikon yang dapat di-scroll */}
          <View style={styles.listWrapper}>
            <FlatList
              data={ICON_OPTIONS}
              keyExtractor={(item) => item}
              numColumns={5}
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => (
                <IconOption
                  name={item}
                  isSelected={iconName === item}
                  onPress={setIconName}
                />
              )}
              contentContainerStyle={styles.iconGrid}
            />
          </View>
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          <View style={styles.leftActions}>
            {isEdit && onDeleteRequest && (
              <Button
                textColor={colors.error}
                onPress={() => editData && onDeleteRequest(editData)}
                disabled={loading}
              >
                Hapus
              </Button>
            )}
          </View>
          <View style={styles.rightActions}>
            <Button onPress={onDismiss} disabled={loading}>
              Batal
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading || !name.trim()}
              style={styles.saveBtn}
            >
              Simpan
            </Button>
          </View>
        </Dialog.Actions>
      </Dialog>

      <Snackbar
        visible={!!error}
        onDismiss={() => {}}
        duration={3000}
        style={{backgroundColor: colors.errorContainer}}
      >
        <Text variant="bodySmall" style={{color: colors.onErrorContainer}}>
          {error}
        </Text>
      </Snackbar>
    </Portal>
  );
};

export default TransactionCategoryFormSheet;

const styles = StyleSheet.create({
  dialog: {
    maxHeight: "85%",
    borderRadius: 24,
  },
  dialogContent: {
    paddingBottom: 0,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  previewBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  nameInput: {
    flex: 1,
  },
  errorText: {
    marginBottom: 8,
    marginLeft: 68, // Sesuaikan dengan posisi input teks
  },
  iconLabel: {
    marginTop: 16,
    marginBottom: 12,
    fontWeight: "bold",
  },
  listWrapper: {
    height: 250, // Memberikan ruang scroll untuk ikon
    paddingBottom: 8,
  },
  iconGrid: {
    paddingBottom: 16,
  },
  iconOption: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: "18%", // Sekitar 5 kolom
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftActions: {
    flex: 1,
  },
  rightActions: {
    flexDirection: "row",
    gap: 4,
  },
  saveBtn: {
    borderRadius: 12,
    paddingHorizontal: 8,
  },
});
