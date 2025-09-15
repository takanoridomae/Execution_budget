# 生活管理確認システム - ローカルネットワーク配布ガイド

このガイドでは、生活管理確認システムをローカルネットワーク内でのみ動作させる方法を説明します。

## 📋 概要

このアプリは以下の方法でローカルネットワークに配布できます：

1. **開発サーバー方式** - 最も簡単、開発用
2. **静的ビルド方式** - 高パフォーマンス、推奨
3. **Docker方式** - 最も安全、本格運用向け

## 🚀 配布方法

### 方式1: 開発サーバー（最も簡単）

```bash
# 依存関係のインストール
npm install

# ローカルネットワークで起動（Windows）
.\scripts\start-local-network.ps1

# ローカルネットワークで起動（macOS/Linux）
./scripts/start-local-network.sh
```

**特徴:**
- ✅ 最も簡単にセットアップ可能
- ✅ ホットリロード対応
- ❌ パフォーマンスが劣る
- ❌ Node.jsが必要

### 方式2: 静的ビルド（推奨）

```bash
# 依存関係のインストール
npm install

# ローカルネットワーク用ビルド（Windows）
.\scripts\start-local-network.ps1 -Build

# ローカルネットワーク用ビルド（macOS/Linux）
./scripts/start-local-network.sh --build
```

**特徴:**
- ✅ 高パフォーマンス
- ✅ 軽量
- ✅ Node.js不要（serveパッケージ使用）
- ❌ ファイル更新時は再ビルドが必要

### 方式3: Docker（本格運用）

```bash
# Dockerコンテナで起動（Windows）
.\scripts\start-local-network.ps1 -Docker

# Dockerコンテナで起動（macOS/Linux）
./scripts/start-local-network.sh --docker
```

**特徴:**
- ✅ 最も安全
- ✅ ポータブル
- ✅ 本格運用向け
- ❌ Dockerが必要
- ❌ セットアップが複雑

## 🔧 手動セットアップ

### 開発サーバー手動起動

```bash
# 環境変数設定
export REACT_APP_LOCAL_NETWORK=true
export HOST=0.0.0.0
export PORT=3000

# 起動
npm start
```

### 静的ビルド手動実行

```bash
# ローカルネットワーク用ビルド
npm run build:local

# 静的ファイルサーバー起動
npm run serve
```

### Docker手動実行

```bash
# イメージビルド
docker build -t budget-app-local .

# コンテナ起動
docker run -d -p 3000:3000 --name budget-app budget-app-local
```

## 🌐 アクセス方法

### IPアドレスの確認

**Windows:**
```powershell
ipconfig | findstr "IPv4"
```

**macOS/Linux:**
```bash
ip addr show | grep inet
# または
hostname -I
```

### ブラウザでアクセス

コンピューターのローカルIPアドレスを確認後、以下のURLでアクセス：

```
http://[あなたのIP]:3000
```

例: `http://192.168.1.100:3000`

## 📱 他のデバイスからのアクセス

同じWi-Fiネットワークに接続された他のデバイス（スマートフォン、タブレット等）からも、同じURLでアクセス可能です。

## 🔒 セキュリティ設定

### ファイアウォール設定

**Windows:**
1. Windowsセキュリティを開く
2. ファイアウォールとネットワーク保護
3. 詳細設定
4. 受信の規則 → 新しい規則
5. ポート3000を許可

**macOS:**
```bash
sudo pfctl -f /etc/pf.conf
```

**Linux (Ubuntu):**
```bash
sudo ufw allow 3000
```

### nginx設定（Docker使用時）

`nginx.conf`でローカルネットワークのIPレンジを制限：

```nginx
# 許可するIPレンジ
allow 192.168.0.0/16;
allow 10.0.0.0/8;
allow 172.16.0.0/12;
allow 127.0.0.1;
deny all;
```

## 🛠️ トラブルシューティング

### アクセスできない場合

1. **ファイアウォール確認**
   - ポート3000が開放されているか確認

2. **ネットワーク確認**
   - 同じWi-Fiネットワークに接続されているか確認

3. **IPアドレス確認**
   - 正しいローカルIPアドレスを使用しているか確認

4. **サービス起動確認**
   - アプリが正常に起動しているか確認

### パフォーマンス問題

1. **開発サーバーが遅い場合**
   - 静的ビルド方式に切り替え

2. **メモリ不足**
   - Docker方式でメモリ制限を調整

### Firebase接続エラー

[[memory:7910036]]に基づき、Firebase Blazeプランが設定されていることを確認してください。ローカルネットワーク環境では、以下の設定が自動適用されます：

- `REACT_APP_LOCAL_NETWORK=true`でローカルモード有効化
- Firebase Storageを優先的に使用
- 接続テスト機能により自動的にローカル/クラウド保存を選択

## 📦 配布パッケージ作成

他の人に配布する場合は、以下のファイルをZIP化：

```
my-app/
├── build/              # ビルド済みファイル
├── scripts/            # 起動スクリプト
├── package.json        # パッケージ設定
├── Dockerfile          # Docker設定
├── docker-compose.yml  # Docker Compose設定
└── local-network-deployment-guide.md  # このガイド
```

## 🎯 推奨配布方法

**家庭内利用**: 静的ビルド方式
**オフィス内利用**: Docker方式
**開発・テスト**: 開発サーバー方式

## 📞 サポート

- 設定で困った場合は、このガイドのトラブルシューティングセクションを確認
- ポート3000が使用中の場合は、`--port`オプションで変更可能
- Firebase設定については`blaze-plan-setup-guide.md`を参照
