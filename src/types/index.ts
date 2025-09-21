export type TransactionType = "income" | "expense";
export type IncomeCategory = "給与" | "副入金" | "お小遣い" | "other";
export type ExpenseCategory = "食費" | "朝食" | "昼食" | "夕食" | "夜食" | "昼間食" | "夜間食" | "飲料" | "日用品" | "交通費" | "医療費" | "教育費" | "交際費" | "その他";


export interface Transaction {
    id: string;
    amount: number,
    content: string,
    date: string,
    type: TransactionType,
    category: IncomeCategory | ExpenseCategory;
    imageUrls?: string[]; // 後方互換性のため残す（廃止予定）
    imageIds?: string[]; // ローカルストレージ用の画像ID配列
    documentUrls?: string[]; // Firebase Storageの書類URL配列
    documentIds?: string[];  // ローカルストレージ用の書類ID配列
}

export interface BudgetSettings {
    monthlyBudget: number;
    savingsGoal: number;
}

// 年月毎の予算・貯蓄目標設定
export interface MonthlyBudgetSettings {
    monthlyBudget: number;
    savingsGoal: number;
    breakdown?: BudgetItem[];
}

// 年月をキーとした予算設定マップ（例: "2024-01" -> 設定値）
export interface BudgetSettingsMap {
    [yearMonth: string]: MonthlyBudgetSettings;
}

// 月間予算の内訳項目
export interface BudgetItem {
    id: string;
    category: ExpenseCategory;
    content: string;
    amount: number;
}

// 現場情報
export interface Site {
    id: string;
    name: string;
    description?: string;
    comment?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    imageUrls?: string[]; // Firebase Storageの画像URL配列
    imageIds?: string[];  // ローカルストレージ用の画像ID配列
    documentUrls?: string[]; // Firebase Storageの書類URL配列
    documentIds?: string[];  // ローカルストレージ用の書類ID配列
}

// 現場別カテゴリー
export interface SiteCategory {
    id: string;
    siteId: string;
    name: string;
    description?: string;
    comment?: string;
    budgetAmount: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    imageUrls?: string[]; // Firebase Storageの画像URL配列
    imageIds?: string[];  // ローカルストレージ用の画像ID配列
    documentUrls?: string[]; // Firebase Storageの書類URL配列
    documentIds?: string[];  // ローカルストレージ用の書類ID配列
}

// 現場別予算設定
export interface SiteBudgetSettings {
    siteId: string;
    totalBudget: number;
    categories: SiteCategory[];
    comment?: string;
    yearMonth: string; // "2024-01" 形式
}

// 現場別予算設定マップ
export interface SiteBudgetSettingsMap {
    [yearMonthSiteKey: string]: SiteBudgetSettings; // "2024-01_site123" 形式
}

// トランザクションに現場情報を追加
export interface SiteTransaction {
    id: string;
    amount: number;
    content: string;
    date: string;
    type: TransactionType;
    siteId: string;
    categoryId: string;
    imageUrls?: string[];
    imageIds?: string[];
}

// 現場別入金トランザクション（入金専用）
export interface SiteIncome {
    id: string;
    amount: number;
    content: string;
    date: string;
    type: 'income'; // 固定値
    siteId: string;
    category: '入金'; // 固定値
    imageUrls?: string[];
    imageIds?: string[];
    documentUrls?: string[]; // Firebase Storageの書類URL配列
    documentIds?: string[];  // ローカルストレージ用の書類ID配列
}

// 現場別支出トランザクション（支出専用）
export interface SiteExpense {
    id: string;
    amount: number;
    content: string;
    date: string;
    type: 'expense'; // 固定値
    siteId: string;
    categoryId: string; // カテゴリーIDを参照
    imageUrls?: string[];
    imageIds?: string[];
    documentUrls?: string[]; // Firebase Storageの書類URL配列
    documentIds?: string[];  // ローカルストレージ用の書類ID配列
}

// 現場日記帳
export interface SiteDiary {
    id: string;
    recordDate: string; // 記載日 (YYYY-MM-DD形式)
    siteId: string; // 現場ID
    categoryId: string; // カテゴリーID
    title: string; // 表題
    content: string; // 日記明細
    createdAt: string;
    updatedAt: string;
    imageUrls?: string[]; // Firebase Storageの画像URL配列
    imageIds?: string[];  // ローカルストレージ用の画像ID配列
    documentUrls?: string[]; // Firebase Storageの書類URL配列
    documentIds?: string[];  // ローカルストレージ用の書類ID配列
}