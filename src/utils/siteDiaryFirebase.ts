import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where,
  orderBy,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { SiteDiary } from '../types';

// 現場日記帳のFirebase操作ユーティリティ

// 現場日記帳をFirestoreに追加
export const addSiteDiaryToFirestore = async (diary: Omit<SiteDiary, 'id'>): Promise<string> => {
  try {
    console.log('📝 日記帳をFirestoreに追加開始:', diary);
    
    // ドキュメントを追加（IDを自動生成）
    const docRef = await addDoc(collection(db, 'SiteDiaries'), {
      ...diary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ 日記帳Firestore追加成功:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ 日記帳Firestore追加失敗:', error);
    throw new Error(`日記帳の保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 現場日記帳をFirestoreで更新
export const updateSiteDiaryInFirestore = async (diaryId: string, updates: Partial<SiteDiary>): Promise<void> => {
  try {
    console.log('📝 日記帳をFirestoreで更新開始:', { diaryId, updates });
    
    // undefinedフィールドを除去（Firestoreはundefinedを受け付けない）
    // 空配列は有効な値として保持する
    const cleanUpdates: any = {};
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });
    
    console.log('🔍 Firestore更新フィールド詳細', {
      元updates: updates,
      cleanUpdates: cleanUpdates,
      空配列チェック: {
        imageUrls: updates.imageUrls,
        imageIds: updates.imageIds,
        documentUrls: updates.documentUrls,
        documentIds: updates.documentIds
      }
    });
    
    console.log('🧹 undefined除去後のupdates:', cleanUpdates);
    
    const docRef = doc(db, 'SiteDiaries', diaryId);
    await setDoc(docRef, {
      ...cleanUpdates,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ 日記帳Firestore更新成功:', diaryId);
    
  } catch (error) {
    console.error('❌ 日記帳Firestore更新失敗:', error);
    throw new Error(`日記帳の更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Firestoreから現場日記帳を取得
export const getSiteDiaryFromFirestore = async (diaryId: string): Promise<SiteDiary | null> => {
  try {
    console.log('📖 日記帳をFirestoreから取得開始:', diaryId);
    
    const docRef = doc(db, 'SiteDiaries', diaryId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ 日記帳Firestore取得成功:', diaryId);
      return {
        id: docSnap.id,
        ...data
      } as SiteDiary;
    } else {
      console.log('📭 日記帳が見つかりません:', diaryId);
      return null;
    }
    
  } catch (error) {
    console.error('❌ 日記帳Firestore取得失敗:', error);
    throw new Error(`日記帳の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 指定した現場の日記帳一覧をFirestoreから取得
export const getSiteDiariesBySite = async (siteId: string): Promise<SiteDiary[]> => {
  try {
    console.log('📚 現場の日記帳一覧をFirestoreから取得開始:', siteId);
    
    // インデックスエラーを避けるために単純なクエリに変更
    const q = query(
      collection(db, 'SiteDiaries'),
      where('siteId', '==', siteId)
    );
    
    const querySnapshot = await getDocs(q);
    const diaries: SiteDiary[] = [];
    
    querySnapshot.forEach((doc) => {
      diaries.push({
        id: doc.id,
        ...doc.data()
      } as SiteDiary);
    });
    
    // クライアントサイドでソート
    diaries.sort((a, b) => {
      // recordDate で降順、同じ日付なら createdAt で降順
      if (a.recordDate !== b.recordDate) {
        return b.recordDate.localeCompare(a.recordDate);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
    
    console.log('✅ 現場の日記帳一覧Firestore取得成功:', { siteId, count: diaries.length });
    return diaries;
    
  } catch (error) {
    console.error('❌ 現場の日記帳一覧Firestore取得失敗:', error);
    throw new Error(`現場の日記帳一覧の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 指定したカテゴリーの日記帳一覧をFirestoreから取得
export const getSiteDiariesByCategory = async (siteId: string, categoryId: string): Promise<SiteDiary[]> => {
  try {
    console.log('📚 カテゴリーの日記帳一覧をFirestoreから取得開始:', { siteId, categoryId });
    
    // インデックスエラーを避けるために単純なクエリに変更
    const q = query(
      collection(db, 'SiteDiaries'),
      where('siteId', '==', siteId),
      where('categoryId', '==', categoryId)
    );
    
    const querySnapshot = await getDocs(q);
    const diaries: SiteDiary[] = [];
    
    querySnapshot.forEach((doc) => {
      diaries.push({
        id: doc.id,
        ...doc.data()
      } as SiteDiary);
    });
    
    // クライアントサイドでソート
    diaries.sort((a, b) => {
      // recordDate で降順、同じ日付なら createdAt で降順
      if (a.recordDate !== b.recordDate) {
        return b.recordDate.localeCompare(a.recordDate);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
    
    console.log('✅ カテゴリーの日記帳一覧Firestore取得成功:', { siteId, categoryId, count: diaries.length });
    return diaries;
    
  } catch (error) {
    console.error('❌ カテゴリーの日記帳一覧Firestore取得失敗:', error);
    throw new Error(`カテゴリーの日記帳一覧の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 全ての現場日記帳をFirestoreから取得（デバッグ用：ソートなし）
export const getAllSiteDiariesFromFirestore = async (): Promise<SiteDiary[]> => {
  try {
    console.log('📚 全ての日記帳をFirestoreから取得開始');
    
    // インデックスエラーを避けるために単純なクエリに変更
    const querySnapshot = await getDocs(collection(db, 'SiteDiaries'));
    const diaries: SiteDiary[] = [];
    
    querySnapshot.forEach((doc) => {
      diaries.push({
        id: doc.id,
        ...doc.data()
      } as SiteDiary);
    });
    
    // クライアントサイドでソート
    diaries.sort((a, b) => {
      // recordDate で降順、同じ日付なら createdAt で降順
      if (a.recordDate !== b.recordDate) {
        return b.recordDate.localeCompare(a.recordDate);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
    
    console.log('✅ 全ての日記帳Firestore取得成功:', { count: diaries.length });
    return diaries;
    
  } catch (error) {
    console.error('❌ 全ての日記帳Firestore取得失敗:', error);
    throw new Error(`日記帳一覧の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 現場日記帳をFirestoreから削除
export const deleteSiteDiaryFromFirestore = async (diaryId: string): Promise<void> => {
  try {
    console.log('🗑️ 日記帳をFirestoreから削除開始:', diaryId);
    
    const docRef = doc(db, 'SiteDiaries', diaryId);
    await deleteDoc(docRef);
    
    console.log('✅ 日記帳Firestore削除成功:', diaryId);
    
  } catch (error) {
    console.error('❌ 日記帳Firestore削除失敗:', error);
    throw new Error(`日記帳の削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 現場日記帳を添付ファイルと共に完全削除
export const deleteSiteDiaryWithAttachments = async (diary: SiteDiary): Promise<void> => {
  try {
    console.log('🗑️ 日記帳と添付ファイルの完全削除開始:', { diaryId: diary.id, title: diary.title });
    
    // 添付ファイルの削除処理
    const deletionPromises: Promise<void>[] = [];
    
    // Firebase Storage画像を削除
    if (diary.imageUrls && diary.imageUrls.length > 0) {
      const { deleteImageFromFirebaseStorage } = await import('./imageUtils');
      diary.imageUrls.forEach(url => {
        console.log('🗑️ Firebase Storage画像削除予約:', url);
        deletionPromises.push(deleteImageFromFirebaseStorage(url));
      });
    }
    
    // Firebase Storage書類を削除
    if (diary.documentUrls && diary.documentUrls.length > 0) {
      const { deleteDocumentFromFirebaseStorage } = await import('./documentUtils');
      diary.documentUrls.forEach(url => {
        console.log('🗑️ Firebase Storage書類削除予約:', url);
        deletionPromises.push(deleteDocumentFromFirebaseStorage(url));
      });
    }
    
    // ローカルストレージ画像を削除
    if (diary.imageIds && diary.imageIds.length > 0) {
      const { deleteImageFromLocalStorage } = await import('./imageUtils');
      diary.imageIds.forEach(id => {
        console.log('🗑️ ローカルストレージ画像削除予約:', id);
        try {
          deleteImageFromLocalStorage(diary.id, id);
        } catch (error) {
          console.warn('⚠️ ローカルストレージ画像削除失敗:', error);
        }
      });
    }
    
    // ローカルストレージ書類を削除
    if (diary.documentIds && diary.documentIds.length > 0) {
      const { deleteDocumentFromLocalStorage } = await import('./documentUtils');
      diary.documentIds.forEach(id => {
        console.log('🗑️ ローカルストレージ書類削除予約:', id);
        try {
          deleteDocumentFromLocalStorage(diary.id, id);
        } catch (error) {
          console.warn('⚠️ ローカルストレージ書類削除失敗:', error);
        }
      });
    }
    
    // Firebase Storageファイル削除を並行実行
    if (deletionPromises.length > 0) {
      console.log(`🗑️ Firebase Storage削除開始: ${deletionPromises.length}件`);
      await Promise.allSettled(deletionPromises);
      console.log('🗑️ Firebase Storage削除完了');
    }
    
    // 最後にFirestoreから日記帳ドキュメントを削除
    await deleteSiteDiaryFromFirestore(diary.id);
    
    console.log('✅ 日記帳と添付ファイルの完全削除成功:', diary.id);
    
  } catch (error) {
    console.error('❌ 日記帳完全削除失敗:', error);
    throw new Error(`日記帳の完全削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
};
