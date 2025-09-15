#!/bin/bash
# ローカルネットワーク配布用シェルスクリプト

BUILD=false
DOCKER=false
PORT="3000"

# 引数解析
while [[ $# -gt 0 ]]; do
  case $1 in
    --build)
      BUILD=true
      shift
      ;;
    --docker)
      DOCKER=true
      shift
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    *)
      echo "使用方法: $0 [--build] [--docker] [--port PORT]"
      exit 1
      ;;
  esac
done

echo "🏠 生活管理確認システム - ローカルネットワーク配布モード"

# 現在のIPアドレスを取得
LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null || hostname -I | awk '{print $1}')

echo "📍 ローカルネットワークIP: $LOCAL_IP"

if [ "$DOCKER" = true ]; then
    echo "🐳 Dockerコンテナで起動中..."
    docker-compose up -d
    echo "✅ アプリが起動しました！"
    echo "🌐 アクセスURL: http://$LOCAL_IP:3000"
elif [ "$BUILD" = true ]; then
    echo "🔨 ローカルネットワーク用ビルドを実行中..."
    export REACT_APP_LOCAL_NETWORK=true
    npm run build:local
    echo "🚀 ビルド完了！静的ファイルサーバーを起動中..."
    npm run serve
    echo "✅ アプリが起動しました！"
    echo "🌐 アクセスURL: http://$LOCAL_IP:3000"
else
    echo "🚀 開発サーバーを起動中..."
    export REACT_APP_LOCAL_NETWORK=true
    export HOST=0.0.0.0
    export PORT=$PORT
    npm start
fi

echo ""
echo "📱 ローカルネットワーク内の他のデバイスからアクセス可能です:"
echo "   - デスクトップ: http://$LOCAL_IP:$PORT"
echo "   - スマートフォン: http://$LOCAL_IP:$PORT"
echo "   - タブレット: http://$LOCAL_IP:$PORT"
