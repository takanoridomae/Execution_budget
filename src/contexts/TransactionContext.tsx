import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDocs, collection, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { arrayUnion } from 'firebase/firestore';
import { Transaction, SiteTransaction } from '../types';

interface TransactionContextType {
  // 既存のトランザクション機能
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<string>;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  loading: boolean;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  isDateClicked: boolean;
  setIsDateClicked: (clicked: boolean) => void;
  showTransactionForm: boolean;
  setShowTransactionForm: (show: boolean) => void;
  addImagesToTransaction: (id: string, files: File[]) => Promise<void>;
  // 取引明細モーダルの状態
  showTransactionDetailsModal: boolean;
  setShowTransactionDetailsModal: (show: boolean) => void;
  
  // 新しい現場ベーストランザクション機能
  siteTransactions: SiteTransaction[];
  addSiteTransaction: (transaction: Omit<SiteTransaction, 'id'>) => Promise<string>;
  updateSiteTransaction: (id: string, updates: Partial<Omit<SiteTransaction, 'id'>>) => Promise<void>;
  deleteSiteTransaction: (id: string) => Promise<void>;
  getSiteTransactionsBySite: (siteId: string) => SiteTransaction[];
  getSiteTransactionsByCategory: (categoryId: string) => SiteTransaction[];
  getSiteTransactionsBySiteAndCategory: (siteId: string, categoryId: string) => SiteTransaction[];
  siteTransactionLoading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  console.log('🚀 TransactionProvider コンポーネントが初期化されています...');
  
