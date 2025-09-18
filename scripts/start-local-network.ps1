# ローカルネットワーク配布用PowerShellスクリプト
param(
    [switch]$Build = $false,
    [switch]$Docker = $false,
    [string]$Port = "3000"
)

Write-Host "🏠 実行予算管理システム - ローカルネットワーク配布モード" -ForegroundColor Green

# 現在のIPアドレスを取得
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*Virtual*" }).IPAddress | Select-Object -First 1

Write-Host "📍 ローカルネットワークIP: $localIP" -ForegroundColor Cyan

if ($Docker) {
    Write-Host "🐳 Dockerコンテナで起動中..." -ForegroundColor Blue
    docker-compose up -d
    Write-Host "✅ アプリが起動しました！" -ForegroundColor Green
    Write-Host "🌐 アクセスURL: http://${localIP}:3000" -ForegroundColor Yellow
} elseif ($Build) {
    Write-Host "🔨 ローカルネットワーク用ビルドを実行中..." -ForegroundColor Blue
    $env:REACT_APP_LOCAL_NETWORK = "true"
    npm run build:local
    Write-Host "🚀 ビルド完了！静的ファイルサーバーを起動中..." -ForegroundColor Blue
    npm run serve
    Write-Host "✅ アプリが起動しました！" -ForegroundColor Green
    Write-Host "🌐 アクセスURL: http://${localIP}:3000" -ForegroundColor Yellow
} else {
    Write-Host "🚀 開発サーバーを起動中..." -ForegroundColor Blue
    $env:REACT_APP_LOCAL_NETWORK = "true"
    $env:HOST = "0.0.0.0"
    $env:PORT = $Port
    npm start
}

Write-Host ""
Write-Host "📱 ローカルネットワーク内の他のデバイスからアクセス可能です:" -ForegroundColor Green
Write-Host "   - デスクトップ: http://${localIP}:${Port}" -ForegroundColor White
Write-Host "   - スマートフォン: http://${localIP}:${Port}" -ForegroundColor White
Write-Host "   - タブレット: http://${localIP}:${Port}" -ForegroundColor White
