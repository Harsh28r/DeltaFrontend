@echo off
echo ========================================
echo Production Debug Checklist
echo ========================================
echo.

echo 1. Checking .env.production file...
type .env.production
echo.

echo 2. Checking if API is reachable...
curl -I https://api.realtechmktg.com 2>&1
echo.

echo 3. Testing API endpoint...
curl https://api.realtechmktg.com/api/projects 2>&1
echo.

echo 4. Checking if build exists...
if exist .next\BUILD_ID (
    echo Build exists:
    type .next\BUILD_ID
) else (
    echo ERROR: Build not found! Run 'npm run build' first
)
echo.

echo 5. Starting production server...
echo Run: npm start
echo.
echo If you see errors, common fixes:
echo - Make sure API server is running
echo - Check CORS settings on backend
echo - Verify environment variables
echo ========================================
pause
