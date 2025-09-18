# Firebase Firestore Rules 更新手順

## 🔧 手動でFirestore Rulesを更新

### 1. Firebase Consoleにアクセス
1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクト「execution-budget」を選択

### 2. Firestore Database Rules画面に移動
1. 左メニューから「Firestore Database」をクリック
2. 上部タブの「ルール」をクリック

### 3. 現在のルール設定を更新
以下のルールをコピーして貼り付け：

```javascript
rules_version = '2';

// Firestore Security Rules for Site-based Budget Management
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 従来のTransactionsコレクション - 既存機能維持
    match /Transactions/{document} {
      allow read, write: if true; // デモアプリのため全許可
    }
    
    // 新しい現場管理コレクション
    match /Sites/{siteId} {
      allow read, write: if true; // デモアプリのため全許可
      
      // サブコレクションとして将来的に拡張可能
      match /metadata/{document} {
        allow read, write: if true;
      }
    }
    
    // 現場カテゴリーコレクション
    match /SiteCategories/{categoryId} {
      allow read, write: if true; // デモアプリのため全許可
    }
    
    // 現場ベーストランザクションコレクション（従来互換性のため維持）
    match /SiteTransactions/{transactionId} {
      allow read, write: if true; // デモアプリのため全許可
    }
    
    // 現場別収入コレクション
    match /SiteIncomes/{incomeId} {
      allow read, write: if true; // デモアプリのため全許可
    }
    
    // 現場別支出コレクション
    match /SiteExpenses/{expenseId} {
      allow read, write: if true; // デモアプリのため全許可
    }
    
    // 現場別予算設定コレクション
    match /SiteBudgetSettings/{budgetId} {
      allow read, write: if true; // デモアプリのため全許可
    }
    
    // システム管理用コレクション（将来的な拡張）
    match /SystemSettings/{document} {
      allow read: if true;
      allow write: if true; // デモアプリのため全許可
    }
    
    // テスト用コレクション（接続テスト用）
    match /test/{document} {
      allow read, write: if true; // 接続テスト用
    }
    
    // その他のコレクションはアクセス拒否
    match /{document=**} {
      allow read, write: if false;
    }
  }
}

// 注意: 本番環境では適切な認証・認可ルールを設定してください
// 現在のルールはデモアプリ用の設定です
```

### 4. 公開
1. 「公開」ボタンをクリック
2. 確認ダイアログで「公開」をクリック

## 🧪 テスト方法
ルール更新後、アプリケーションでFirestore接続をテストして、エラーが出ないことを確認してください。
