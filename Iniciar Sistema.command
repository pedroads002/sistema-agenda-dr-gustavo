#!/bin/bash
# Duplo-clique neste arquivo para ligar o Sistema Dr. Gustavo Amaral.
#
# O que ele faz:
#   1. Prepara o sistema na primeira vez que for usado (pode demorar alguns minutos).
#   2. Liga o sistema.
#   3. Abre o navegador sozinho no endereço certo.
#
# Para DESLIGAR o sistema: feche esta janela do Terminal (ou pressione Ctrl+C).

cd "$(dirname "$0")" || exit 1

PORTA=3333
ENDERECO="http://localhost:$PORTA"

echo "======================================================"
echo "  Sistema Dr. Gustavo Amaral"
echo "======================================================"
echo ""

if [ ! -d "node_modules" ]; then
  echo "Primeira vez usando o sistema: instalando (pode levar alguns minutos)..."
  npm install
  if [ $? -ne 0 ]; then
    echo ""
    echo "Ocorreu um erro na instalação. Copie a mensagem acima e peça ajuda."
    read -n 1 -s -r -p "Pressione qualquer tecla para fechar..."
    exit 1
  fi
fi

if [ ! -f "backend/dist/server.js" ] || [ ! -f "frontend/dist/index.html" ]; then
  echo "Preparando o sistema para uso (primeira vez ou após uma atualização)..."
  npm run build
  if [ $? -ne 0 ]; then
    echo ""
    echo "Ocorreu um erro ao preparar o sistema. Copie a mensagem acima e peça ajuda."
    read -n 1 -s -r -p "Pressione qualquer tecla para fechar..."
    exit 1
  fi
fi

echo ""
echo "Ligando o sistema..."
npm run start &
SERVIDOR_PID=$!

sleep 3
open "$ENDERECO"

echo ""
echo "------------------------------------------------------"
echo "  Sistema no ar em: $ENDERECO"
echo ""
echo "  Deixe esta janela aberta enquanto estiver usando o sistema."
echo "  Para DESLIGAR: feche esta janela (ou pressione Ctrl+C)."
echo "------------------------------------------------------"
echo ""

wait $SERVIDOR_PID
