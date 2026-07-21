#!/usr/bin/env bash
# Render.com build script for VAYU AI Service
set -e

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🤖 Retraining ML models with installed scikit-learn version..."
python train_models.py

echo "✅ Build complete — models are compatible with installed scikit-learn"
