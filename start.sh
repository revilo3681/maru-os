#!/usr/bin/env bash
# 🌊 MARU OS — Script de arranque completo
# Inicia Ollama con acceso desde Docker + levanta todos los contenedores

set -e

echo ""
echo "🌊 ==============================="
echo "   MARU OS — Arranque Completo"
echo "=================================="
echo ""

# 1. Verificar si Ollama ya está corriendo
if curl -s --connect-timeout 1 http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "✅ Ollama ya está activo en localhost:11434"
else
  echo "🚀 Iniciando Ollama con acceso desde Docker (0.0.0.0:11434)..."
  OLLAMA_HOST=0.0.0.0 ollama serve &
  OLLAMA_PID=$!
  echo "   PID de Ollama: $OLLAMA_PID"
  
  # Esperar hasta 15 segundos a que Ollama arranque
  echo "   Esperando conexión..."
  for i in {1..15}; do
    if curl -s --connect-timeout 1 http://localhost:11434/api/tags > /dev/null 2>&1; then
      echo "✅ Ollama activo después de ${i}s"
      break
    fi
    sleep 1
    echo "   ... ${i}s"
  done
fi

echo ""
echo "📋 Modelos disponibles en Ollama:"
curl -s http://localhost:11434/api/tags 2>/dev/null | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    for m in d.get('models', []):
        size_gb = m.get('size', 0) / 1e9
        print(f'   ✓ {m[\"name\"]} ({size_gb:.1f} GB)')
except:
    print('   (No se pudo leer la lista de modelos)')
" 2>/dev/null || echo "   (Ollama no responde aún)"

echo ""
echo "🐳 Levantando contenedores Docker..."
# Limpiar redes obsoletas para evitar error "network not found" post docker compose down
docker network prune -f > /dev/null 2>&1 || true
docker compose up -d

echo ""
echo "=================================="
echo "✅ MARU OS listo!"
echo ""
echo "   🌐 Frontend:  http://localhost:3000"
echo "   ⚡ Backend:   http://localhost:8000"
echo "   🤖 Ollama:    http://localhost:11434"
echo "=================================="
echo ""
