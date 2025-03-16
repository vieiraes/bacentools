#!/bin/bash

# Função para tratar sinais de término
handle_exit() {
    echo "Recebido sinal para encerrar"
    kill -TERM $APP_PID 2>/dev/null
    exit 0
}

# Registrar trap para sinais
trap handle_exit SIGINT SIGTERM

echo "Iniciando aplicação..."
node dist/main &
APP_PID=$!

# Loop para manter o container vivo e reiniciar aplicação se necessário
while true; do
    if ! kill -0 $APP_PID 2>/dev/null; then
        echo "Aplicação encerrou. Reiniciando em 5 segundos..."
        sleep 5
        node dist/main &
        APP_PID=$!
    fi
    sleep 2
done
