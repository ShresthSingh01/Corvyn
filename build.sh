#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> 1. Installing Python dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo "==> 2. Building Vite React Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "==> 3. Initializing demo case..."
python seed_case.py

echo "==> Corvyn build completed successfully!"
