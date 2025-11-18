#!/bin/bash

# AI Retreat Planner - Development Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up AI Retreat Planner development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✓ Node.js $(node -v) found"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You'll need to set up PostgreSQL manually."
else
    echo "✓ Docker found"
    echo "📦 Starting PostgreSQL container..."
    docker-compose up -d
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.local.example .env.local
    echo "⚠️  Please edit .env.local and add your OPENAI_API_KEY"
else
    echo "✓ .env.local already exists"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Push schema to database
echo "🗄️  Setting up database schema..."
npm run db:push

# Seed database
echo "🌱 Seeding database with demo data..."
npm run db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env.local and add your OPENAI_API_KEY"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Visit http://localhost:3000"
echo ""
