# Firebase Storage CORS エラー修正手順

## 🚨 現在のエラー
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

## 🔧 修正手順

### 1. Firebase Console でセキュリティルールを設定

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト「kumakkoholdtypescript」を選択
3. 左メニューから「Storage」を選択
4. 「Rules」タブをクリック
5. 以下のルールをコピー＆ペースト：

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow read and write access to transaction images
    match /transactions/{transactionId}/images/{imageId} {
      // 読み取り: 全ユーザー許可（デモアプリのため）
      allow read: if true;
      
      // 書き込み: ファイル制限付きで許可
      allow write: if request.resource != null
        && request.resource.size < 10 * 1024 * 1024  // 10MB以下
        && request.resource.contentType.matches('image/.*'); // 画像ファイルのみ
    }
    
    // その他のパスはアクセス拒否
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

6. 「公開」ボタンをクリック

### 2. Google Cloud SDK でCORS設定（オプション）

Google Cloud SDKがインストール済みの場合：

```bash
# 認証
gcloud auth login

# プロジェクト設定
gcloud config set project kumakkoholdtypescript

# CORS設定適用
gsutil cors set cors.json gs://kumakkoholdtypescript.firebasestorage.app
```

### 3. 確認方法

1. ブラウザのデベロッパーツールでコンソールを確認
2. 以下のログが表示されることを確認：
   ```
   🔧 Firebase初期化完了: {projectId: "kumakkoholdtypescript", storageBucket: "kumakkoholdtypescript.firebasestorage.app", ...}
   ```
3. 画像アップロードを試行
4. エラーが解消されることを確認

## 💡 重要ポイント

- **セキュリティルール**は必須です
- **CORS設定**は開発環境でのみ必要な場合があります
- 本番環境では適切な認証ルールを設定してください

## 🆘 それでも解決しない場合

1. ブラウザのキャッシュを削除
2. Firebase Consoleでストレージバケットが正しく作成されているか確認
3. Firebase プロジェクトの課金設定を確認（Sparkプランで十分）
