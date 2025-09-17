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
import { SiteCategory } from '../types';

interface CategoryContextType {
  categories: SiteCategory[];
  getCategoriesBySite: (siteId: string) => SiteCategory[];
  getActiveCategoriesBySite: (siteId: string) => SiteCategory[];
  addCategory: (category: Omit<SiteCategory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCategory: (id: string, updates: Partial<Omit<SiteCategory, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => SiteCategory | null;
  getTotalBudgetBySite: (siteId: string) => number;
  loading: boolean;
  refreshCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

interface CategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider: React.FC<CategoryProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<SiteCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // カテゴリーデータを取得
  const fetchCategories = async () => {
    try {
      console.log('📂 カテゴリーデータを取得中...');
      
      const q = query(
        collection(db, 'SiteCategories'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SiteCategory[];
      
      console.log('📂 取得したカテゴリーデータ:', categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('❌ カテゴリーデータの取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 指定された現場のカテゴリーを取得
  const getCategoriesBySite = (siteId: string): SiteCategory[] => {
    return categories.filter(category => category.siteId === siteId);
  };

  // 指定された現場のアクティブなカテゴリーを取得
  const getActiveCategoriesBySite = (siteId: string): SiteCategory[] => {
    return categories.filter(category => 
      category.siteId === siteId && category.isActive
    );
  };

  // カテゴリーを追加
  const addCategory = async (categoryData: Omit<SiteCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const newCategory = {
        ...categoryData,
        createdAt: now,
        updatedAt: now,
      };
      
      console.log('📂 新しいカテゴリーを追加:', newCategory);
      
      const docRef = await addDoc(collection(db, 'SiteCategories'), newCategory);
      const categoryWithId: SiteCategory = {
        id: docRef.id,
        ...newCategory,
      };
      
      setCategories(prev => [categoryWithId, ...prev]);
      console.log('✅ カテゴリー追加成功:', categoryWithId);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ カテゴリー追加エラー:', error);
      throw error;
    }
  };

  // カテゴリーを更新
  const updateCategory = async (id: string, updates: Partial<Omit<SiteCategory, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      console.log('🔄 カテゴリー更新:', { id, updates: updateData });
      
      await updateDoc(doc(db, 'SiteCategories', id), updateData);
      
      setCategories(prev => prev.map(category => 
        category.id === id 
          ? { ...category, ...updateData }
          : category
      ));
      
      console.log('✅ カテゴリー更新成功');
    } catch (error) {
      console.error('❌ カテゴリー更新エラー:', error);
      throw error;
    }
  };

  // カテゴリーを削除
  const deleteCategory = async (id: string) => {
    try {
      console.log('🗑️ カテゴリー削除:', id);
      
      await deleteDoc(doc(db, 'SiteCategories', id));
      setCategories(prev => prev.filter(category => category.id !== id));
      
      console.log('✅ カテゴリー削除成功');
    } catch (error) {
      console.error('❌ カテゴリー削除エラー:', error);
      throw error;
    }
  };

  // IDでカテゴリーを取得
  const getCategoryById = (id: string): SiteCategory | null => {
    return categories.find(category => category.id === id) || null;
  };

  // 指定された現場のカテゴリーの予算合計を取得
  const getTotalBudgetBySite = (siteId: string): number => {
    const siteCategories = getActiveCategoriesBySite(siteId);
    return siteCategories.reduce((total, category) => total + category.budgetAmount, 0);
  };

  // データ再取得
  const refreshCategories = async () => {
    setLoading(true);
    await fetchCategories();
  };

  // 初期読み込み
  useEffect(() => {
    fetchCategories();
  }, []);

  const value: CategoryContextType = {
    categories,
    getCategoriesBySite,
    getActiveCategoriesBySite,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getTotalBudgetBySite,
    loading,
    refreshCategories,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};
