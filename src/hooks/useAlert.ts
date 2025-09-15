import { useState, useCallback } from 'react';

/**
 * アラートの種類
 */
export type AlertType = 'success' | 'error' | 'warning' | 'info';

/**
 * アラート情報
 */
export interface AlertInfo {
  type: AlertType;
  message: string;
}

/**
 * アラート表示管理カスタムフック
 */
export const useAlert = () => {
  const [alert, setAlert] = useState<AlertInfo | null>(null);

  /**
   * アラートを表示
   * @param type - アラートの種類
   * @param message - 表示するメッセージ
   * @param duration - 表示時間（ミリ秒、デフォルト: 3000）
   */
  const showAlert = useCallback((
    type: AlertType, 
    message: string, 
    duration: number = 3000
  ) => {
    setAlert({ type, message });
    
    if (duration > 0) {
      setTimeout(() => {
        setAlert(null);
      }, duration);
    }
  }, []);

  /**
   * 成功メッセージを表示
   * @param message - 表示するメッセージ
   * @param duration - 表示時間（ミリ秒、デフォルト: 3000）
   */
  const showSuccess = useCallback((message: string, duration?: number) => {
    showAlert('success', message, duration);
  }, [showAlert]);

  /**
   * エラーメッセージを表示
   * @param message - 表示するメッセージ
   * @param duration - 表示時間（ミリ秒、デフォルト: 3000）
   */
  const showError = useCallback((message: string, duration?: number) => {
    showAlert('error', message, duration);
  }, [showAlert]);

  /**
   * 警告メッセージを表示
   * @param message - 表示するメッセージ
   * @param duration - 表示時間（ミリ秒、デフォルト: 3000）
   */
  const showWarning = useCallback((message: string, duration?: number) => {
    showAlert('warning', message, duration);
  }, [showAlert]);

  /**
   * 情報メッセージを表示
   * @param message - 表示するメッセージ
   * @param duration - 表示時間（ミリ秒、デフォルト: 3000）
   */
  const showInfo = useCallback((message: string, duration?: number) => {
    showAlert('info', message, duration);
  }, [showAlert]);

  /**
   * アラートをクリア
   */
  const clearAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return {
    alert,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAlert
  };
};
