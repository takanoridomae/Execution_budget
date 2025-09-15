/**
 * 数値処理に関するユーティリティ関数
 */

/**
 * 数値を3桁区切り（カンマ区切り）の文字列にフォーマット
 * @param value - フォーマットする数値
 * @returns カンマ区切りの文字列
 */
export const formatNumberWithCommas = (value: number): string => {
  return value.toLocaleString();
};

/**
 * 文字列から数値のみを抽出（カンマや余分な文字を除去）
 * @param value - 処理する文字列
 * @returns 数値のみの文字列
 */
export const extractNumbers = (value: string): string => {
  return value.replace(/[^\d]/g, '');
};

/**
 * カンマ区切りの文字列から数値を取得
 * @param value - カンマ区切りの文字列
 * @returns 数値（パースできない場合は0）
 */
export const parseCommaSeparatedNumber = (value: string): number => {
  const cleanValue = value.replace(/,/g, '');
  const parsed = Number(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * 数値文字列を3桁区切りにフォーマット
 * @param value - フォーマットする文字列
 * @returns カンマ区切りの文字列
 */
export const formatStringAsNumber = (value: string): string => {
  const numValue = extractNumbers(value);
  if (numValue === '') return '';
  return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 金額を円マーク付きでフォーマット
 * @param value - フォーマットする数値
 * @returns 円マーク付きのフォーマット済み文字列
 */
export const formatCurrency = (value: number): string => {
  return `¥${formatNumberWithCommas(value)}`;
};

/**
 * 入力値が有効な数値かチェック
 * @param value - チェックする文字列
 * @returns 有効な数値の場合true
 */
export const isValidNumber = (value: string): boolean => {
  if (value === '') return true; // 空文字は有効とする
  const cleanValue = value.replace(/,/g, '');
  return !isNaN(Number(cleanValue));
};
