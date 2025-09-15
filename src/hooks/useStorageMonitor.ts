// ストレージ使用量監視カスタムフック
import { useState, useEffect } from 'react';
import { checkStorageUsageAlert } from '../utils/imageUtils';

export interface StorageAlert {
  shouldShowAlert: boolean;
  message: string;
  level: 'info' | 'warning' | 'error';
}

export const useStorageMonitor = () => {
  const [storageAlert, setStorageAlert] = useState<StorageAlert>({
    shouldShowAlert: false,
    message: '',
    level: 'info'
  });
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);

  // ストレージ使用量をチェック
  const checkStorageUsage = async () => {
    try {
      const alert = await checkStorageUsageAlert();
      setStorageAlert(alert);
      setLastCheckTime(Date.now());
      
      console.log('📊 ストレージ使用量チェック完了', {
        shouldAlert: alert.shouldShowAlert,
        level: alert.level,
        message: alert.message
      });
      
    } catch (error) {
      console.warn('⚠️ ストレージ使用量チェック失敗:', error);
    }
  };

  // アラートを非表示にする
  const dismissAlert = () => {
    setStorageAlert(prev => ({ ...prev, shouldShowAlert: false }));
  };

  // 定期的なチェック（30分ごと）
  useEffect(() => {
    // 初回チェック
    checkStorageUsage();

    // 30分ごとのチェック
    const interval = setInterval(() => {
      checkStorageUsage();
    }, 30 * 60 * 1000); // 30分

    return () => clearInterval(interval);
  }, []);

  // 画像アップロード後のチェック（手動トリガー）
  const checkAfterImageUpload = () => {
    // 前回チェックから1分以上経過している場合のみ実行
    if (Date.now() - lastCheckTime > 60 * 1000) {
      checkStorageUsage();
    }
  };

  return {
    storageAlert,
    dismissAlert,
    checkAfterImageUpload,
    forceCheck: checkStorageUsage
  };
};
