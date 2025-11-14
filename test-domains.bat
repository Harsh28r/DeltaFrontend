@echo off
echo ========================================
echo Testing DeltaYards CRM Domains
echo ========================================
echo.

echo [1/3] Testing DNS Resolution...
echo.
nslookup realtechmktg.com
echo.
echo ---
echo.

echo [2/3] Testing Frontend Domain...
echo.
curl -I https://realtechmktg.com 2>&1
echo.
echo ---
echo.

echo [3/3] Testing API Domain...
echo.
curl -I https://api.realtechmktg.com 2>&1
echo.
echo ---
echo.

echo ========================================
echo Test Complete
echo ========================================
echo.
echo If you see "Could not resolve host" - DNS not ready yet (wait longer)
echo If you see "200 OK" or HTML - Everything is working!
echo.
pause
