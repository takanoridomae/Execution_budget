// 画像管理ユーティリティ関数（ローカルストレージ + Firebase Storage対応）

import React from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

// デバイス判定
const isMobileDevice = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Base64をBlobに変換（Firebase Storage用）
const base64ToBlob = (base64String: string): Blob => {
  const base64Data = base64String.split(',')[1]; // data:image/jpeg;base64, の部分を削除
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'image/jpeg' });
};

// Firebase Storage使用量チェック
export const checkFirebaseStorageUsage = async (): Promise<{
  canUpload: boolean;
  estimatedUsage: number;
  recommendation: string;
}> => {
  try {
    // 簡易的な使用量推定（実際のAPIは有料プランのみ）
    const transactionCount = localStorage.getItem('firebase_image_count');
    const estimatedImages = transactionCount ? parseInt(transactionCount, 10) : 0;
    const estimatedUsageGB = (estimatedImages * 0.15) / 1024; // 1画像150KB想定
    
    const canUpload = estimatedUsageGB < 4.5; // 5GBの90%で警告
    
    let recommendation = '正常';
    if (estimatedUsageGB > 4.5) {
      recommendation = '無料枠の上限に近づいています。新しい画像はローカル保存を推奨します。';
    } else if (estimatedUsageGB > 3.5) {
      recommendation = '使用量が多くなっています。画像の品質を下げることを検討してください。';
    }
    
    return { canUpload, estimatedUsage: estimatedUsageGB, recommendation };
  } catch {
    return { canUpload: true, estimatedUsage: 0, recommendation: '使用量の確認ができませんでした' };
  }
};

// Firebase Storageへの画像アップロード（エラーハンドリング強化）
export const uploadImageToFirebaseStorage = async (
  transactionId: string,
  file: File
): Promise<string> => {
  console.log('☁️ Firebase Storage アップロード開始', {
    fileName: file.name,
    size: file.size,
    transactionId
  });

  try {
    // より強い圧縮（無料枠節約）
    const isMobile = isMobileDevice();
    const maxWidth = isMobile ? 500 : 700;
    const maxHeight = isMobile ? 400 : 500;
    const quality = isMobile ? 0.5 : 0.6;
    
    const compressedBase64 = await resizeImage(file, maxWidth, maxHeight, quality);
    const blob = base64ToBlob(compressedBase64);
    
    console.log('📊 圧縮完了', {
      元サイズ: `${Math.round(file.size / 1024)} KB`,
      圧縮後: `${Math.round(blob.size / 1024)} KB`,
      圧縮率: `${Math.round((1 - blob.size / file.size) * 100)}%`
    });
    
    // Firebase Storageにアップロード（メタデータ追加）
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, `transactions/${transactionId}/images/${fileName}`);
    
    // メタデータを明示的に設定
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        'originalFileName': file.name,
        'transactionId': transactionId,
        'uploadTimestamp': timestamp.toString()
      }
    };
    
    console.log('📤 Firebase Storage アップロード中...', {
      path: `transactions/${transactionId}/images/${fileName}`,
      contentType: metadata.contentType,
      blobSize: blob.size
    });
    
    const snapshot = await uploadBytes(storageRef, blob, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // アップロード数をカウント（使用量推定用）
    const currentCount = localStorage.getItem('firebase_image_count') || '0';
    localStorage.setItem('firebase_image_count', (parseInt(currentCount, 10) + 1).toString());
    
    console.log('✅ Firebase Storage アップロード完了', {
      URL: downloadURL,
      サイズ: `${Math.round(blob.size / 1024)} KB`,
      推定累計使用量: `${Math.round((parseInt(currentCount, 10) + 1) * 0.15)} MB`,
      fullPath: snapshot.ref.fullPath
    });
    
    return downloadURL;
    
  } catch (error: any) {
    console.error('❌ Firebase Storage アップロード失敗:', error);
    
    // エラータイプによる詳細分析
    if (error.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          throw new Error('Firebase Storageの権限がありません。セキュリティルールを確認してください。');
        case 'storage/canceled':
          throw new Error('アップロードがキャンセルされました。');
        case 'storage/unknown':
          throw new Error('不明なエラーが発生しました。ネットワーク接続を確認してください。');
        case 'storage/retry-limit-exceeded':
          throw new Error('アップロードのリトライ上限に達しました。しばらく後に再試行してください。');
        default:
          throw new Error(`Firebase Storageエラー (${error.code}): ${error.message}`);
      }
    }
    
    throw new Error(`Firebase Storageへのアップロードに失敗しました: ${error.message || error}`);
  }
};

