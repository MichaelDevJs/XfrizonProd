#!/bin/bash
# Startup verification script for Xfrizon Backend

echo "================================================"
echo "Xfrizon Backend - Startup Verification"
echo "================================================"
echo ""

# Check Java version
echo "[1/4] Checking Java version..."
JAVA_VERSION=$(java -version 2>&1 | grep -oP '(?<=version ")[^"]*' | cut -d'.' -f1)
if [ -n "$JAVA_VERSION" ] && [ "$JAVA_VERSION" -ge 21 ]; then
    echo "✓ Java version $JAVA_VERSION found (requirement: 21+)"
else
    echo "✗ Java 21+ not found"
    exit 1
fi
echo ""

# Check MySQL connection
echo "[2/4] Checking MySQL connection..."
if mysql -u root -proot -e "SELECT 1" 2>/dev/null; then
    echo "✓ MySQL is running and accessible"
else
    echo "✗ Cannot connect to MySQL"
    exit 1
fi
echo ""

# Check Maven compile
echo "[3/4] Building project..."
if ./mvnw.cmd clean compile -q -DskipTests; then
    echo "✓ Project compiles successfully"
else
    echo "✗ Project compilation failed"
    exit 1
fi
echo ""

# Build JAR
echo "[4/4] Building JAR package..."
if ./mvnw.cmd clean package -q -DskipTests; then
    echo "✓ JAR package built successfully"
else
    echo "✗ JAR build failed"
    exit 1
fi
echo ""

echo "================================================"
echo "✓ All checks passed!"
echo "================================================"
echo ""
echo "To start the application, run:"
echo "  java -jar target/xfrizon-ts-0.0.1-SNAPSHOT.jar"
echo ""
echo "Application will be available at:"
echo "  http://localhost:8080/api/v1"
echo ""

