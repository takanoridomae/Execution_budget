import { IncomeCategory, ExpenseCategory } from '../types';

/**
 * 入金カテゴリーの定義
 */
export const INCOME_CATEGORIES: { value: IncomeCategory; label: string }[] = [
  { value: '給与', label: '給与' },
  { value: '副入金', label: '副入金' },
  { value: 'お小遣い', label: 'お小遣い' },
  { value: 'other', label: 'その他' }
];

/**
 * 支出カテゴリーの定義
 */
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: '食費', label: '食費' },
  { value: '朝食', label: '朝食' },
  { value: '昼食', label: '昼食' },
  { value: '夕食', label: '夕食' },
  { value: '夜食', label: '夜食' },
  { value: '昼間食', label: '昼間食' },
  { value: '夜間食', label: '夜間食' },
  { value: '飲料', label: '飲料' },
  { value: '日用品', label: '日用品' },
  { value: '交通費', label: '交通費' },
  { value: '医療費', label: '医療費' },
  { value: '教育費', label: '教育費' },
  { value: '交際費', label: '交際費' },
  { value: 'その他', label: 'その他' }
];

/**
 * 取引タイプに応じたカテゴリー一覧を取得
 */
export const getCategoriesByType = (type: 'income' | 'expense') => {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
};
