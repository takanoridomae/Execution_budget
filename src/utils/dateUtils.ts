/**
 * 日付関連のユーティリティ関数
 */

/**
 * 日付を表示用の文字列にフォーマット（例: "12月25日"）
 */
export const formatDisplayDate = (date: Date | null): string => {
  if (!date) return '日付未選択';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

/**
 * 日付を詳細表示用の文字列にフォーマット（例: "2024年12月25日"）
 */
export const formatFullDate = (date: Date | null): string => {
  if (!date) return '';
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

/**
 * 日付をYYYY-MM-DD形式の文字列に変換（データベース保存用）
 */
export const formatDateForStorage = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 年月日からYYYY-MM-DD形式の文字列を作成
 */
export const formatDateKey = (year: number, month: number, day: number): string => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/**
 * 現在の日付を取得
 */
export const getCurrentDate = (): Date => {
  return new Date();
};

/**
 * 日付文字列から Date オブジェクトを作成
 */
export const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};
