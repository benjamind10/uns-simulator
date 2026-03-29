#!/bin/bash
echo "🛑 Stopping containers..."
docker compose down

echo "🔨 Rebuilding images with new code..."
docker compose build --no-cache

echo "🚀 Starting containers..."
docker compose up -d

echo "✅ Done! Check the broker modal now."
