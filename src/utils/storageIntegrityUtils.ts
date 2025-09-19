// Firebase StorageとDBの整合性チェックユーティリティ

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Transaction, Site, SiteCategory, SiteIncome, SiteExpense } from '../types';

// 整合性チェック結果の型定義
export interface IntegrityIssue {
  id: string;
  entityType: 'transaction' | 'site' | 'siteCategory' | 'siteIncome' | 'siteExpense';
  entityId: string;
  issueType: 'missing_in_storage' | 'missing_in_db' | 'broken_url';
  field: 'imageUrls' | 'documentUrls';
  dbValue?: string[];
  storageFiles?: string[];
  description: string;
  entityData?: any;
}

export interface IntegrityCheckResult {
  totalChecked: number;
  issues: IntegrityIssue[];
  summary: {
    missingInStorage: number;
    missingInDb: number;
    brokenUrls: number;
  };
  checkTimestamp: string;
}

// ストレージパスからエンティティ情報を抽出
const parseStoragePath = (fullPath: string): { entityType: string; entityId: string; fileType: 'images' | 'documents' } | null => {
  // パス例: "transactions/txn_123/images/filename.jpg"
  // パス例: "sites/site_456/documents/filename.pdf"
  // パス例: "documents/category_789/filename.pdf"
  
  const parts = fullPath.split('/');
  
  if (parts.length >= 3) {
    const [folderType, entityId, fileType] = parts;
    
    if (folderType === 'transactions' && (fileType === 'images' || fileType === 'documents')) {
      return { entityType: 'transaction', entityId, fileType };
    }
    
    if (folderType === 'sites' && (fileType === 'images' || fileType === 'documents')) {
      return { entityType: 'site', entityId, fileType };
    }
    
    if (folderType === 'documents') {
      // カテゴリや収入・支出のドキュメント
      if (entityId.startsWith('category_')) {
        return { entityType: 'siteCategory', entityId, fileType: 'documents' };
      } else if (entityId.startsWith('income_')) {
        return { entityType: 'siteIncome', entityId, fileType: 'documents' };
      } else if (entityId.startsWith('expense_')) {
        return { entityType: 'siteExpense', entityId, fileType: 'documents' };
      }
    }
  }
  
  return null;
};

