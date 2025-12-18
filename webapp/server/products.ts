// Stripe Products and Prices Configuration
export const PRODUCTS = {
  // One-time purchase product
  CSV_EXPORT_PREMIUM: {
    name: "CSV Export Premium",
    description: "プレミアムCSVエクスポート機能へのアクセス",
    priceAmount: 1000, // 1000 JPY
    currency: "jpy",
    mode: "payment" as const,
  },
  
  // Subscription product
  CSV_SUBSCRIPTION: {
    name: "CSV Manager Pro",
    description: "月額サブスクリプション - 無制限のCSV操作",
    priceAmount: 500, // 500 JPY per month
    currency: "jpy",
    mode: "subscription" as const,
    interval: "month" as const,
  },
};

export type ProductKey = keyof typeof PRODUCTS;
