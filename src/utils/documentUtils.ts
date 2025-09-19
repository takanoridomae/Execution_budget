// 書類管理ユーティリティ関数（ローカルストレージ + Firebase Storage対応）

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

// サポートするドキュメントファイル形式
export const SUPPORTED_DOCUMENT_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/csv': ['.csv']
};

// ファイル拡張子からMIMEタイプを取得
export const getFileType = (fileName: string): string => {
  const extension = fileName.toLowerCase().split('.').pop();
  for (const [mimeType, extensions] of Object.entries(SUPPORTED_DOCUMENT_TYPES)) {
    if (extensions.includes(`.${extension}`)) {
      return mimeType;
    }
  }
  return 'application/octet-stream';
};

// ファイルサイズ制限チェック（10MB）
export const validateFileSize = (file: File): boolean => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return file.size <= maxSize;
};

// サポートされているファイル形式かチェック
export const validateFileType = (file: File): boolean => {
  const mimeType = file.type || getFileType(file.name);
  return Object.keys(SUPPORTED_DOCUMENT_TYPES).includes(mimeType);
};

// ファイルをBase64に変換（ドキュメント用）
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

// ローカルストレージに書類を保存
export const saveDocumentToLocalStorage = (entityId: string, fileData: string, fileName: string, fileType: string): string => {
  const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const storageKey = `document_${entityId}_${documentId}`;
  
  const documentData = {
    id: documentId,
    fileName,
    fileType,
    data: fileData,
    uploadedAt: new Date().toISOString()
  };
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(documentData));
    console.log('📄 ローカルストレージ書類保存成功:', {
      entityId,
      documentId,
      fileName,
      fileType,
      size: `${Math.round(fileData.length / 1024)} KB`
    });
    return documentId;
  } catch (error) {
    console.error('❌ ローカルストレージ書類保存失敗:', error);
    throw new Error('書類の保存に失敗しました。ストレージ容量が不足している可能性があります。');
  }
};

// ローカルストレージから書類を取得
export const getDocumentFromLocalStorage = (entityId: string, documentId: string): {
  id: string;
  fileName: string;
  fileType: string;
  data: string;
  uploadedAt: string;
} | null => {
  const storageKey = `document_${entityId}_${documentId}`;
  const documentData = localStorage.getItem(storageKey);
  
  if (!documentData) {
    console.log('📄 ローカルストレージ書類取得失敗:', {
      entityId,
      documentId,
      storageKey
    });
    return null;
  }
  
  try {
    const parsed = JSON.parse(documentData);
    console.log('📄 ローカルストレージ書類取得成功:', {
      entityId,
      documentId,
      fileName: parsed.fileName,
      size: `${Math.round(parsed.data.length / 1024)} KB`
    });
    return parsed;
  } catch (error) {
    console.error('❌ ローカルストレージ書類データ解析失敗:', error);
    return null;
  }
};

// Firebase Storageに書類をアップロード
export const uploadDocumentToFirebaseStorage = async (
  entityId: string,
  file: File,
  folderPath: string = 'documents'
): Promise<string> => {
  console.log('☁️ Firebase Storage書類アップロード開始', {
    fileName: file.name,
    size: `${Math.round(file.size / 1024)} KB`,
    entityId,
    folderPath
  });

  try {
    // Base64変換
    const fileData = await fileToBase64(file);
    const base64Data = fileData.split(',')[1]; // data:...;base64, の部分を削除
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: file.type });
    
    // Firebase Storageにアップロード
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const storageRef = ref(storage, `${folderPath}/${entityId}/${fileName}`);
    
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'originalFileName': file.name,
        'entityId': entityId,
        'uploadTimestamp': timestamp.toString(),
        'fileSize': file.size.toString()
      }
    };
    
    console.log('📤 Firebase Storage書類アップロード中...', {
      path: `${folderPath}/${entityId}/${fileName}`,
      contentType: metadata.contentType,
      blobSize: blob.size
    });
    
    const snapshot = await uploadBytes(storageRef, blob, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Firebase Storage書類アップロード完了', {
      URL: downloadURL,
      size: `${Math.round(blob.size / 1024)} KB`,
      fullPath: snapshot.ref.fullPath
    });
    
    return downloadURL;
    
  } catch (error: any) {
    console.error('❌ Firebase Storage書類アップロード失敗:', error);
    
    if (error.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          throw new Error('Firebase Storageの権限がありません。');
        case 'storage/canceled':
          throw new Error('アップロードがキャンセルされました。');
        case 'storage/unknown':
          throw new Error('不明なエラーが発生しました。ネットワーク接続を確認してください。');
        default:
          throw new Error(`Firebase Storageエラー (${error.code}): ${error.message}`);
      }
    }
    
    throw new Error(`書類のアップロードに失敗しました: ${error.message || error}`);
  }
};

