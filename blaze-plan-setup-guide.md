# 🚀 Firebase Blazeプラン設定ガイド（デバイス間同期対応）

## 📋 アップグレード手順

### 1. Blazeプランへのアップグレード

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト「kumakkoholdtypescript」を選択
3. 左下の「プランをアップグレード」をクリック
4. **Blazeプラン（従量課金制）**を選択
5. 支払い方法を設定
6. アップグレード完了

### 2. Firebase Storage設定

#### ⭐ セキュリティルール設定（重要）

1. Firebase Console → **Storage** → **Rules**タブ
2. 以下のルールをコピー＆ペースト：

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Transaction images - 読み書き許可
    match /transactions/{transactionId}/images/{imageId} {
      // 読み取り: 全ユーザー許可
      allow read: if true;
      
      // 書き込み: ファイル制限付きで許可
      allow write: if request.resource != null
        && request.resource.size < 10 * 1024 * 1024  // 10MB以下
        && request.resource.contentType.matches('image/.*') // 画像ファイルのみ
        && transactionId.matches('[a-zA-Z0-9]+'); // 英数字のIDのみ
    }
    
    // Test files - 接続テスト用（自動削除）
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

3. **「公開」**ボタンをクリック

#### 💳 課金アラート設定（推奨）

1. Firebase Console → **プロジェクトの設定** → **使用量**
2. **予算アラート**を設定
   - 月額上限: **¥500-1000**程度を推奨
   - アラート設定: 80%で通知

### 3. アプリケーション動作確認

#### ✅ 確認項目

1. **Firebase Storage接続テスト**
   ```
   コンソールで以下が表示されることを確認：
   🔍 Firebase Storage接続テスト中...
   ✅ Firebase Storage接続成功
   ☁️ Firebase Storage優先モード（Blazeプラン・デバイス間同期対応）
   ```

2. **画像保存テスト**
   - スマートフォンで画像を保存
   - メッセージ: `(クラウド保存・デバイス間同期対応)`
   - PCで同じ取引を確認 → 画像が表示される

3. **デバイス間同期確認**
   - スマートフォン → 画像追加
   - PC → 同じ画像が表示される
   - PC → 画像追加  
   - スマートフォン → 同じ画像が表示される

## 💰 料金目安

### 想定使用量（家計簿アプリ）

| 項目 | 月間使用量 | 料金 |
|------|------------|------|
| **Storage容量** | 1-2GB | 約¥26-52 |
| **ダウンロード** | 0.5GB | 約¥60 |
| **アップロード** | 1000回 | 約¥0.4 |
| **合計** | - | **約¥100-150/月** |

### 実際の家計簿使用での想定

- **軽い使用**: 月¥50-100
- **普通の使用**: 月¥100-200
- **ヘビー使用**: 月¥200-500

## 🛠️ トラブルシューティング

### 問題1: セキュリティルールエラー
**症状**: `storage/unauthorized` エラー
**解決**: 上記のセキュリティルールが正しく設定されているか確認

### 問題2: 接続テスト失敗
**症状**: `Firebase Storage接続失敗` メッセージ
**解決**: 
1. ネットワーク接続確認
2. Firebase Console でStorageが有効になっているか確認
3. ブラウザキャッシュをクリア

### 問題3: 課金が心配
**解決**: 
1. Firebase Console で使用量を定期確認
2. 予算アラートを低めに設定
3. 不要な古い画像を定期削除

## 🎯 アップグレード後の利点

✅ **完全なデバイス間同期**  
✅ **容量制限の大幅緩和**  
✅ **高い信頼性とバックアップ**  
✅ **画像の永続保存**  
✅ **複数デバイスでの一貫した体験**

アップグレード完了後、アプリが自動的にFirebase Storage優先モードに切り替わり、デバイス間同期が有効になります！
