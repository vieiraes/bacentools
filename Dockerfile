# Usar a imagem oficial do Node.js 
FROM node:20-slim

# Definir o diretório de trabalho
WORKDIR /app

# Instalar dependências necessárias
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

# Copiar os arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Compilar o projeto
RUN npm run build

# Expor a porta da aplicação
EXPOSE 8080

# Iniciar a aplicação
CMD ["node", "dist/main.js"]