// URLからストレージパスを抽出
const extractStoragePathFromUrl = (url: string): string | null => {
  try {
    // Firebase Storage URLからパスを抽出
    const match = url.match(/\/o\/(.+?)\?/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  } catch (error) {
    console.error('URLからパス抽出失敗:', error);
  }
  return null;
};

// URLを正規化（Firebase Storage URLの比較用）
const normalizeFirebaseUrl = (url: string): string => {
  try {
    // URLオブジェクトで正規化
    const urlObj = new URL(url);
    
    // クエリパラメータを除去してベースURLを取得
    const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    
    // 重要なクエリパラメータのみ保持（altなど）
    const importantParams = ['alt'];
    const newParams = new URLSearchParams();
    
    importantParams.forEach(param => {
      const value = urlObj.searchParams.get(param);
      if (value) {
        newParams.set(param, value);
      }
    });
    
    const normalizedUrl = newParams.toString() ? `${baseUrl}?${newParams.toString()}` : baseUrl;
    return normalizedUrl;
  } catch (error) {
    console.warn('URL正規化失敗:', url, error);
    return url;
  }
};

// URLが有効かチェック
const isUrlAccessible = async (url: string): Promise<boolean> => {
  try {
    const storageRef = ref(storage, url);
    await getDownloadURL(storageRef);
    return true;
  } catch (error) {
    return false;
  }
};

// Firestoreの全コレクションからストレージフィールドを含むドキュメントを取得
export const getAllStorageFieldDocuments = async (): Promise<{
  transactions: Transaction[];
  sites: Site[];
  siteCategories: SiteCategory[];
  siteIncomes: SiteIncome[];
  siteExpenses: SiteExpense[];
}> => {
  console.log('🔍 ストレージフィールドを持つ全ドキュメントを取得中...');
  
  const results = {
    transactions: [] as Transaction[],
    sites: [] as Site[],
    siteCategories: [] as SiteCategory[],
    siteIncomes: [] as SiteIncome[],
    siteExpenses: [] as SiteExpense[]
  };

  try {
    // Transactionsコレクション
    const transactionsSnapshot = await getDocs(collection(db, 'Transactions'));
    transactionsSnapshot.forEach((doc) => {
      const data = doc.data() as Transaction;
      if (data.imageUrls?.length || data.documentUrls?.length) {
        results.transactions.push({ ...data, id: doc.id });
      }
    });

    // Sitesコレクション
    const sitesSnapshot = await getDocs(collection(db, 'Sites'));
    sitesSnapshot.forEach((doc) => {
      const data = doc.data() as Site;
      if (data.imageUrls?.length || data.documentUrls?.length) {
        results.sites.push({ ...data, id: doc.id });
      }
    });

    // SiteCategoriesコレクション
    const siteCategoriesSnapshot = await getDocs(collection(db, 'SiteCategories'));
    siteCategoriesSnapshot.forEach((doc) => {
      const data = doc.data() as SiteCategory;
      if (data.imageUrls?.length || data.documentUrls?.length) {
        results.siteCategories.push({ ...data, id: doc.id });
      }
    });

    // SiteIncomesコレクション
    const siteIncomesSnapshot = await getDocs(collection(db, 'SiteIncomes'));
    siteIncomesSnapshot.forEach((doc) => {
      const data = doc.data() as SiteIncome;
      if (data.imageUrls?.length || data.documentUrls?.length) {
        results.siteIncomes.push({ ...data, id: doc.id });
      }
    });

    // SiteExpensesコレクション
    const siteExpensesSnapshot = await getDocs(collection(db, 'SiteExpenses'));
    siteExpensesSnapshot.forEach((doc) => {
      const data = doc.data() as SiteExpense;
      if (data.imageUrls?.length || data.documentUrls?.length) {
        results.siteExpenses.push({ ...data, id: doc.id });
      }
    });

    console.log('✅ ドキュメント取得完了:', {
      transactions: results.transactions.length,
      sites: results.sites.length,
      siteCategories: results.siteCategories.length,
      siteIncomes: results.siteIncomes.length,
      siteExpenses: results.siteExpenses.length
    });

    return results;
  } catch (error) {
    console.error('❌ ドキュメント取得エラー:', error);
    throw error;
  }
};

// Firebase Storageの全ファイルリストを取得
export const getAllStorageFiles = async (): Promise<Array<{
  path: string;
  url: string;
  name: string;
  folder: string;
}>> => {
  console.log('🗂️ Firebase Storage内の全ファイルを取得中...');
  
  const allFiles: Array<{
    path: string;
    url: string;
    name: string;
    folder: string;
  }> = [];

  try {
    // 主要なフォルダをチェック
    const foldersToCheck = ['transactions', 'sites', 'documents'];
    
    for (const folder of foldersToCheck) {
      try {
        const folderRef = ref(storage, folder);
        await listFilesRecursively(folderRef, allFiles, folder);
      } catch (error) {
        console.warn(`⚠️ フォルダ ${folder} の取得に失敗:`, error);
        // 続行
      }
    }

    console.log('✅ Storage ファイル取得完了:', {
      totalFiles: allFiles.length,
      byFolder: allFiles.reduce((acc, file) => {
        acc[file.folder] = (acc[file.folder] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    return allFiles;
  } catch (error) {
    console.error('❌ Storage ファイル取得エラー:', error);
    return [];
  }
};

// 再帰的にファイルリストを取得
const listFilesRecursively = async (
  folderRef: any,
  allFiles: Array<{ path: string; url: string; name: string; folder: string }>,
  baseFolderName: string
): Promise<void> => {
  try {
    const result = await listAll(folderRef);
    
    // ファイルを処理
    for (const fileRef of result.items) {
      try {
        const url = await getDownloadURL(fileRef);
        allFiles.push({
          path: fileRef.fullPath,
          url,
          name: fileRef.name,
          folder: baseFolderName
        });
      } catch (error) {
        console.warn(`⚠️ ファイル ${fileRef.fullPath} のURL取得失敗:`, error);
      }
    }
    
    // サブフォルダを再帰的に処理
    for (const subFolderRef of result.prefixes) {
      await listFilesRecursively(subFolderRef, allFiles, baseFolderName);
    }
  } catch (error) {
    console.warn(`⚠️ フォルダ ${folderRef.fullPath} の処理中にエラー:`, error);
  }
};

// 整合性チェックを実行
export const checkStorageIntegrity = async (): Promise<IntegrityCheckResult> => {
  console.log('🔍 Firebase Storage 整合性チェック開始...');
  
  const issues: IntegrityIssue[] = [];
  let totalChecked = 0;

  try {
    // 1. DBからストレージフィールドを持つドキュメントを取得
    const dbDocuments = await getAllStorageFieldDocuments();
    
    // 2. Firebase Storageの全ファイルを取得
    const storageFiles = await getAllStorageFiles();
    
    // 3. DBのURL → Storageファイルの存在チェック
    await checkDbUrlsInStorage(dbDocuments, storageFiles, issues);
    
    // 4. StorageファイルがDBに参照されているかチェック
    await checkStorageFilesInDb(storageFiles, dbDocuments, issues);
    
    // 5. 総チェック数を計算
    totalChecked = Object.values(dbDocuments).reduce((sum, docs) => sum + docs.length, 0);
    
    const summary = {
      missingInStorage: issues.filter(i => i.issueType === 'missing_in_storage').length,
      missingInDb: issues.filter(i => i.issueType === 'missing_in_db').length,
      brokenUrls: issues.filter(i => i.issueType === 'broken_url').length
    };

    const result: IntegrityCheckResult = {
      totalChecked,
      issues,
      summary,
      checkTimestamp: new Date().toISOString()
    };

    console.log('✅ 整合性チェック完了:', {
      totalChecked,
      totalIssues: issues.length,
      summary
    });

    return result;
  } catch (error) {
    console.error('❌ 整合性チェックエラー:', error);
    throw error;
  }
};

// DBのURLがStorageに存在するかチェック
const checkDbUrlsInStorage = async (
  dbDocuments: Awaited<ReturnType<typeof getAllStorageFieldDocuments>>,
  storageFiles: Awaited<ReturnType<typeof getAllStorageFiles>>,
  issues: IntegrityIssue[]
): Promise<void> => {
  console.log('🔗 DB内のURLをStorage内でチェック中...');
  
  // URLを正規化してセットに追加（より正確な比較のため）
  const storageUrls = new Set(storageFiles.map(f => normalizeFirebaseUrl(f.url)));
  const storageUrlsOriginal = new Set(storageFiles.map(f => f.url));
  const storagePaths = new Set(storageFiles.map(f => f.path));
  
  // パス比較用のマップも作成
  const storagePathToUrl = new Map();
  storageFiles.forEach(f => {
    const path = extractStoragePathFromUrl(f.url);
    if (path) {
      storagePathToUrl.set(path, f.url);
    }
  });

  // Transactionsをチェック
  for (const transaction of dbDocuments.transactions) {
    await checkEntityUrls(transaction, 'transaction', storageUrls, storageUrlsOriginal, storagePathToUrl, issues);
  }

  // Sitesをチェック
  for (const site of dbDocuments.sites) {
    await checkEntityUrls(site, 'site', storageUrls, storageUrlsOriginal, storagePathToUrl, issues);
  }

  // SiteCategoriesをチェック
  for (const category of dbDocuments.siteCategories) {
    await checkEntityUrls(category, 'siteCategory', storageUrls, storageUrlsOriginal, storagePathToUrl, issues);
  }

  // SiteIncomesをチェック
  for (const income of dbDocuments.siteIncomes) {
    await checkEntityUrls(income, 'siteIncome', storageUrls, storageUrlsOriginal, storagePathToUrl, issues);
  }

  // SiteExpensesをチェック
  for (const expense of dbDocuments.siteExpenses) {
    await checkEntityUrls(expense, 'siteExpense', storageUrls, storageUrlsOriginal, storagePathToUrl, issues);
  }
};

// 単一エンティティのURLをチェック
const checkEntityUrls = async (
  entity: any,
  entityType: string,
  storageUrls: Set<string>,
  storageUrlsOriginal: Set<string>,
  storagePathToUrl: Map<string, string>,
  issues: IntegrityIssue[]
): Promise<void> => {
  const fieldsToCheck: Array<'imageUrls' | 'documentUrls'> = ['imageUrls', 'documentUrls'];
  
  for (const field of fieldsToCheck) {
    const urls = entity[field] as string[] | undefined;
    if (urls && urls.length > 0) {
      for (const url of urls) {
        let isFound = false;
        
        // 1. 元のURLで直接比較
        if (storageUrlsOriginal.has(url)) {
          isFound = true;
        }
        
        // 2. 正規化URLで比較
        if (!isFound) {
          const normalizedUrl = normalizeFirebaseUrl(url);
          if (storageUrls.has(normalizedUrl)) {
            isFound = true;
          }
        }
        
        // 3. パス比較（URLからパスを抽出して比較）
        if (!isFound) {
          const urlPath = extractStoragePathFromUrl(url);
          if (urlPath && storagePathToUrl.has(urlPath)) {
            isFound = true;
            console.log('✅ パス比較で一致:', {
              dbUrl: url,
              extractedPath: urlPath,
              storageUrl: storagePathToUrl.get(urlPath)
            });
          }
        }
        
        // 4. 見つからない場合のみアクセステストを実行
        if (!isFound) {
          console.log('🔍 URLが見つからないためアクセステスト実行:', {
            entityType,
            entityId: entity.id,
            field,
            url: url.substring(0, 100) + (url.length > 100 ? '...' : '')
          });
          
          const isAccessible = await isUrlAccessible(url);
          
          if (!isAccessible) {
            // 本当にアクセスできない場合のみ問題として記録
            issues.push({
              id: `${entityType}_${entity.id}_${field}_${url.substring(url.lastIndexOf('/') + 1)}`,
              entityType: entityType as any,
              entityId: entity.id,
              issueType: 'broken_url',
              field,
              dbValue: urls,
              description: `${field}のURL "${url}" にアクセスできません（破損したリンク）`,
              entityData: entity
            });
          } else {
            // アクセス可能だが一覧に見つからない場合は警告レベル
            console.log('⚠️ アクセス可能だがファイルリストに見つからない:', url);
          }
        }
      }
    }
  }
};

// StorageファイルがDBに参照されているかチェック
const checkStorageFilesInDb = async (
  storageFiles: Awaited<ReturnType<typeof getAllStorageFiles>>,
  dbDocuments: Awaited<ReturnType<typeof getAllStorageFieldDocuments>>,
  issues: IntegrityIssue[]
): Promise<void> => {
  console.log('📁 Storage内のファイルがDBで参照されているかチェック中...');
  
  // 全DBのURLを収集（正規化版と元のURLの両方）
  const allDbUrls = new Set<string>();
  const allDbUrlsNormalized = new Set<string>();
  
  Object.values(dbDocuments).forEach(docs => {
    docs.forEach(doc => {
      ['imageUrls', 'documentUrls'].forEach(field => {
        const urls = (doc as any)[field] as string[] | undefined;
        if (urls) {
          urls.forEach(url => {
            allDbUrls.add(url);
            allDbUrlsNormalized.add(normalizeFirebaseUrl(url));
          });
        }
      });
    });
  });

  // StorageファイルがDBに参照されているかチェック
  for (const file of storageFiles) {
    let isReferenced = false;
    
    // 1. 元のURLで確認
    if (allDbUrls.has(file.url)) {
      isReferenced = true;
    }
    
    // 2. 正規化URLで確認
    if (!isReferenced) {
      const normalizedFileUrl = normalizeFirebaseUrl(file.url);
      if (allDbUrlsNormalized.has(normalizedFileUrl)) {
        isReferenced = true;
      }
    }
    
    // 参照されていない場合のみ孤立ファイルとして記録
    if (!isReferenced) {
      const parsedPath = parseStoragePath(file.path);
      
      issues.push({
        id: `storage_orphan_${file.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
        entityType: (parsedPath?.entityType as any) || 'transaction',
        entityId: parsedPath?.entityId || 'unknown',
        issueType: 'missing_in_db',
        field: parsedPath?.fileType === 'images' ? 'imageUrls' : 'documentUrls',
        storageFiles: [file.path],
        description: `Storageファイル "${file.path}" がどのDBレコードからも参照されていません（孤立ファイル）`,
        entityData: { storageFile: file }
      });
    }
  }
};

// 不整合の修正：DBからStorageファイルへの参照を削除
export const fixRemoveDbReference = async (issue: IntegrityIssue): Promise<boolean> => {
  try {
    console.log('🔧 DB参照の削除を実行:', issue);
    
    const collectionName = getCollectionNameFromEntityType(issue.entityType);
    const docRef = doc(db, collectionName, issue.entityId);
    
    if (issue.dbValue && issue.dbValue.length > 0) {
      // 破損したURLを配列から削除
      const brokenUrl = issue.description.match(/"([^"]+)"/)?.[1];
      if (brokenUrl) {
        const updatedUrls = issue.dbValue.filter(url => url !== brokenUrl);
        await updateDoc(docRef, { [issue.field]: updatedUrls });
        
        console.log('✅ DB参照削除完了:', {
          entityType: issue.entityType,
          entityId: issue.entityId,
          field: issue.field,
          removedUrl: brokenUrl,
          remainingUrls: updatedUrls.length
        });
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ DB参照削除失敗:', error);
    return false;
  }
};

// 不整合の修正：孤立したStorageファイルを削除
export const fixDeleteOrphanFile = async (issue: IntegrityIssue): Promise<boolean> => {
  try {
    console.log('🗑️ 孤立ファイルの削除を実行:', issue);
    
    if (issue.entityData?.storageFile?.path) {
      const fileRef = ref(storage, issue.entityData.storageFile.path);
      await deleteObject(fileRef);
      
      console.log('✅ 孤立ファイル削除完了:', issue.entityData.storageFile.path);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ 孤立ファイル削除失敗:', error);
    return false;
  }
};

// エンティティタイプからコレクション名を取得
const getCollectionNameFromEntityType = (entityType: string): string => {
  switch (entityType) {
    case 'transaction': return 'Transactions';
    case 'site': return 'Sites';
    case 'siteCategory': return 'SiteCategories';
    case 'siteIncome': return 'SiteIncomes';
    case 'siteExpense': return 'SiteExpenses';
    default: return 'Transactions';
  }
};

// 整合性チェック結果をローカルストレージに保存
export const saveIntegrityCheckResult = (result: IntegrityCheckResult): void => {
  try {
    localStorage.setItem('storage_integrity_check_result', JSON.stringify(result));
    console.log('💾 整合性チェック結果をローカル保存完了');
  } catch (error) {
    console.error('❌ 整合性チェック結果の保存失敗:', error);
  }
};

// 保存された整合性チェック結果を取得
export const loadIntegrityCheckResult = (): IntegrityCheckResult | null => {
  try {
    const stored = localStorage.getItem('storage_integrity_check_result');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('❌ 整合性チェック結果の読み込み失敗:', error);
  }
  return null;
};

// 一括修正：全ての破損リンクをDBから削除
export const fixAllBrokenLinks = async (issues: IntegrityIssue[]): Promise<{
  fixed: number;
  failed: number;
  errors: string[];
}> => {
  console.log('🔧 全ての破損リンクを一括修正開始...', { totalIssues: issues.length });
  
  const brokenLinkIssues = issues.filter(issue => 
    issue.issueType === 'broken_url' || issue.issueType === 'missing_in_storage'
  );
  
  let fixed = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (const issue of brokenLinkIssues) {
    try {
      const success = await fixRemoveDbReference(issue);
      if (success) {
        fixed++;
        console.log(`✅ 修正完了: ${issue.entityType}/${issue.entityId}/${issue.field}`);
      } else {
        failed++;
        errors.push(`修正失敗: ${issue.entityType}/${issue.entityId} - 参照削除に失敗`);
      }
      
      // APIレート制限を避けるため、少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      failed++;
      const errorMsg = `修正エラー: ${issue.entityType}/${issue.entityId} - ${error}`;
      errors.push(errorMsg);
      console.error('❌', errorMsg);
    }
  }
  
  console.log('🔧 一括修正完了:', { fixed, failed, totalErrors: errors.length });
  return { fixed, failed, errors };
};

// 一括修正：全ての孤立ファイルをStorageから削除
export const fixAllOrphanFiles = async (issues: IntegrityIssue[]): Promise<{
  deleted: number;
  failed: number;
  errors: string[];
}> => {
  console.log('🗑️ 全ての孤立ファイルを一括削除開始...', { totalIssues: issues.length });
  
  const orphanFileIssues = issues.filter(issue => issue.issueType === 'missing_in_db');
  
  let deleted = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (const issue of orphanFileIssues) {
    try {
      const success = await fixDeleteOrphanFile(issue);
      if (success) {
        deleted++;
        console.log(`✅ 削除完了: ${issue.storageFiles?.[0] || '不明'}`);
      } else {
        failed++;
        errors.push(`削除失敗: ${issue.storageFiles?.[0] || '不明'} - ファイル削除に失敗`);
      }
      
      // APIレート制限を避けるため、少し待機
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      failed++;
      const errorMsg = `削除エラー: ${issue.storageFiles?.[0] || '不明'} - ${error}`;
      errors.push(errorMsg);
      console.error('❌', errorMsg);
    }
  }
  
  console.log('🗑️ 一括削除完了:', { deleted, failed, totalErrors: errors.length });
  return { deleted, failed, errors };
};

// 整合性チェック統計の生成
export const generateIntegrityReport = (result: IntegrityCheckResult): {
  entitySummary: Record<string, { total: number; issues: number }>;
  fieldSummary: Record<string, { total: number; issues: number }>;
  issueSeverity: { critical: number; warning: number; info: number };
  recommendations: string[];
} => {
  const entitySummary: Record<string, { total: number; issues: number }> = {};
  const fieldSummary: Record<string, { total: number; issues: number }> = {};
  
  // エンティティ別統計
  result.issues.forEach(issue => {
    if (!entitySummary[issue.entityType]) {
      entitySummary[issue.entityType] = { total: 0, issues: 0 };
    }
    entitySummary[issue.entityType].issues++;
    
    if (!fieldSummary[issue.field]) {
      fieldSummary[issue.field] = { total: 0, issues: 0 };
    }
    fieldSummary[issue.field].issues++;
  });
  
  // 重要度別統計
  const issueSeverity = {
    critical: result.issues.filter(i => i.issueType === 'broken_url').length,
    warning: result.issues.filter(i => i.issueType === 'missing_in_storage').length,
    info: result.issues.filter(i => i.issueType === 'missing_in_db').length
  };
  
  // 推奨事項の生成
  const recommendations: string[] = [];
  
  if (issueSeverity.critical > 0) {
    recommendations.push(`${issueSeverity.critical}件の破損リンクがあります。データベースから無効なURLを削除することをお勧めします。`);
  }
  
  if (issueSeverity.warning > 0) {
    recommendations.push(`${issueSeverity.warning}件のファイルがStorageに見つかりません。データの同期を確認してください。`);
  }
  
  if (issueSeverity.info > 0) {
    recommendations.push(`${issueSeverity.info}件の孤立ファイルがあります。不要なファイルの削除を検討してください。`);
  }
  
  if (result.issues.length === 0) {
    recommendations.push('整合性に問題はありません。定期的なチェックを継続することをお勧めします。');
  }
  
  return {
    entitySummary,
    fieldSummary,
    issueSeverity,
    recommendations
  };
};

// 整合性チェック履歴の管理
export const saveIntegrityCheckHistory = (result: IntegrityCheckResult): void => {
  try {
    const historyKey = 'storage_integrity_check_history';
    const existing = localStorage.getItem(historyKey);
    const history = existing ? JSON.parse(existing) : [];
    
    // 履歴に追加（最新10件まで保持）
    history.unshift({
      timestamp: result.checkTimestamp,
      totalChecked: result.totalChecked,
      totalIssues: result.issues.length,
      summary: result.summary
    });
    
    // 最新10件のみ保持
    const limitedHistory = history.slice(0, 10);
    
    localStorage.setItem(historyKey, JSON.stringify(limitedHistory));
    console.log('📋 整合性チェック履歴を保存:', limitedHistory.length, '件');
  } catch (error) {
    console.error('❌ 整合性チェック履歴の保存失敗:', error);
  }
};

// 整合性チェック履歴の取得
export const loadIntegrityCheckHistory = (): Array<{
  timestamp: string;
  totalChecked: number;
  totalIssues: number;
  summary: IntegrityCheckResult['summary'];
}> => {
  try {
    const historyKey = 'storage_integrity_check_history';
    const stored = localStorage.getItem(historyKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('❌ 整合性チェック履歴の読み込み失敗:', error);
  }
  return [];
};