  // 既存のトランザクション状態
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isDateClicked, setIsDateClicked] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showTransactionDetailsModal, setShowTransactionDetailsModal] = useState(false);
  
  // 新しい現場ベーストランザクション状態
  const [siteTransactions, setSiteTransactions] = useState<SiteTransaction[]>([]);
  const [siteTransactionLoading, setSiteTransactionLoading] = useState(true);
  
  console.log('🔧 初期状態:', { transactionsLength: transactions.length, loading });

  const fetchTransactions = async () => {
    try {
      console.log('🔥 Firebase接続を開始しています...');
      console.log('🔥 データベース:', db);
      console.log('🔥 Firebaseの設定確認:', {
        apiKey: db.app.options.apiKey ? '設定済み' : '未設定',
        projectId: db.app.options.projectId,
        authDomain: db.app.options.authDomain
      });
      
      console.log('🔥 collectionを取得中...');
      console.log('🔥 コレクション参照:', collection(db, 'Transactions'));
      

      
      const querySnapshot = await getDocs(collection(db, 'Transactions'));
      console.log('🔥 クエリ結果:', querySnapshot);
      console.log('🔥 ドキュメント数:', querySnapshot.docs.length);
      console.log('🔥 クエリSnapshot.empty:', querySnapshot.empty);
      console.log('🔥 クエリSnapshot.size:', querySnapshot.size);
      console.log('🔥 クエリSnapshot.metadata:', querySnapshot.metadata);
      
      // データベースの詳細情報を確認
      console.log('🔍 Firestore詳細情報:', {
        app: db.app.name,
        appOptions: db.app.options
      });
      
      // 手動でコレクション内容を確認
      console.log('🔍 クエリの情報:', querySnapshot.query);
      console.log('🔍 すべてのドキュメントを確認中...');
      
      if (querySnapshot.docs && querySnapshot.docs.length > 0) {
        querySnapshot.docs.forEach((doc, index) => {
          console.log(`🔍 ドキュメント${index + 1}:`, {
            id: doc.id,
            data: doc.data(),
            exists: doc.exists()
          });
        });
      } else {
        console.log('🔍 ドキュメントが見つかりませんでした');
        

      }
      
      if (querySnapshot.empty) {
        console.log('⚠️ Firestoreにデータが存在しません');
      }
      
      const transactionsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('🔥 ドキュメントID:', doc.id);
        console.log('🔥 ドキュメントの生データ:', data);
        console.log('🔥 データの型:', typeof data);
        console.log('🔥 データのキー:', Object.keys(data));
        
        const transaction = {
          id: doc.id,
          ...data,
        };
        console.log('🔥 変換後のトランザクション:', transaction);
        return transaction;
      }) as Transaction[];
      
      console.log('🔥 最終的なトランザクションデータ:', transactionsData);
      console.log('🔥 データ件数:', transactionsData.length);
      console.log('🔥 最初のデータ:', transactionsData[0] || 'データなし');
      
      setTransactions(transactionsData);
      console.log('✅ setTransactions完了');
      console.log('🔧 State更新後の確認（非同期なので即座には反映されない可能性）');
    } catch (error: any) {
      console.error('❌ Firebase接続エラー:', error);
      console.error('❌ エラーの詳細:', error);
      console.error('❌ エラーのスタック:', error instanceof Error ? error.stack : 'スタック情報なし');
      console.error('❌ エラーコード:', error?.code);
      console.error('❌ エラーメッセージ:', error?.message);
      
      // Firestoreの権限エラーの場合
      if (error?.code === 'permission-denied') {
        console.error('🚨 権限拒否: Firestoreのセキュリティルールを確認してください');
      }
      if (error?.code === 'unavailable') {
        console.error('🚨 サービス利用不可: ネットワーク接続を確認してください');
      }
    } finally {
      console.log('🏁 fetchTransactions処理終了');
      setLoading(false);
    }
  };

  // 現場ベーストランザクションを取得
  const fetchSiteTransactions = async () => {
    try {
      console.log('🏗️ 現場ベーストランザクションを取得中...');
      
      const querySnapshot = await getDocs(collection(db, 'SiteTransactions'));
      console.log('🏗️ 現場ベーストランザクション数:', querySnapshot.docs.length);
      
      const siteTransactionsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SiteTransaction[];
      
      console.log('🏗️ 取得した現場ベーストランザクション:', siteTransactionsData);
      setSiteTransactions(siteTransactionsData);
    } catch (error) {
      console.error('❌ 現場ベーストランザクション取得エラー:', error);
    } finally {
      setSiteTransactionLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'Transactions'), transaction);
      const newTransaction: Transaction = {
        id: docRef.id,
        ...transaction,
      };
      setTransactions(prev => [...prev, newTransaction]);
      return docRef.id; // 新しく作成された取引のIDを返す
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
    try {
      console.log('🔄 TransactionContext.updateTransaction 開始', {
        id,
        updates,
        hasImageUrls: !!updates.imageUrls,
        imageUrlsCount: updates.imageUrls?.length || 0,
        hasImageIds: !!updates.imageIds,
        imageIdsCount: updates.imageIds?.length || 0
      });
      
      // undefinedの値を除外した更新データを作成
      const cleanUpdates: any = {};
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key];
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });
      
      console.log('🧹 クリーンな更新データ', cleanUpdates);
      
      await updateDoc(doc(db, 'Transactions', id), cleanUpdates);
      console.log('📝 Firestore更新完了');
      
      setTransactions(prev => {
        const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
        const updatedTransaction = updated.find(t => t.id === id);
        console.log('🔄 ローカル状態更新完了', {
          updatedTransaction: updatedTransaction,
          imageUrls: updatedTransaction?.imageUrls
        });
        return updated;
      });
    } catch (error) {
      console.error('❌ TransactionContext.updateTransaction エラー:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'Transactions', id));
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  // 新規: 画像アップロードをトランザクションに追加する
  const addImagesToTransaction = async (transactionId: string, files: File[]) => {
    if (!files || files.length === 0) return;
    try {
      const uploadPromises = files.map((f, idx) => {
        const storageRef = ref(storage, `transactions/${transactionId}/images/${Date.now()}_${idx}_${f.name}`);
        return uploadBytes(storageRef, f).then(() => getDownloadURL(storageRef));
      });
      const urls = await Promise.all(uploadPromises);
      // 既存の imageUrls を取得して結合
      const docRef = doc(db, 'Transactions', transactionId);
      const snap = await getDoc(docRef);
      const existing = (snap.data()?.imageUrls ?? []) as string[];
      const updated = [...existing, ...urls];
      await updateDoc(docRef, { imageUrls: updated });
    } catch (err) {
      console.error('Error uploading images for transaction:', err);
      throw err;
    }
  };

  // 現場ベーストランザクションの管理関数

  // 現場ベーストランザクションを追加
  const addSiteTransaction = async (transaction: Omit<SiteTransaction, 'id'>): Promise<string> => {
    try {
      console.log('🏗️ 現場ベーストランザクション追加:', transaction);
      const docRef = await addDoc(collection(db, 'SiteTransactions'), transaction);
      const newTransaction: SiteTransaction = {
        id: docRef.id,
        ...transaction,
      };
      setSiteTransactions(prev => [...prev, newTransaction]);
      console.log('✅ 現場ベーストランザクション追加成功:', newTransaction);
      return docRef.id;
    } catch (error) {
      console.error('❌ 現場ベーストランザクション追加エラー:', error);
      throw error;
    }
  };

  // 現場ベーストランザクションを更新
  const updateSiteTransaction = async (id: string, updates: Partial<Omit<SiteTransaction, 'id'>>) => {
    try {
      console.log('🔄 現場ベーストランザクション更新:', { id, updates });
      
      const cleanUpdates: any = {};
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key];
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });
      
      await updateDoc(doc(db, 'SiteTransactions', id), cleanUpdates);
      
      setSiteTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );
      
      console.log('✅ 現場ベーストランザクション更新成功');
    } catch (error) {
      console.error('❌ 現場ベーストランザクション更新エラー:', error);
      throw error;
    }
  };

  // 現場ベーストランザクションを削除
  const deleteSiteTransaction = async (id: string) => {
    try {
      console.log('🗑️ 現場ベーストランザクション削除:', id);
      await deleteDoc(doc(db, 'SiteTransactions', id));
      setSiteTransactions(prev => prev.filter(t => t.id !== id));
      console.log('✅ 現場ベーストランザクション削除成功');
    } catch (error) {
      console.error('❌ 現場ベーストランザクション削除エラー:', error);
      throw error;
    }
  };

  // 現場別トランザクション取得
  const getSiteTransactionsBySite = (siteId: string): SiteTransaction[] => {
    return siteTransactions.filter(transaction => transaction.siteId === siteId);
  };

  // カテゴリー別トランザクション取得
  const getSiteTransactionsByCategory = (categoryId: string): SiteTransaction[] => {
    return siteTransactions.filter(transaction => transaction.categoryId === categoryId);
  };

  // 現場・カテゴリー別トランザクション取得
  const getSiteTransactionsBySiteAndCategory = (siteId: string, categoryId: string): SiteTransaction[] => {
    return siteTransactions.filter(transaction => 
      transaction.siteId === siteId && transaction.categoryId === categoryId
    );
  };

  useEffect(() => {
    console.log('🚀 TransactionProvider mounted, fetching transactions...');
    console.log('🔧 useEffect実行時のstate:', { transactionsLength: transactions.length, loading });
    console.log('🔧 Firebase db object:', db);
    fetchTransactions();
    fetchSiteTransactions(); // 現場ベーストランザクションも取得
  }, []);

  // トランザクション状態の変更を監視
  useEffect(() => {
    console.log('📊 Transactions state changed:', {
      count: transactions.length,
      loading,
      transactions: transactions.slice(0, 3) // 最初の3件だけ表示
    });
  }, [transactions, loading]);

  const value: TransactionContextType = {
    // 既存のトランザクション機能
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    loading,
    selectedDate,
    setSelectedDate,
    isDateClicked,
    setIsDateClicked,
    showTransactionForm,
    setShowTransactionForm,
    addImagesToTransaction,
    showTransactionDetailsModal,
    setShowTransactionDetailsModal,
    
    // 新しい現場ベーストランザクション機能
    siteTransactions,
    addSiteTransaction,
    updateSiteTransaction,
    deleteSiteTransaction,
    getSiteTransactionsBySite,
    getSiteTransactionsByCategory,
    getSiteTransactionsBySiteAndCategory,
    siteTransactionLoading,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};