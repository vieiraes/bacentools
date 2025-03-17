#!/bin/bash

# Função para tratar sinais de término
handle_exit() {
    echo "Recebido sinal para encerrar o backend"
    kill -TERM $API_PID 2>/dev/null
    exit 0
}

# Registrar trap para sinais
trap handle_exit SIGINT SIGTERM

echo "====================================="
echo "Iniciando BacenTools API (Backend Only)"
echo "====================================="

# Verificar variáveis de ambiente
echo "Ambiente: $NODE_ENV"
echo "Porta: $PORT"
echo "====================================="

# Iniciar o backend NestJS
echo "Iniciando servidor NestJS..."
cd /app
node dist/main.js &
API_PID=$!
echo "NestJS iniciado com PID $API_PID"

# Informação de log para saúde do serviço
echo "$(date) - Backend iniciado com sucesso. Aguardando requisições em /api/*"

# Loop para manter o container vivo e reiniciar aplicação se necessário
while true; do
    if ! kill -0 $API_PID 2>/dev/null; then
        echo "$(date) - Servidor NestJS encerrou inesperadamente. Reiniciando em 3 segundos..."
        sleep 3
        echo "Reiniciando NestJS..."
        node dist/main.js &
        API_PID=$!
        echo "NestJS reiniciado com PID $API_PID"
    fi
    sleep 5
done
