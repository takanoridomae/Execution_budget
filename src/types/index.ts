export type TransactionType = "income" | "expense";
export type IncomeCategory = "給与" | "副収入" | "お小遣い" | "other";
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