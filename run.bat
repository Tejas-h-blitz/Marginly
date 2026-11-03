@echo off
echo ========================================================
echo   Launching Marginly
echo   Stack: TypeScript, Express, Prisma, PostgreSQL, React, Tailwind CSS, Recharts
echo   Opening at: http://localhost:3001
echo ========================================================
npm run build
if errorlevel 1 (
  pause
  exit /b 1
)
npm start
pause