// ハイブリッド画像保存（開発環境：ローカル優先、本番環境：Firebase優先）
export const saveImageHybrid = async (
  transactionId: string,
  file: File
): Promise<{ imageId?: string; imageUrl?: string; saveMethod: 'local' | 'firebase' }> => {
  console.log('🔄 ハイブリッド保存開始', {
    fileName: file.name,
    size: `${Math.round(file.size / 1024)} KB`,
    env: process.env.NODE_ENV
  });

  // Blazeプラン対応：Firebase Storage優先でデバイス間同期
  console.log('☁️ Firebase Storage優先モード（Blazeプラン・デバイス間同期対応）');
  
  // Firebase Storage設定状況をチェック
  const isFirebaseReady = await checkFirebaseStorageReady();
  
  if (isFirebaseReady) {
    console.log('🚀 Firebase Storage準備完了、デバイス間同期有効');
  } else {
    console.log('⚠️ Firebase Storage未準備、ローカル保存で一時対応');
    
    // Firebase未準備時のローカル保存
    try {
      const compressedBase64 = await resizeImage(file, 600, 400, 0.7);
      
      const usage = checkLocalStorageUsage();
      if (usage.percentage < 85) {
        const imageId = saveImageToLocalStorage(transactionId, compressedBase64);
        console.log('✅ ローカル保存成功（Firebase準備中）', {
          imageId,
          使用率: `${Math.round(usage.percentage)}%`
        });
        return { imageId, saveMethod: 'local' };
      }
    } catch (localError) {
      console.warn('⚠️ ローカル保存失敗', localError);
    }
  }

  // 2. Firebase Storageに保存（本番環境優先、または開発環境フォールバック）
  const storageStatus = await checkFirebaseStorageUsage();
  
  if (storageStatus.canUpload) {
    try {
      const imageUrl = await uploadImageToFirebaseStorage(transactionId, file);
      console.log('✅ Firebase保存成功（デバイス間同期対応）', { imageUrl });
      return { imageUrl, saveMethod: 'firebase' };
      
    } catch (firebaseError) {
      console.warn('⚠️ Firebase保存失敗', firebaseError);
      
      // Firebase失敗時のローカルフォールバック
      try {
        const compressedBase64 = await resizeImage(file, 600, 400, 0.7);
        const usage = checkLocalStorageUsage();
        
        if (usage.percentage < 90) {
          const imageId = saveImageToLocalStorage(transactionId, compressedBase64);
          console.log('✅ ローカル保存成功（Firebase失敗時フォールバック）', {
            imageId,
            使用率: `${Math.round(usage.percentage)}%`
          });
          return { imageId, saveMethod: 'local' };
        }
      } catch (localError) {
        console.error('❌ ローカル保存も失敗:', localError);
      }
      
      throw firebaseError;
    }
  } else {
    console.log('⚠️ Firebase無料枠上限、ローカルストレージを使用');
    
    try {
      const compressedBase64 = await resizeImage(file, 600, 400, 0.7);
      const usage = checkLocalStorageUsage();
      
      if (usage.percentage < 90) {
        const imageId = saveImageToLocalStorage(transactionId, compressedBase64);
        console.log('✅ ローカル保存成功（Firebase枠上限）', {
          imageId,
          使用率: `${Math.round(usage.percentage)}%`
        });
        return { imageId, saveMethod: 'local' };
      } else {
        throw new Error('ローカルストレージ容量不足');
      }
    } catch (localError) {
      console.error('❌ ローカル保存失敗:', localError);
      throw new Error('Firebase無料枠上限かつローカルストレージ容量不足です。');
    }
  }
};