// ハイブリッド書類保存（Firebase優先、ローカルフォールバック）
export const saveDocumentHybrid = async (
  entityId: string,
  file: File,
  folderPath: string = 'documents'
): Promise<{ documentId?: string; documentUrl?: string; saveMethod: 'local' | 'firebase' }> => {
  console.log('🔄 ハイブリッド書類保存開始', {
    fileName: file.name,
    size: `${Math.round(file.size / 1024)} KB`,
    entityId,
    folderPath
  });

  // ファイル検証
  if (!validateFileType(file)) {
    throw new Error(`サポートされていないファイル形式です: ${file.name}`);
  }
  
  if (!validateFileSize(file)) {
    throw new Error(`ファイルサイズが10MBを超えています: ${file.name}`);
  }

  // Firebase Storageに保存を試行
  try {
    const documentUrl = await uploadDocumentToFirebaseStorage(entityId, file, folderPath);
    console.log('✅ Firebase書類保存成功', { documentUrl });
    return { documentUrl, saveMethod: 'firebase' };
    
  } catch (firebaseError) {
    console.warn('⚠️ Firebase書類保存失敗、ローカル保存にフォールバック:', firebaseError);
    
    // ローカルストレージに保存
    try {
      const fileData = await fileToBase64(file);
      const documentId = saveDocumentToLocalStorage(entityId, fileData, file.name, file.type);
      console.log('✅ ローカル書類保存成功（Firebase失敗時フォールバック）', { documentId });
      return { documentId, saveMethod: 'local' };
      
    } catch (localError) {
      console.error('❌ ローカル書類保存も失敗:', localError);
      throw new Error('書類の保存に失敗しました。ストレージ容量を確認してください。');
    }
  }
};

// 複数書類のバッチ保存
export const saveDocumentsHybridBatch = async (
  entityId: string,
  files: File[],
  folderPath: string = 'documents'
): Promise<Array<{ documentId?: string; documentUrl?: string; saveMethod: 'local' | 'firebase'; fileName: string }>> => {
  console.log('📦 ハイブリッド書類バッチ保存開始', {
    ファイル数: files.length,
    総サイズ: `${Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024)} KB`,
    entityId
  });

  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`📄 処理中 ${i + 1}/${files.length}: ${file.name}`);
    
    try {
      const result = await saveDocumentHybrid(entityId, file, folderPath);
      results.push({
        ...result,
        fileName: file.name
      });
      
      // 連続アップロード時の負荷軽減
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`❌ ファイル ${i + 1} 保存失敗: ${file.name}`, error);
      // エラーでも続行（部分保存）
      continue;
    }
  }
  
  console.log('📦 書類バッチ保存完了', {
    成功数: results.length,
    Firebase: results.filter(r => r.saveMethod === 'firebase').length,
    ローカル: results.filter(r => r.saveMethod === 'local').length
  });
  
  return results;
};

// Firebase Storage書類削除
export const deleteDocumentFromFirebaseStorage = async (documentUrl: string): Promise<void> => {
  try {
    const documentRef = ref(storage, documentUrl);
    await deleteObject(documentRef);
    console.log('🗑️ Firebase書類削除完了:', documentUrl);
  } catch (error) {
    console.warn('⚠️ Firebase書類削除失敗:', error);
    // 削除失敗は致命的ではないため、エラーを投げない
  }
};

// ローカルストレージ書類削除
export const deleteDocumentFromLocalStorage = (entityId: string, documentId: string): void => {
  const storageKey = `document_${entityId}_${documentId}`;
  
  const existsBefore = localStorage.getItem(storageKey) !== null;
  console.log('🗑️ ローカルストレージ書類削除:', {
    entityId,
    documentId,
    storageKey,
    削除前存在: existsBefore
  });
  
  localStorage.removeItem(storageKey);
  
  const existsAfter = localStorage.getItem(storageKey) !== null;
  console.log('🗑️ ローカルストレージ書類削除完了:', {
    storageKey,
    削除後存在: existsAfter,
    削除成功: existsBefore && !existsAfter
  });
};

// エンティティに関連する全ての書類を取得
export const getAllDocumentsForEntity = (entityId: string): Array<{
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  source: 'local' | 'firebase';
  data?: string;
  url?: string;
}> => {
  const documents: Array<{
    id: string;
    fileName: string;
    fileType: string;
    uploadedAt: string;
    source: 'local' | 'firebase';
    data?: string;
    url?: string;
  }> = [];
  
  // ローカルストレージの書類を検索
  const prefix = `document_${entityId}_`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const documentData = localStorage.getItem(key);
      if (documentData) {
        try {
          const parsed = JSON.parse(documentData);
          documents.push({
            id: parsed.id,
            fileName: parsed.fileName,
            fileType: parsed.fileType,
            uploadedAt: parsed.uploadedAt,
            source: 'local',
            data: parsed.data
          });
        } catch (error) {
          console.warn('書類データ解析失敗:', key, error);
        }
      }
    }
  }
  
  return documents;
};

// ファイルアイコン取得
export const getDocumentIcon = (fileName: string): string => {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📋';
    case 'txt':
      return '📃';
    case 'csv':
      return '📈';
    default:
      return '📁';
  }
};

// ファイルサイズを人間が読みやすい形式に変換
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
