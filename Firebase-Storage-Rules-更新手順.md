# Firebase Storage Rules 更新手順

## 🔧 手動でFirebase Storage Rulesを更新

### 1. Firebase Consoleにアクセス
1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクト「execution-budget」を選択

### 2. Storage Rules画面に移動
1. 左メニューから「Storage」をクリック
2. 上部タブの「Rules」をクリック

### 3. 一時的なルール設定（デモ用）
以下のルールをコピーして貼り付け：

```javascript
rules_version = '2';

// Firebase Storage Security Rules for Transaction Images
// デモアプリ用の設定（認証なしでアクセス可能）
service firebase.storage {
  match /b/{bucket}/o {
    // 従来のトランザクション画像（既存機能維持）
    match /transactions/{transactionId}/images/{imageId} {
      // 読み取り・書き込み: 全ユーザー許可（デモアプリのため）
      allow read, write: if true;
    }
    
    // 現場ベーストランザクション画像
    match /site-transactions/{siteTransactionId}/images/{imageId} {
      // 読み取り・書き込み: 全ユーザー許可（デモアプリのため）
      allow read, write: if true;
    }
    
    // 現場関連の画像（ロゴ、写真等）
    match /sites/{siteId}/images/{imageId} {
      // 読み取り・書き込み: 全ユーザー許可（デモアプリのため）
      allow read, write: if true;
    }
    
    // 接続テスト用（一時的）
    match /test/{testFile} {
      allow read, write: if true;
    }
    
    // 全体的な緩い設定（デモアプリ用の一時的設定）
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}

// 注意: この設定はデモアプリ用です
// 本番環境では適切な認証・認可ルールを設定してください
```

### 4. 公開
1. 「公開」ボタンをクリック
2. 確認ダイアログで「公開」をクリック

## ⚠️ 重要な注意事項
- **この設定は一時的なものです**
- 誰でもStorageにアクセスできる状態になります
- 本番環境では絶対に使用しないでください
- テスト完了後は適切な認証ルールに戻してください

## 🧪 テスト方法
ルール更新後、アプリケーションで画像アップロードをテストして、以下のログが表示されることを確認：
- `✅ Firebase Storage接続成功`
- `✅ 現場画像 Firebase Storage アップロード成功`
