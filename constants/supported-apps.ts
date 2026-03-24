export const SUPPORTED_APPS_CONFIG = [
  // Mobile Banking
  {label: "BCA mobile", name: "com.bca", category: "Mobile Banking"},
  {label: "livin", name: "id.bmri.livin", category: "Mobile Banking"},
  {label: "BRImo", name: "id.co.bri.brimo", category: "Mobile Banking"},
  {
    label: "wondr",
    name: "id.bni.wondr",
    category: "Mobile Banking",
  },
  {label: "Jago", name: "com.jago.digitalbanking", category: "Mobile Banking"},
  {
    label: "SeaBank",
    name: "id.co.bankbkemobile.digitalbank",
    category: "Mobile Banking",
  },

  // E-Wallets
  {label: "ShopeePay", name: "com.shopeepay.id", category: "E-Wallets"},
  {label: "GoPay", name: "com.gojek.gopay", category: "E-Wallets"},
  {label: "OVO", name: "ovo.id", category: "E-Wallets"},
  {label: "DANA", name: "id.dana", category: "E-Wallets"},
];

export const SUPPORTED_APPS_LIST = SUPPORTED_APPS_CONFIG.map(
  (app) => app.label,
);

const categories = ["Mobile Banking", "E-Wallets"] as const;

export const SUPPORTED_APPS_CATEGORIZED = categories.map((cat) => ({
  category: cat,
  apps: SUPPORTED_APPS_CONFIG.filter((app) => app.category === cat).map(
    (app) => app.label,
  ),
}));

export const ALLOWED_APP_NAMES = SUPPORTED_APPS_CONFIG.map((app) => app.name);
