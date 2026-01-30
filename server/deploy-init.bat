@echo off
echo ======================================================
echo Smart-CS System Deployment Tool
echo ======================================================

echo Checking MySQL Connection...
:: 尝试连接本地数据库并执行初始化 SQL
mysql -u root -p -e "source ../docs/database.sql"

if %errorlevel% equ 0 (
    echo [SUCCESS] Database initialized successfully.
    echo Starting Server...
    cd ../server && npm run start:prod
) else (
    echo [ERROR] Failed to connect to MySQL. Please check your credentials.
    pause
)
