#!/bin/bash
# CARAXE — Script de déploiement rapide
# Lance ce script depuis le dossier caraxe-app

echo "🐉 CARAXE — Déploiement en cours..."

# 1. Init git propre
rm -rf .git
git init
git branch -M main

# 2. Ajouter les fichiers (pas node_modules, pas .env, pas dist)
git add package.json package-lock.json vite.config.js index.html vercel.json .gitignore .env.example SETUP.md
git add src/ supabase/

# 3. Commit
git commit -m "🐉 CARAXE v1 — Agent sourcing Chine"

# 4. Push vers GitHub
git remote add origin https://github.com/zinedinebsz-rgb/caraxe-app.git
git push -u origin main --force

echo ""
echo "✅ Code poussé sur GitHub !"
echo "👉 Maintenant va sur https://vercel.com/new et importe le repo 'caraxe-app'"
echo "   Variables d'env à ajouter sur Vercel :"
echo "   VITE_SUPABASE_URL = https://zuebhkibddphtlyvuboe.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY = (copie la clé depuis Supabase > Settings > API Keys)"
echo ""
echo "🔥 CARAXE est prêt à conquérir !"