// バッチ保存（Firebase優先、デバイス間同期対応）
export const saveImagesHybridBatch = async (
  transactionId: string,
  files: File[]
): Promise<Array<{ imageId?: string; imageUrl?: string; saveMethod: 'local' | 'firebase'; fileName: string }>> => {
  console.log('📦 ハイブリッドバッチ保存開始（デバイス間同期優先）', {
    ファイル数: files.length,
    総サイズ: `${Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024)} KB`
  });

  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`📦 処理中 ${i + 1}/${files.length}: ${file.name}`);
    
    try {
      const result = await saveImageHybrid(transactionId, file);
      results.push({
        ...result,
        fileName: file.name
      });
      
      // 連続アップロード時の負荷軽減（Firebaseの場合は少し長めに）
      if (i < files.length - 1) {
        const delay = result.saveMethod === 'firebase' ? 500 : 200;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      console.error(`❌ ファイル ${i + 1} 保存失敗: ${file.name}`, error);
      // エラーでも続行（部分保存）
      continue;
    }
  }
  
  console.log('📦 バッチ保存完了（デバイス間同期対応）', {
    成功数: results.length,
    Firebase: results.filter(r => r.saveMethod === 'firebase').length,
    ローカル: results.filter(r => r.saveMethod === 'local').length
  });
  
  return results;
};

// Firebase画像削除
export const deleteImageFromFirebaseStorage = async (imageUrl: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    console.log('🗑️ Firebase画像削除完了:', imageUrl);
  } catch (error) {
    console.warn('⚠️ Firebase画像削除失敗:', error);
    // 削除失敗は致命的ではないため、エラーを投げない
  }
};

// 画像をBase64に変換する関数
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

// 画像サイズを制限する関数（最大幅/高さを指定）
export const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // アスペクト比を維持しながらリサイズ
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 画像を描画
      ctx?.drawImage(img, 0, 0, width, height);

      // Base64として取得
      const resizedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(resizedBase64);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    
    // ファイルをImageオブジェクトに読み込み
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

// ローカルストレージに画像を保存
export const saveImageToLocalStorage = (transactionId: string, imageBase64: string): string => {
  const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const storageKey = `transaction_image_${transactionId}_${imageId}`;
  
  try {
    localStorage.setItem(storageKey, imageBase64);
    return imageId; // 画像IDを返す
  } catch (error) {
    console.error('ローカルストレージへの保存に失敗:', error);
    throw new Error('画像の保存に失敗しました。ストレージ容量が不足している可能性があります。');
  }
};

// ローカルストレージから画像を取得
export const getImageFromLocalStorage = (transactionId: string, imageId: string): string | null => {
  const storageKey = `transaction_image_${transactionId}_${imageId}`;
  return localStorage.getItem(storageKey);
};

// 統一画像表示機能（ローカル + Firebase URL対応）
export const getAllImagesForTransaction = (transaction: {
  id: string;
  imageIds?: string[];
  imageUrls?: string[];
}): Array<{ src: string; type: 'local' | 'firebase'; id?: string; url?: string }> => {
  const images: Array<{ src: string; type: 'local' | 'firebase'; id?: string; url?: string }> = [];
  
  // ローカルストレージの画像を追加
  if (transaction.imageIds && transaction.imageIds.length > 0) {
    transaction.imageIds.forEach((imageId) => {
      const imageData = getImageFromLocalStorage(transaction.id, imageId);
      if (imageData) {
        images.push({
          src: imageData,
          type: 'local',
          id: imageId
        });
      }
    });
  }
  
  // Firebase Storageの画像を追加
  if (transaction.imageUrls && transaction.imageUrls.length > 0) {
    transaction.imageUrls.forEach((url) => {
      images.push({
        src: url,
        type: 'firebase',
        url: url
      });
    });
  }
  
  return images;
};

// プレビュー用サムネイル生成（統一画像表示）
export const renderImageThumbnails = (
  transaction: { id: string; imageIds?: string[]; imageUrls?: string[] },
  options: {
    size?: number;
    maxCount?: number;
    onClick?: (images: Array<{ src: string; type: 'local' | 'firebase' }>, index: number) => void;
  } = {}
): React.ReactElement | null => {
  const { size = 60, maxCount = 5 } = options;
  const images = getAllImagesForTransaction(transaction);
  
  if (images.length === 0) return null;
  
  const displayImages = images.slice(0, maxCount);
  const remainingCount = Math.max(0, images.length - maxCount);
  
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginTop: '8px'
      }
    },
    [
      ...displayImages.map((image, index) => 
        React.createElement('img', {
          key: `img-${index}`,
          src: image.src,
          alt: `Transaction image ${index + 1}`,
          style: {
            width: size,
            height: size,
            objectFit: 'cover',
            borderRadius: '4px',
            cursor: options.onClick ? 'pointer' : 'default',
            border: '1px solid #ddd'
          },
          onClick: options.onClick ? () => options.onClick!(images, index) : undefined
        })
      ),
      // 残り枚数表示
      remainingCount > 0 ? React.createElement(
        'div',
        {
          key: 'more-count',
          style: {
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '12px',
            color: '#666'
          }
        },
        `+${remainingCount}`
      ) : null
    ].filter(Boolean)
  );
};

