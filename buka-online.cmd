@echo off
REM ============================================================
REM  ATS CV Builder - jalankan untuk akses dari perangkat lain
REM  URL publik : https://certainly-amusing-jaguar.ngrok-free.app
REM  Tidak perlu mengubah konfigurasi saat dijalankan ulang.
REM ============================================================
setlocal
cd /d "%~dp0"

echo [1/3] Menyalakan backend (http://127.0.0.1:4000) ...
start "CV Builder - Backend" cmd /k "npm run dev -w backend"

echo [2/3] Build frontend lalu preview (http://127.0.0.1:5173) ...
start "CV Builder - Frontend" cmd /k "npm run build -w frontend && npm run preview -w frontend -- --port 5173"

echo [3/3] Menyalakan tunnel ngrok ...
start "CV Builder - Ngrok" cmd /k "ngrok start cvapp"

echo.
echo Tunggu sampai semua jendela siap, lalu buka dari perangkat lain:
echo   https://certainly-amusing-jaguar.ngrok-free.app
echo.
echo Catatan: backend memakai API key di backend/.env. Tutup jendela
echo "CV Builder - Ngrok" begitu selesai mencoba agar tidak terbuka publik.
endlocal