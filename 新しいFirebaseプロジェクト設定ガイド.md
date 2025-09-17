# 🚀 新しいFirebaseプロジェクト作成・設定ガイド

## 📋 ステップ1: 新しいFirebaseプロジェクトの作成

### 1. Firebase Consoleでプロジェクト作成

1. **[Firebase Console](https://console.firebase.google.com/)** にアクセス
2. **「プロジェクトを追加」** をクリック
3. **プロジェクト名**を入力
   ```
   推奨名: execution-budget-management-2024
   または: 家計簿管理システム2024
   ```
4. **「続行」** をクリック
5. **Googleアナリティクス** の有効化を選択（推奨：有効）
6. **「プロジェクトを作成」** をクリック

### 2. Webアプリケーションの登録

プロジェクト作成完了後：

1. **プロジェクトの設定** （⚙️歯車アイコン）をクリック
2. **「全般」** タブで下にスクロール
3. **「アプリを追加」** をクリック
4. **Web（</>）** アイコンを選択
5. **アプリ名** を入力
   ```
   推奨名: 実行予算管理アプリ
   ```
6. **「Firebase Hosting も設定する」** はチェックを外す
7. **「アプリを登録」** をクリック

### 3. Firebase SDK設定情報の取得

登録完了後、以下のような設定情報が表示されます：

```javascript
const firebaseConfig = {
  apiKey: "あなたの-API-キー",
  authDomain: "あなたのプロジェクト.firebaseapp.com",
  projectId: "あなたのプロジェクトID",
  storageBucket: "あなたのプロジェクト.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};
```

**⚠️ この設定情報をコピーして保存してください（後で使用）**

## 📋 ステップ2: Firebase Storageの設定（写真管理用）

### 1. Storageの有効化

1. 左メニューから **「Storage」** を選択
2. **「始める」** をクリック
3. **セキュリティルール** で **「テストモードで開始」** を選択
4. **「次へ」** をクリック
5. **Cloud Storageのロケーション** を選択
   ```
   推奨: asia-northeast1 (東京)
   理由: 日本からの最速アクセス
   ```
6. **「完了」** をクリック

### 2. Blazeプランへのアップグレード（重要）

写真の保存・管理には Blazeプラン が必要です：

1. 左下の **「使用量と料金」** または **「プランをアップグレード」** をクリック
2. **「Blazeプラン（従量課金制）」** を選択
3. **支払い方法** （クレジットカード）を設定
4. **課金予算アラート** を設定（推奨：月額 ¥500-1000）
5. **「アップグレード」** をクリック

### 3. セキュリティルールの設定

Storage有効化後、セキュリティルールを設定：

1. **Storage** → **Rules** タブをクリック
2. 以下のルールをコピー＆ペースト：

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // 取引画像の保存・読み取り
    match /transactions/{transactionId}/images/{imageId} {
      // 読み取り: 全ユーザー許可（デモアプリのため）
      allow read: if true;
      
      // 書き込み: ファイル制限付きで許可
      allow write: if request.resource != null
        && request.resource.size < 10 * 1024 * 1024  // 10MB以下
        && request.resource.contentType.matches('image/.*') // 画像ファイルのみ
        && transactionId.matches('[a-zA-Z0-9]+'); // 英数字のIDのみ
    }
    
    // 接続テスト用（自動削除される）
    match /test/{testFile} {
      allow read, write: if true;
    }
    
    // その他のパスはアクセス拒否
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. **「公開」** ボタンをクリック

## 📋 ステップ3: Firestoreデータベースの設定

### 1. Firestoreの有効化

1. 左メニューから **「Firestore Database」** を選択
2. **「データベースを作成」** をクリック
3. **「テストモードで開始」** を選択
4. **「次へ」** をクリック
5. **ロケーション** を選択
   ```
   推奨: asia-northeast1 (東京)
   ※ Storageと同じロケーションを選択
   ```
6. **「完了」** をクリック

### 2. Firestoreセキュリティルール

1. **Firestore Database** → **ルール** タブをクリック
2. 以下のルールをコピー＆ペースト：

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 取引データ: 読み書き許可（デモアプリのため）
    match /transactions/{transactionId} {
      allow read, write: if true;
    }
    
    // 予算設定データ: 読み書き許可
    match /budgetSettings/{settingId} {
      allow read, write: if true;
    }
    
    // その他のデータはアクセス拒否
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. **「公開」** をクリック

## 📋 ステップ4: プロジェクトIDとバケット名の確認

最後に、重要な情報を確認：

1. **プロジェクトの設定** （⚙️）をクリック
2. **「全般」** タブで確認：
   - **プロジェクトID**: `your-new-project-id`
   - **ストレージバケット**: `your-new-project-id.firebasestorage.app`

## 🎯 次のステップ

この設定が完了したら、以下の情報を教えてください：

1. **新しいプロジェクトID**
2. **Firebase SDK設定情報**（firebaseConfig）

これらの情報を使用して、アプリケーションの接続設定を更新します。

## 💰 料金について

### Blazeプランの料金目安（家計簿アプリ使用）

| 項目 | 月間使用量 | 料金 |
|------|------------|------|
| **Storage容量** | 1-2GB | 約¥26-52 |
| **ダウンロード** | 0.5GB | 約¥60 |
| **アップロード** | 1000回 | 約¥0.4 |
| **Firestore読み取り** | 10,000回 | 約¥0.4 |
| **Firestore書き込み** | 1,000回 | 約¥13 |
| **合計** | - | **約¥100-150/月** |

実際の家計簿アプリでの使用では、月額¥50-200程度になると予想されます。

## 🆘 サポート

設定でご不明な点がございましたら、スクリーンショット付きでお知らせください。step-by-stepでサポートいたします！
