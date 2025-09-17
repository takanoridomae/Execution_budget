import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SiteBudgetSettings, SiteBudgetSettingsMap } from '../types';
import {
  testSiteBudgetFirebaseConnection,
  saveSiteBudgetSettingToFirestore,
  loadAllSiteBudgetSettingsFromFirestore,
  loadSiteBudgetSettingsBySiteFromFirestore,
  saveSiteBudgetMapToLocal,
  loadSiteBudgetMapFromLocal,
  getSiteBudgetSyncStatus,
  getSiteYearMonthKey
} from '../utils/siteBudgetFirebase';

interface BudgetContextType {
  // 現場ベース予算機能のみ
  siteBudgetSettingsMap: SiteBudgetSettingsMap;
  getSiteBudgetSettings: (year: number, month: number, siteId: string) => SiteBudgetSettings | null;
  updateSiteBudgetSettings: (year: number, month: number, siteId: string, settings: SiteBudgetSettings) => Promise<void>;
  hasSiteBudgetSettings: (year: number, month: number, siteId: string) => boolean;
  getSiteBudgetSettingsBySite: (siteId: string) => SiteBudgetSettingsMap;
  loading: boolean;
  syncStatus: string;
  forceSyncFromFirebase: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

interface BudgetProviderProps {
  children: ReactNode;
}

// 現場ベース予算管理のみのコンテキスト

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  // 現場ベース予算状態のみ
  const [siteBudgetSettingsMap, setSiteBudgetSettingsMap] = useState<SiteBudgetSettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>('初期化中...');
  const [isFirebaseReady, setIsFirebaseReady] = useState<boolean>(false);

  // 現場ベース予算の初期読み込み
  useEffect(() => {
    const initializeSiteBudgetSettings = async () => {
      try {
        setSyncStatus('Firebase接続テスト中...');
        
        // Firebase接続テスト
        const firebaseReady = await testSiteBudgetFirebaseConnection();
        setIsFirebaseReady(firebaseReady);
        
        if (firebaseReady) {
          setSyncStatus('現場予算Firebase同期中...');
          console.log('🔄 現場予算Firebase同期モード開始');
          
          // Firebaseから最新データを取得
          const firebaseMap = await loadAllSiteBudgetSettingsFromFirestore();
          
          // ローカルデータも読み込み
          const localMap = loadSiteBudgetMapFromLocal();
          
          // Firebase優先でマージ
          const mergedMap = { ...localMap, ...firebaseMap };
          
          console.log('☁️ Firebase現場予算データ:', firebaseMap);
          console.log('🔄 マージ後現場予算データ:', mergedMap);
          
          setSiteBudgetSettingsMap(mergedMap);
          saveSiteBudgetMapToLocal(mergedMap);
          
          setSyncStatus(getSiteBudgetSyncStatus());
        } else {
          setSyncStatus('オフライン（ローカル保存）');
          console.log('📱 現場予算ローカルモード: Firebase未接続');
          
          // ローカルストレージからのみ読み込み
          const localMap = loadSiteBudgetMapFromLocal();
          setSiteBudgetSettingsMap(localMap);
        }
        
      } catch (error) {
        console.error('現場予算設定の初期化に失敗しました:', error);
        setSyncStatus('初期化エラー');
      } finally {
        setLoading(false);
      }
    };

    initializeSiteBudgetSettings();
  }, []);

  // 現場ベース予算の管理関数
  
  // 現場別予算設定を取得
  const getSiteBudgetSettings = (year: number, month: number, siteId: string): SiteBudgetSettings | null => {
    const key = getSiteYearMonthKey(year, month, siteId);
    return siteBudgetSettingsMap[key] || null;
  };

  // 現場別予算設定が存在するかチェック
  const hasSiteBudgetSettings = (year: number, month: number, siteId: string): boolean => {
    const key = getSiteYearMonthKey(year, month, siteId);
    return key in siteBudgetSettingsMap;
  };

  // 現場別予算設定を更新
  const updateSiteBudgetSettings = async (year: number, month: number, siteId: string, settings: SiteBudgetSettings) => {
    const key = getSiteYearMonthKey(year, month, siteId);
    const newMap = {
      ...siteBudgetSettingsMap,
      [key]: settings,
    };
    
    console.log(`🔄 現場予算設定更新: ${year}年${month}月 現場${siteId}`, settings);
    
    // ローカル更新
    setSiteBudgetSettingsMap(newMap);
    saveSiteBudgetMapToLocal(newMap);
    
    // Firebase同期
    if (isFirebaseReady) {
      try {
        await saveSiteBudgetSettingToFirestore(year, month, siteId, settings);
        console.log('☁️ 現場予算Firebase同期成功');
      } catch (error) {
        console.error('❌ 現場予算Firebase同期失敗:', error);
      }
    } else {
      console.log('📱 オフライン: 現場予算ローカル保存のみ');
    }
  };

  // 特定現場のすべての予算設定を取得
  const getSiteBudgetSettingsBySite = (siteId: string): SiteBudgetSettingsMap => {
    const result: SiteBudgetSettingsMap = {};
    Object.keys(siteBudgetSettingsMap).forEach(key => {
      if (siteBudgetSettingsMap[key].siteId === siteId) {
        result[key] = siteBudgetSettingsMap[key];
      }
    });
    return result;
  };

  // 強制Firebase同期
  const forceSyncFromFirebase = async () => {
    if (!isFirebaseReady) {
      console.log('現場予算Firebase未接続: 同期不可');
      return;
    }
    
    try {
      setSyncStatus('現場予算強制同期中...');
      const firebaseMap = await loadAllSiteBudgetSettingsFromFirestore();
      setSiteBudgetSettingsMap(firebaseMap);
      saveSiteBudgetMapToLocal(firebaseMap);
      setSyncStatus(getSiteBudgetSyncStatus());
      console.log('✅ 現場予算強制同期完了');
    } catch (error) {
      console.error('❌ 現場予算強制同期失敗:', error);
      setSyncStatus('同期エラー');
    }
  };

  const value: BudgetContextType = {
    siteBudgetSettingsMap,
    getSiteBudgetSettings,
    updateSiteBudgetSettings,
    hasSiteBudgetSettings,
    getSiteBudgetSettingsBySite,
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