// サンプルデータ作成ユーティリティ
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Site, SiteCategory } from '../types';

// サンプル現場データを作成
export const createSampleSites = async (): Promise<void> => {
  const sampleSites: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: '東京本社工事',
      description: '本社ビル内装工事',
      comment: '2024年3月完成予定',
      isActive: true
    },
    {
      name: '大阪支店改修',
      description: '大阪支店のオフィス改修工事',
      comment: '段階的改修工事',
      isActive: true
    },
    {
      name: '横浜倉庫建設',
      description: '新規倉庫建設プロジェクト',
      comment: '大型プロジェクト',
      isActive: true
    },
    {
      name: '名古屋店舗工事',
      description: '店舗リニューアル工事',
      comment: '完了済み',
      isActive: false
    }
  ];

  try {
    console.log('🏗️ サンプル現場データ作成開始');
    for (const site of sampleSites) {
      const now = new Date().toISOString();
      const newSite = {
        ...site,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, 'Sites'), newSite);
      console.log('✅ 現場作成:', { id: docRef.id, name: site.name });
    }
    console.log('🎉 サンプル現場データ作成完了');
  } catch (error) {
    console.error('❌ サンプル現場データ作成エラー:', error);
    throw error;
  }
};

// サンプルカテゴリーデータを作成
export const createSampleCategories = async (siteId: string): Promise<void> => {
  const sampleCategories: Omit<SiteCategory, 'id' | 'siteId' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: '材料費',
      description: '建設材料の購入費用',
      comment: '鉄筋、コンクリート、木材等',
      budgetAmount: 5000000,
      isActive: true
    },
    {
      name: '人件費',
      description: '作業員の労働費用',
      comment: '日当、残業代等',
      budgetAmount: 3000000,
      isActive: true
    },
    {
      name: '機械リース',
      description: '重機・機械のリース料',
      comment: 'クレーン、ショベルカー等',
      budgetAmount: 1500000,
      isActive: true
    },
    {
      name: '燃料費',
      description: '車両・機械の燃料費',
      comment: 'ガソリン、軽油等',
      budgetAmount: 500000,
      isActive: true
    },
    {
      name: '諸経費',
      description: 'その他の雑費',
      comment: '交通費、通信費等',
      budgetAmount: 300000,
      isActive: true
    },
    {
      name: '安全対策費',
      description: '安全装備・対策費用',
      comment: 'ヘルメット、安全ネット等',
      budgetAmount: 200000,
      isActive: true
    }
  ];

  try {
    console.log('📂 サンプルカテゴリーデータ作成開始:', siteId);
    for (const category of sampleCategories) {
      const now = new Date().toISOString();
      const newCategory = {
        ...category,
        siteId,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, 'SiteCategories'), newCategory);
      console.log('✅ カテゴリー作成:', { id: docRef.id, name: category.name });
    }
    console.log('🎉 サンプルカテゴリーデータ作成完了:', siteId);
  } catch (error) {
    console.error('❌ サンプルカテゴリーデータ作成エラー:', error);
    throw error;
  }
};

// すべてのサンプルデータを作成
export const createAllSampleData = async (): Promise<void> => {
  try {
    console.log('🚀 すべてのサンプルデータ作成開始');
    
    // 現場を作成
    await createSampleSites();
    
    // 少し待つ
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 作成された現場を取得してカテゴリーを作成
    const sitesSnapshot = await getDocs(collection(db, 'Sites'));
    const sites = sitesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log('📂 作成された現場にカテゴリーを追加中...', sites);
    
    // アクティブな現場にカテゴリーを作成
    for (const site of sites.filter((s: any) => s.isActive)) {
      await createSampleCategories(site.id);
      await new Promise(resolve => setTimeout(resolve, 500)); // 少し待つ
    }
    
    console.log('🎉 すべてのサンプルデータ作成完了');
  } catch (error) {
    console.error('❌ サンプルデータ作成エラー:', error);
    throw error;
  }
};

// 開発専用: コンソールから実行できる関数
declare global {
  interface Window {
    createSampleData: () => Promise<void>;
    createSampleSites: () => Promise<void>;
  }
}

if (process.env.NODE_ENV === 'development') {
  window.createSampleData = createAllSampleData;
  window.createSampleSites = createSampleSites;
}
