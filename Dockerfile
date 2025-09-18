# 実行予算管理システム - ローカルネットワーク配布用Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# ソースコードをコピー
COPY . .

# ローカルネットワーク用ビルド
RUN npm run build:local

# Nginxベースのプロダクション用イメージ
FROM nginx:alpine

# カスタムnginx設定をコピー
COPY nginx.conf /etc/nginx/nginx.conf

# ビルド成果物をコピー
COPY --from=builder /app/build /usr/share/nginx/html

# ポート3000を公開
EXPOSE 3000

# nginxを起動
CMD ["nginx", "-g", "daemon off;"]
