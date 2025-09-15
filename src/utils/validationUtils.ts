/**
 * バリデーション関数の集合
 */

/**
 * 金額バリデーションの結果
 */
export interface AmountValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * 金額のバリデーション
 * @param amount - バリデートする金額の文字列
 * @param required - 必須フィールドかどうか（デフォルト: true）
 * @param maxAmount - 最大金額（デフォルト: 10,000,000）
 * @returns バリデーション結果
 */
export const validateAmount = (
  amount: string,
  required: boolean = true,
  maxAmount: number = 10000000
): AmountValidationResult => {
  // 必須チェック
  if (required && !amount) {
    return {
      isValid: false,
      errorMessage: '金額は必須です'
    };
  }

  // 空文字の場合（非必須）
  if (!amount) {
    return { isValid: true };
  }

  // 数値チェック
  const numValue = Number(amount);
  if (isNaN(numValue)) {
    return {
      isValid: false,
      errorMessage: '有効な数値を入力してください'
    };
  }

  // 正の数値チェック
  if (numValue <= 0) {
    return {
      isValid: false,
      errorMessage: '正の数値を入力してください'
    };
  }

  // 最大値チェック
  if (numValue > maxAmount) {
    const maxAmountFormatted = (maxAmount / 10000).toLocaleString();
    return {
      isValid: false,
      errorMessage: `金額は${maxAmountFormatted}万円以下で入力してください`
    };
  }

  return { isValid: true };
};

/**
 * カテゴリーのバリデーション
 * @param category - バリデートするカテゴリー
 * @param required - 必須フィールドかどうか（デフォルト: true）
 * @returns バリデーション結果
 */
export const validateCategory = (
  category: string,
  required: boolean = true
): AmountValidationResult => {
  if (required && !category) {
    return {
      isValid: false,
      errorMessage: 'カテゴリーを選択してください'
    };
  }

  return { isValid: true };
};

/**
 * 詳細（説明）のバリデーション
 * @param description - バリデートする詳細文字列
 * @param maxLength - 最大文字数（デフォルト: 500）
 * @returns バリデーション結果
 */
export const validateDescription = (
  description: string,
  maxLength: number = 500
): AmountValidationResult => {
  if (description.length > maxLength) {
    return {
      isValid: false,
      errorMessage: `詳細は${maxLength}文字以内で入力してください`
    };
  }

  return { isValid: true };
};
