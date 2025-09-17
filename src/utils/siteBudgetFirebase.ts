import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { SiteBudgetSettings, SiteBudgetSettingsMap } from '../types';

// 現場予算設定のFirebase操作ユーティリティ

// 年月と現場IDから複合キーを生成
export const getSiteYearMonthKey = (year: number, month: number, siteId: string): string => {
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
  return `${yearMonth}_${siteId}`;
};

// 現場別予算設定をFirestoreに保存
export const saveSiteBudgetSettingToFirestore = async (
  year: number, 
  month: number, 
  siteId: string, 
  settings: SiteBudgetSettings
): Promise<void> => {
  try {
    const key = getSiteYearMonthKey(year, month, siteId);
    const docRef = doc(db, 'SiteBudgetSettings', key);
    
    const saveData = {
      ...settings,
      yearMonth: `${year}-${String(month).padStart(2, '0')}`,
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(docRef, saveData);
    console.log('💾 現場予算設定保存成功:', { key, settings: saveData });
  } catch (error) {
    console.error('❌ 現場予算設定保存エラー:', error);
    throw error;
  }
};

// 特定の現場・年月の予算設定をFirestoreから取得
export const loadSiteBudgetSettingFromFirestore = async (
  year: number, 
  month: number, 
  siteId: string
): Promise<SiteBudgetSettings | null> => {
  try {
    const key = getSiteYearMonthKey(year, month, siteId);
    const docRef = doc(db, 'SiteBudgetSettings', key);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as SiteBudgetSettings;
      console.log('📖 現場予算設定取得成功:', { key, data });
      return data;
    }
    
    console.log('📖 現場予算設定なし:', key);
    return null;
  } catch (error) {
    console.error('❌ 現場予算設定取得エラー:', error);
    return null;
  }
};

// すべての現場予算設定をFirestoreから取得
export const loadAllSiteBudgetSettingsFromFirestore = async (): Promise<SiteBudgetSettingsMap> => {
  try {
    console.log('📖 全現場予算設定取得開始');
    
    const querySnapshot = await getDocs(collection(db, 'SiteBudgetSettings'));
    const settingsMap: SiteBudgetSettingsMap = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as SiteBudgetSettings;
      settingsMap[doc.id] = data;
    });
    
    console.log('📖 全現場予算設定取得成功:', settingsMap);
    return settingsMap;
  } catch (error) {
    console.error('❌ 全現場予算設定取得エラー:', error);
    return {};
  }
};

// 特定の現場のすべての予算設定を取得
export const loadSiteBudgetSettingsBySiteFromFirestore = async (siteId: string): Promise<SiteBudgetSettingsMap> => {
  try {
    console.log('📖 現場別予算設定取得開始:', siteId);
    
    const q = query(
      collection(db, 'SiteBudgetSettings'),
      where('siteId', '==', siteId)
    );
    
    const querySnapshot = await getDocs(q);
    const settingsMap: SiteBudgetSettingsMap = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as SiteBudgetSettings;
      settingsMap[doc.id] = data;
    });
    
    console.log('📖 現場別予算設定取得成功:', { siteId, settingsMap });
    return settingsMap;
  } catch (error) {
    console.error('❌ 現場別予算設定取得エラー:', error);
    return {};
  }
};

// ローカルストレージの操作
const SITE_BUDGET_SETTINGS_MAP_KEY = 'site_budget_settings_map';

export const saveSiteBudgetMapToLocal = (settingsMap: SiteBudgetSettingsMap): void => {
  try {
    localStorage.setItem(SITE_BUDGET_SETTINGS_MAP_KEY, JSON.stringify(settingsMap));
    console.log('💾 現場予算設定ローカル保存成功');
  } catch (error) {
    console.error('❌ 現場予算設定ローカル保存エラー:', error);
  }
};

export const loadSiteBudgetMapFromLocal = (): SiteBudgetSettingsMap => {
  try {
    const stored = localStorage.getItem(SITE_BUDGET_SETTINGS_MAP_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('📱 現場予算設定ローカル読み込み成功:', parsed);
      return parsed;
    }
    return {};
  } catch (error) {
    console.error('❌ 現場予算設定ローカル読み込みエラー:', error);
    return {};
  }
};

// Firebase接続テスト
export const testSiteBudgetFirebaseConnection = async (): Promise<boolean> => {
  try {
    // テスト用のドキュメント参照を作成（実際には作成しない）
    const testDocRef = doc(db, 'SiteBudgetSettings', '__test__');
    await getDoc(testDocRef);
    console.log('✅ 現場予算Firebase接続テスト成功');
    return true;
  } catch (error) {
    console.error('❌ 現場予算Firebase接続テスト失敗:', error);
    return false;
  }
};

// 現場予算同期ステータス取得
export const getSiteBudgetSyncStatus = (): string => {
  const now = new Date();
  return `最終同期: ${now.toLocaleString('ja-JP')}`;
};