// Firebase Storage使用量監視アラート
export const checkStorageUsageAlert = async (): Promise<{
  shouldShowAlert: boolean;
  message: string;
  level: 'info' | 'warning' | 'error';
}> => {
  try {
    const firebaseUsage = await checkFirebaseStorageUsage();
    const localUsage = checkLocalStorageUsage();
    
    // Firebase Storage警告
    if (!firebaseUsage.canUpload) {
      return {
        shouldShowAlert: true,
        message: `Firebase Storage無料枠の上限に近づいています（推定: ${firebaseUsage.estimatedUsage.toFixed(1)}GB）。新しい画像はローカル保存されます。`,
        level: 'error'
      };
    }
    
    if (firebaseUsage.estimatedUsage > 3.5) {
      return {
        shouldShowAlert: true,
        message: `Firebase Storage使用量が多くなっています（推定: ${firebaseUsage.estimatedUsage.toFixed(1)}GB）。${firebaseUsage.recommendation}`,
        level: 'warning'
      };
    }
    
    // ローカルストレージ警告
    if (localUsage.percentage > 90) {
      return {
        shouldShowAlert: true,
        message: `ローカルストレージ容量が不足しています（${Math.round(localUsage.percentage)}%）。新しい画像はクラウド保存されます。`,
        level: 'warning'
      };
    }
    
    return {
      shouldShowAlert: false,
      message: '',
      level: 'info'
    };
    
  } catch (error) {
    return {
      shouldShowAlert: false,
      message: '',
      level: 'info'
    };
  }
};

// 取引に関連する全ての画像を取得
export const getTransactionImages = (transactionId: string): string[] => {
  const images: string[] = [];
  const prefix = `transaction_image_${transactionId}_`;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const imageData = localStorage.getItem(key);
      if (imageData) {
        images.push(imageData);
      }
    }
  }
  
  return images;
};

// 取引に関連する画像を削除
export const deleteTransactionImages = (transactionId: string): void => {
  const prefix = `transaction_image_${transactionId}_`;
  const keysToDelete: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => localStorage.removeItem(key));
};

// 特定の画像を削除
export const deleteImageFromLocalStorage = (transactionId: string, imageId: string): void => {
  const storageKey = `transaction_image_${transactionId}_${imageId}`;
  localStorage.removeItem(storageKey);
};

// ローカルストレージの使用量をチェック
export const checkLocalStorageUsage = (): { used: number; available: number; percentage: number } => {
  let used = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        used += key.length + value.length;
      }
    }
  }
  
  // 一般的にローカルストレージは5-10MBが上限
  const available = 5 * 1024 * 1024; // 5MB in bytes
  const percentage = (used / available) * 100;
  
  return { used, available, percentage };
};

// Firebase Storage準備状況チェック
export const checkFirebaseStorageReady = async (): Promise<boolean> => {
  try {
    // テスト用の小さなファイルでFirebase Storageの接続をテスト
    const testData = new Blob(['test'], { type: 'text/plain' });
    const testRef = ref(storage, `test/${Date.now()}_connection_test.txt`);
    
    console.log('🔍 Firebase Storage接続テスト中...');
    
    // 5秒以内でタイムアウト
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const uploadPromise = uploadBytes(testRef, testData).then(async (snapshot) => {
      // テストファイルをすぐ削除
      await deleteObject(snapshot.ref);
      return true;
    });
    
    await Promise.race([uploadPromise, timeoutPromise]);
    
    console.log('✅ Firebase Storage接続成功');
    return true;
    
  } catch (error) {
    console.warn('⚠️ Firebase Storage接続失敗:', error);
    return false;
  }
};
