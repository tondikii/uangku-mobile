export const SUPPORTED_APPS_CONFIG = [
  // Banks
  {label: "BCA mobile", packageName: "com.bca", category: "Banks"},
  {label: "livin", packageName: "id.bmri.livin", category: "Banks"},
  {label: "BRImo", packageName: "id.co.bri.brimo", category: "Banks"},
  {
    label: "wondr",
    packageName: "id.bni.wondr",
    category: "Banks",
  },
  {label: "Jago", packageName: "com.jago.digitalBanking", category: "Banks"},
  {
    label: "SeaBank",
    packageName: "id.co.bankbkemobile.digitalbank",
    category: "Banks",
  },

  // Wallets
  {label: "ShopeePay", packageName: "com.shopeepay.id", category: "Wallets"},
  {label: "GoPay", packageName: "com.gojek.gopay", category: "Wallets"},
  {label: "OVO", packageName: "ovo.id", category: "Wallets"},
  {label: "DANA", packageName: "id.dana", category: "Wallets"},
];

export const SUPPORTED_APPS_LIST = SUPPORTED_APPS_CONFIG.map(
  (app) => app.label,
);

const categories = ["Banks", "Wallets", "Market Places"] as const;

export const SUPPORTED_APPS_CATEGORIZED = categories.map((cat) => ({
  category: cat,
  apps: SUPPORTED_APPS_CONFIG.filter((app) => app.category === cat).map(
    (app) => app.label,
  ),
}));

export const ALLOWED_PACKAGES = SUPPORTED_APPS_CONFIG.map(
  (app) => app.packageName,
);
