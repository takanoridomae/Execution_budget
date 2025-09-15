import { doc, setDoc, getDoc, collection, query, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { BudgetSettingsMap, MonthlyBudgetSettings } from '../types';

// Firestoreコレクション名
const BUDGET_COLLECTION = 'budget_settings';

// デバイスIDを生成（ブラウザ固有のID）
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// 年月をキー文字列に変換 (例: 2024, 1 -> "2024-01")
const getYearMonthKey = (year: number, month: number): string => {
  return `${year}-${String(month).padStart(2, '0')}`;
};

// Firebase接続テスト
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Firebase Firestore接続テスト中...');
    const testDoc = doc(db, 'test', 'connection');
    await setDoc(testDoc, { timestamp: new Date().getTime() });
    console.log('✅ Firebase Firestore接続成功');
    return true;
  } catch (error) {
    console.warn('❌ Firebase Firestore接続失敗:', error);
    return false;
  }
};

// 単一の予算設定をFirestoreに保存
export const saveBudgetSettingToFirestore = async (
  year: number,
  month: number,
  settings: MonthlyBudgetSettings
): Promise<boolean> => {
  try {
    const yearMonthKey = getYearMonthKey(year, month);
    const deviceId = getDeviceId();
    
    const budgetDoc = doc(db, BUDGET_COLLECTION, yearMonthKey);
    await setDoc(budgetDoc, {
      ...settings,
      yearMonth: yearMonthKey,
      year,
      month,
      lastUpdated: new Date().getTime(),
      updatedBy: deviceId,
    });
    
    console.log(`✅ Firebase保存成功: ${year}年${month}月の予算設定`);
    return true;
  } catch (error) {
    console.error(`❌ Firebase保存失敗: ${year}年${month}月`, error);
    return false;
  }
};

// 単一の予算設定をFirestoreから取得
export const loadBudgetSettingFromFirestore = async (
  year: number,
  month: number
): Promise<MonthlyBudgetSettings | null> => {
  try {
    const yearMonthKey = getYearMonthKey(year, month);
    const budgetDoc = doc(db, BUDGET_COLLECTION, yearMonthKey);
    const docSnap = await getDoc(budgetDoc);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`✅ Firebase取得成功: ${year}年${month}月の予算設定`, data);
      return {
        monthlyBudget: data.monthlyBudget,
        savingsGoal: data.savingsGoal,
        breakdown: Array.isArray(data.breakdown) ? data.breakdown : [],
      };
    } else {
      console.log(`📝 Firebase: ${year}年${month}月の予算設定が見つかりません`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Firebase取得失敗: ${year}年${month}月`, error);
    return null;
  }
};

// 全ての予算設定をFirestoreから取得
export const loadAllBudgetSettingsFromFirestore = async (): Promise<BudgetSettingsMap> => {
  try {
    console.log('🔄 Firebase: 全予算設定を取得中...');
    const budgetQuery = query(collection(db, BUDGET_COLLECTION));
    const querySnapshot = await getDocs(budgetQuery);
    
    const budgetMap: BudgetSettingsMap = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      budgetMap[data.yearMonth] = {
        monthlyBudget: data.monthlyBudget,
        savingsGoal: data.savingsGoal,
        breakdown: Array.isArray(data.breakdown) ? data.breakdown : [],
      };
    });
    
    console.log(`✅ Firebase: ${Object.keys(budgetMap).length}件の予算設定を取得`, budgetMap);
    return budgetMap;
  } catch (error) {
    console.error('❌ Firebase: 全予算設定の取得失敗', error);
    return {};
  }
};

// ローカルの予算設定をFirestoreに一括アップロード
export const syncLocalBudgetToFirestore = async (localBudgetMap: BudgetSettingsMap): Promise<boolean> => {
  try {
    console.log('🔄 Firebase: ローカル予算設定を一括アップロード中...');
    const batch = writeBatch(db);
    
    Object.entries(localBudgetMap).forEach(([yearMonth, settings]) => {
      const docRef = doc(db, BUDGET_COLLECTION, yearMonth);
      batch.set(docRef, {
        ...settings,
        yearMonth,
        lastUpdated: new Date().getTime(),
        updatedBy: getDeviceId(),
      });
    });
    
    await batch.commit();
    console.log(`✅ Firebase: ${Object.keys(localBudgetMap).length}件の予算設定を一括アップロード完了`);
    return true;
  } catch (error) {
    console.error('❌ Firebase: 一括アップロード失敗', error);
    return false;
  }
};

// Firebase予算設定をローカルストレージに保存
export const saveBudgetMapToLocal = (budgetMap: BudgetSettingsMap): void => {
  try {
    localStorage.setItem('budget_settings_map', JSON.stringify(budgetMap));
    console.log('✅ ローカルストレージ保存成功: 予算設定マップ');
  } catch (error) {
    console.error('❌ ローカルストレージ保存失敗:', error);
  }
};

// デバイス間同期ステータスを表示
export const getBudgetSyncStatus = (): string => {
  const deviceId = getDeviceId();
  return `デバイスID: ${deviceId.substring(0, 12)}... (Firebase同期対応)`;
};
