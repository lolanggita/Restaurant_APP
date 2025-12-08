#!/bin/bash

# Script untuk menjalankan kedua service
# Provider-service: Port 4001
# Customer-service: Port 4002

echo "🚀 Starting Restaurant APP Services..."
echo ""

# Fungsi untuk kill process di port tertentu
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "⚠️  Port $port sudah digunakan (PID: $pid), menghentikan proses..."
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Kill proses yang menggunakan port 4001 dan 4002
kill_port 4001
kill_port 4002

echo "✅ Port 4001 dan 4002 sudah bebas"
echo ""

# Start provider-service di background
echo "📦 Starting Provider-service (Port 4001)..."
cd provider-service/backend

# Pastikan dependencies terinstall
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi

# Jalankan seed jika database kosong (optional)
if [ ! -f "provider.db" ] || [ ! -s "provider.db" ]; then
    echo "   Running seed data..."
    npm run seed 2>/dev/null || node seed.js 2>/dev/null || true
fi

npm start > ../../logs/provider.log 2>&1 &
PROVIDER_PID=$!
echo "   Provider-service PID: $PROVIDER_PID"
cd ../..

# Tunggu sebentar
sleep 2

# Start customer-service di background
echo "🛒 Starting Customer-service (Port 4002)..."
cd customer-service/backend
npm start > ../../logs/customer.log 2>&1 &
CUSTOMER_PID=$!
echo "   Customer-service PID: $CUSTOMER_PID"
cd ../..

# Tunggu sebentar
sleep 2

echo ""
echo "✅ Kedua service sudah berjalan!"
echo ""
echo "📍 Provider-service: http://localhost:4001"
echo "📍 Customer-service: http://localhost:4002"
echo ""
echo "📋 Logs tersimpan di:"
echo "   - logs/provider.log"
echo "   - logs/customer.log"
echo ""
echo "🛑 Untuk menghentikan semua service, jalankan: ./stop-services.sh"
echo ""

# Simpan PID ke file untuk stop script
mkdir -p logs
echo $PROVIDER_PID > logs/provider.pid
echo $CUSTOMER_PID > logs/customer.pid

