import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getDocs, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Site } from '../types';

interface SiteContextType {
  sites: Site[];
  activeSites: Site[];
  selectedSiteId: string | null;
  addSite: (site: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSite: (id: string, updates: Partial<Omit<Site, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteSite: (id: string) => Promise<void>;
  setSelectedSiteId: (siteId: string | null) => void;
  getSelectedSite: () => Site | null;
  loading: boolean;
  refreshSites: () => Promise<void>;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const useSites = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSites must be used within a SiteProvider');
  }
  return context;
};

interface SiteProviderProps {
  children: ReactNode;
}

const SELECTED_SITE_KEY = 'selected_site_id';

export const SiteProvider: React.FC<SiteProviderProps> = ({ children }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteIdState] = useState<string | null>(
    localStorage.getItem(SELECTED_SITE_KEY)
  );

  // 現場データを取得
  const fetchSites = async () => {
    try {
      console.log('🏗️ 現場データを取得中...');
      
      const q = query(
        collection(db, 'Sites'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sitesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Site[];
      
      console.log('🏗️ 取得した現場データ:', sitesData);
      setSites(sitesData);
    } catch (error) {
      console.error('❌ 現場データの取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 現場を追加
  const addSite = async (siteData: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const newSite = {
        ...siteData,
        createdAt: now,
        updatedAt: now,
      };
      
      console.log('🏗️ 新しい現場を追加:', newSite);
      
      const docRef = await addDoc(collection(db, 'Sites'), newSite);
      const siteWithId: Site = {
        id: docRef.id,
        ...newSite,
      };
      
      setSites(prev => [siteWithId, ...prev]);
      console.log('✅ 現場追加成功:', siteWithId);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ 現場追加エラー:', error);
      throw error;
    }
  };

  // 現場を更新
  const updateSite = async (id: string, updates: Partial<Omit<Site, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      console.log('🔄 現場更新:', { id, updates: updateData });
      
      await updateDoc(doc(db, 'Sites', id), updateData);
      
      setSites(prev => prev.map(site => 
        site.id === id 
          ? { ...site, ...updateData }
          : site
      ));
      
      console.log('✅ 現場更新成功');
    } catch (error) {
      console.error('❌ 現場更新エラー:', error);
      throw error;
    }
  };

  // 現場を削除
  const deleteSite = async (id: string) => {
    try {
      console.log('🗑️ 現場削除:', id);
      
      await deleteDoc(doc(db, 'Sites', id));
      setSites(prev => prev.filter(site => site.id !== id));
      
      // 削除した現場が選択されていた場合、選択をクリア
      if (selectedSiteId === id) {
        setSelectedSiteId(null);
      }
      
      console.log('✅ 現場削除成功');
    } catch (error) {
      console.error('❌ 現場削除エラー:', error);
      throw error;
    }
  };

  // 選択された現場を設定
  const setSelectedSiteId = (siteId: string | null) => {
    setSelectedSiteIdState(siteId);
    if (siteId) {
      localStorage.setItem(SELECTED_SITE_KEY, siteId);
    } else {
      localStorage.removeItem(SELECTED_SITE_KEY);
    }
    console.log('🎯 現場選択:', siteId);
  };

  // 選択された現場を取得
  const getSelectedSite = (): Site | null => {
    if (!selectedSiteId) return null;
    return sites.find(site => site.id === selectedSiteId) || null;
  };

  // アクティブな現場のみを取得
  const activeSites = sites.filter(site => site.isActive);

  // データ再取得
  const refreshSites = async () => {
    setLoading(true);
    await fetchSites();
  };

  // 初期読み込み
  useEffect(() => {
    fetchSites();
  }, []);

  const value: SiteContextType = {
    sites,
    activeSites,
    selectedSiteId,
    addSite,
    updateSite,
    deleteSite,
    setSelectedSiteId,
    getSelectedSite,
    loading,
    refreshSites,
  };

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
};
