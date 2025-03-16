(function () {
    // Detectar se estamos em ambiente local ou produção
    const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

    // Configurar a URL da API baseada no ambiente
    window.CONFIG = {
        API_URL: isLocalhost
            ? "http://localhost:3344"
            : "https://bacentools-api.fly.dev"
    };

    console.log("Ambiente detectado:", isLocalhost ? "Local" : "Produção");
    console.log("API URL configurada:", window.CONFIG.API_URL);
})();