#!/bin/bash

# Script untuk menghentikan kedua service

echo "🛑 Menghentikan Restaurant APP Services..."
echo ""

# Baca PID dari file jika ada
if [ -f logs/provider.pid ]; then
    PROVIDER_PID=$(cat logs/provider.pid)
    if ps -p $PROVIDER_PID > /dev/null 2>&1; then
        echo "⏹️  Menghentikan Provider-service (PID: $PROVIDER_PID)..."
        kill -9 $PROVIDER_PID 2>/dev/null
    fi
    rm logs/provider.pid
fi

if [ -f logs/customer.pid ]; then
    CUSTOMER_PID=$(cat logs/customer.pid)
    if ps -p $CUSTOMER_PID > /dev/null 2>&1; then
        echo "⏹️  Menghentikan Customer-service (PID: $CUSTOMER_PID)..."
        kill -9 $CUSTOMER_PID 2>/dev/null
    fi
    rm logs/customer.pid
fi

# Kill berdasarkan port juga (backup)
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "⏹️  Menghentikan proses di port $port (PID: $pid)..."
        kill -9 $pid 2>/dev/null
    fi
}

kill_port 4001
kill_port 4002

echo ""
echo "✅ Semua service sudah dihentikan!"

