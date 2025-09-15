# 実行予算の管理システム起動用PowerShellスクリプト
param(
    [switch]$Build = $false,
    [switch]$Help = $false
)

# ヘルプ表示
if ($Help) {
    Write-Host "=== 実行予算の管理システム 起動スクリプト ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "使用方法:"
    Write-Host "  .\start-execution-budget-management.ps1        # 開発サーバー起動"
    Write-Host "  .\start-execution-budget-management.ps1 -Build # 本番ビルド版起動"
    Write-Host "  .\start-execution-budget-management.ps1 -Help  # このヘルプ表示"
    Write-Host ""
    Write-Host "注意: 初回起動時は依存関係のインストールが必要です。"
    exit 0
}

# タイトル設定
$Host.UI.RawUI.WindowTitle = "実行予算の管理システム"

Clear-Host
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "    実行予算の管理システム - 起動中" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

# 作業ディレクトリを変更
Set-Location "C:\実行予算の管理"

# 依存関係チェック
if (!(Test-Path "node_modules")) {
    Write-Host "📦 初回起動のため、依存関係をインストールしています..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ インストール完了！" -ForegroundColor Green
    Write-Host ""
}

# ローカルIPアドレスを取得
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.InterfaceAlias -notlike "*Virtual*" -and
    $_.IPAddress -like "192.168.*"
}).IPAddress | Select-Object -First 1

if (!$localIP) {
    $localIP = "localhost"
}

# 備考：WebアプリはアクセスされたIPアドレスを自動検出します

Write-Host "📍 アクセスURL: http://${localIP}:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 同じWi-Fiネットワーク内の他のデバイスからもアクセス可能！" -ForegroundColor Yellow
Write-Host "   - スマートフォン: http://${localIP}:3000" -ForegroundColor White
Write-Host "   - タブレット: http://${localIP}:3000" -ForegroundColor White
Write-Host ""

# Browser auto-open option
$openBrowser = Read-Host "Do you want to automatically open browser? (Y/N)"
if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
    Write-Host "✅ Browser will open automatically after server starts..." -ForegroundColor Green
    $autoOpen = $true
} else {
    Write-Host "❌ Browser will NOT open automatically." -ForegroundColor Yellow
    Write-Host "   Please manually open: http://${localIP}:3000" -ForegroundColor White
    $autoOpen = $false
}

Write-Host ""
Write-Host "⏹️  アプリを停止するには: Ctrl+C" -ForegroundColor Red
Write-Host ""

# 環境変数設定
$env:REACT_APP_LOCAL_NETWORK = "true"
$env:HOST = "0.0.0.0"
$env:PORT = "3000"
$env:DANGEROUSLY_DISABLE_HOST_CHECK = "true"
$env:CHOKIDAR_USEPOLLING = "true"
$env:FAST_REFRESH = "false"
$env:BROWSER = "none"
$env:REACT_APP_DETECTED_IP = $localIP

if ($autoOpen) {
    # Auto-open browser after delay
    Start-Job -ScriptBlock {
        param($url)
        Start-Sleep -Seconds 8
        Start-Process $url
        Write-Host "🌐 Browser opened automatically!" -ForegroundColor Green
    } -ArgumentList "http://${localIP}:3000"
}

try {
    if ($Build) {
        Write-Host "🔨 本番ビルド版を起動中..." -ForegroundColor Blue
        $env:GENERATE_SOURCEMAP = "false"
        npm run build
        Write-Host "🚀 ビルド完了！静的サーバーを起動中..." -ForegroundColor Blue
        npm run serve
    } else {
        Write-Host "🚀 開発サーバーを起動中..." -ForegroundColor Blue
        npm start
    }
} catch {
    Write-Host ""
    Write-Host "❌ エラーが発生しました: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "解決方法:"
    Write-Host "1. Node.jsがインストールされているか確認"
    Write-Host "2. 管理者権限でPowerShellを実行"
    Write-Host "3. 実行ポリシーを確認: Get-ExecutionPolicy"
    Write-Host ""
} finally {
    Write-Host ""
    Write-Host "アプリが終了しました。" -ForegroundColor Yellow
    Write-Host "何かキーを押して閉じてください..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
