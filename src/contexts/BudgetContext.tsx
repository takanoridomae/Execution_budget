import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BudgetSettingsMap, MonthlyBudgetSettings } from '../types';
import { 
  testFirebaseConnection,
  saveBudgetSettingToFirestore,
  loadAllBudgetSettingsFromFirestore,
  syncLocalBudgetToFirestore,
  saveBudgetMapToLocal,
  getBudgetSyncStatus
} from '../utils/budgetFirebase';

interface BudgetContextType {
  budgetSettingsMap: BudgetSettingsMap;
  getBudgetSettings: (year: number, month: number) => MonthlyBudgetSettings;
  updateBudgetSettings: (year: number, month: number, settings: MonthlyBudgetSettings) => Promise<void>;
  loading: boolean;
  syncStatus: string;
  forceSyncFromFirebase: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

interface BudgetProviderProps {
  children: ReactNode;
}

const BUDGET_SETTINGS_MAP_KEY = 'budget_settings_map';
const LEGACY_BUDGET_SETTINGS_KEY = 'budget_settings';

// 年月をキー文字列に変換 (例: 2024, 1 -> "2024-01")
const getYearMonthKey = (year: number, month: number): string => {
  return `${year}-${String(month).padStart(2, '0')}`;
};

// デフォルトの予算設定
const getDefaultBudgetSettings = (): MonthlyBudgetSettings => ({
  monthlyBudget: 200000,
  savingsGoal: 100000,
  breakdown: [],
});

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const [budgetSettingsMap, setBudgetSettingsMap] = useState<BudgetSettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>('初期化中...');
  const [isFirebaseReady, setIsFirebaseReady] = useState<boolean>(false);

  // 初期読み込み: Firebase同期対応
  useEffect(() => {
    const initializeBudgetSettings = async () => {
      try {
        setSyncStatus('Firebase接続テスト中...');
        
        // Firebase接続テスト
        const firebaseReady = await testFirebaseConnection();
        setIsFirebaseReady(firebaseReady);
        
        if (firebaseReady) {
          setSyncStatus('Firebase同期中...');
          console.log('🔄 Firebase同期モード: デバイス間予算設定同期開始');
          
          // Firebaseから最新データを取得
          const firebaseMap = await loadAllBudgetSettingsFromFirestore();
          
          // ローカルデータも読み込み
          const storedMap = localStorage.getItem(BUDGET_SETTINGS_MAP_KEY);
          let localMap: BudgetSettingsMap = {};
          
          if (storedMap) {
            localMap = JSON.parse(storedMap);
            console.log('📱 ローカル予算データ:', localMap);
          }
          
          // Firebase優先でマージ
          const mergedMap = { ...localMap, ...firebaseMap };
          
          console.log('☁️ Firebase予算データ:', firebaseMap);
          console.log('🔄 マージ後予算データ:', mergedMap);
          
          setBudgetSettingsMap(mergedMap);
          saveBudgetMapToLocal(mergedMap);
          
          // ローカルにFirebaseにない新しいデータがあればアップロード
          const newLocalKeys = Object.keys(localMap).filter(key => !firebaseMap[key]);
          if (newLocalKeys.length > 0) {
            console.log('📤 ローカル→Firebaseアップロード:', newLocalKeys);
            const uploadMap: BudgetSettingsMap = {};
            newLocalKeys.forEach(key => {
              uploadMap[key] = localMap[key];
            });
            await syncLocalBudgetToFirestore(uploadMap);
          }
          
          setSyncStatus(getBudgetSyncStatus());
        } else {
          setSyncStatus('オフライン（ローカル保存）');
          console.log('📱 ローカルモード: Firebase未接続');
          
          // ローカルストレージからのみ読み込み
          const storedMap = localStorage.getItem(BUDGET_SETTINGS_MAP_KEY);
          if (storedMap) {
            const parsedMap = JSON.parse(storedMap);
            setBudgetSettingsMap(parsedMap);
          }
        }
        
      } catch (error) {
        console.error('予算設定の初期化に失敗しました:', error);
        setSyncStatus('初期化エラー');
      } finally {
        setLoading(false);
      }
    };

    initializeBudgetSettings();
  }, []);

  // 指定年月の予算設定を取得（設定がない場合はデフォルト値）
  const getBudgetSettings = (year: number, month: number): MonthlyBudgetSettings => {
    const key = getYearMonthKey(year, month);
    const found = budgetSettingsMap[key];
    if (!found) return getDefaultBudgetSettings();
    return {
      monthlyBudget: found.monthlyBudget,
      savingsGoal: found.savingsGoal,
      breakdown: found.breakdown || [],
    };
  };

  // 指定年月の予算設定を更新（Firebase同期対応）
  const updateBudgetSettings = async (year: number, month: number, settings: MonthlyBudgetSettings) => {
    const key = getYearMonthKey(year, month);
    const newMap = {
      ...budgetSettingsMap,
      [key]: settings,
    };
    
    console.log(`🔄 予算設定更新: ${year}年${month}月`, settings);
    
    // ローカル更新
    setBudgetSettingsMap(newMap);
    saveBudgetMapToLocal(newMap);
    
    // Firebase同期
    if (isFirebaseReady) {
      try {
        await saveBudgetSettingToFirestore(year, month, settings);
        console.log('☁️ Firebase同期成功');
      } catch (error) {
        console.error('❌ Firebase同期失敗:', error);
      }
    } else {
      console.log('📱 オフライン: ローカル保存のみ');
    }
  };
  
  // 強制Firebase同期
  const forceSyncFromFirebase = async () => {
    if (!isFirebaseReady) {
      console.log('Firebase未接続: 同期不可');
      return;
    }
    
    try {
      setSyncStatus('強制同期中...');
      const firebaseMap = await loadAllBudgetSettingsFromFirestore();
      setBudgetSettingsMap(firebaseMap);
      saveBudgetMapToLocal(firebaseMap);
      setSyncStatus(getBudgetSyncStatus());
      console.log('✅ 強制同期完了');
    } catch (error) {
      console.error('❌ 強制同期失敗:', error);
      setSyncStatus('同期エラー');
    }
  };

  const value: BudgetContextType = {
    budgetSettingsMap,
    getBudgetSettings,
    updateBudgetSettings,
    loading,
    syncStatus,
    forceSyncFromFirebase,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};