# Zeabur 一键部署（国内访问较稳定）
Set-Location $PSScriptRoot\..

Write-Host ">>> 登录 Zeabur（浏览器）..." -ForegroundColor Cyan
npx zeabur@latest login

Write-Host ">>> 开始部署..." -ForegroundColor Cyan
npx zeabur@latest deploy

Write-Host ">>> 部署完成后，在终端或 Zeabur 控制台复制公网链接" -ForegroundColor Green
