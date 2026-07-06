@echo off
echo ========================================
echo   Push Talkers to GitHub
echo ========================================
echo.

:: Check if git is initialized
if not exist .git (
    echo Initializing Git repository...
    git init
    git remote add origin https://github.com/Ayupanchal18/Talkers.git
    echo.
)

:: Show status
echo Current Git Status:
echo -------------------
git status
echo.

:: Confirm with user
set /p confirm="Do you want to add all files and push to GitHub? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b
)

echo.
echo Adding all files...
git add .

echo.
echo Committing changes...
git commit -m "Add Render deployment configuration and documentation"

echo.
echo Pushing to GitHub...
git push -u origin master

echo.
echo ========================================
echo   ✅ Done!
echo ========================================
echo.
echo Your code is now on GitHub!
echo Repository: https://github.com/Ayupanchal18/Talkers
echo.
echo Next step: Deploy to Render
echo Follow COMPLETE_DEPLOYMENT_STEPS.md
echo.
pause
