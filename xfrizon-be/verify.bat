@echo off
REM Xfrizon Backend - Quick Verification Script

echo ================================================
echo Xfrizon Backend - Startup Verification
echo ================================================
echo.

echo [1/3] Checking Java Installation...
java -version
echo.

echo [2/3] Checking Maven Build...
cd C:\Users\User\Desktop\Xfrizon\xfrizon-be
call .\mvnw.cmd clean compile -q -DskipTests
if %ERRORLEVEL% EQU 0 (
    echo ✓ Project compiles successfully
) else (
    echo ✗ Compilation failed
    exit /b 1
)
echo.

echo [3/3] Building JAR...
call .\mvnw.cmd package -q -DskipTests
if %ERRORLEVEL% EQU 0 (
    echo ✓ JAR built successfully
    dir target\*.jar
) else (
    echo ✗ Build failed
    exit /b 1
)
echo.

echo ================================================
echo ✓ All verification checks passed!
echo ================================================
echo.
echo To start the application, run:
echo   java -jar target/xfrizon-ts-0.0.1-SNAPSHOT.jar
echo.
echo The application will be available at:
echo   http://localhost:8080/api/v1
echo.
pause

