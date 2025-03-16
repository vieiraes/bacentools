document.addEventListener('DOMContentLoaded', function () {
    let templatesLoaded = 0;
    let totalTemplates = 0;
    
    // Função para carregar um template HTML e inserir no elemento de destino
    async function loadTemplate(templatePath, targetSelector) {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) return;

        try {
            const response = await fetch(templatePath);
            if (!response.ok) {
                throw new Error(`Falha ao carregar o template: ${response.status}`);
            }

            const html = await response.text();
            targetElement.innerHTML = html;
            
            // Incrementar contador de templates carregados
            templatesLoaded++;
            
            // Verificar se todos os templates foram carregados
            if (templatesLoaded >= totalTemplates) {
                // Disparar evento único quando todos os templates estiverem carregados
                console.log('Todos os templates foram carregados');
                document.dispatchEvent(new CustomEvent('all-templates-loaded'));
            }

        } catch (error) {
            console.error(`Erro ao carregar o template ${templatePath}:`, error);
            templatesLoaded++; // Incrementar mesmo em caso de erro para não travar o processo
            
            if (templatesLoaded >= totalTemplates) {
                document.dispatchEvent(new CustomEvent('all-templates-loaded'));
            }
        }
    }

    // Contar total de templates a serem carregados
    const templates = document.querySelectorAll('[data-template]');
    totalTemplates = templates.length;
    console.log(`Encontrados ${totalTemplates} templates para carregar`);
    
    if (totalTemplates === 0) {
        // Se não houver templates, disparar o evento imediatamente
        document.dispatchEvent(new CustomEvent('all-templates-loaded'));
    } else {
        // Carregar todos os templates declarados com data-template
        templates.forEach(element => {
            const templatePath = element.getAttribute('data-template');
            loadTemplate(templatePath, `[data-template="${templatePath}"]`);
        });
    }
});

// Reinicializar Alpine.js quando todos os templates forem carregados
document.addEventListener('all-templates-loaded', function() {
    console.log('Evento all-templates-loaded disparado, reinicializando Alpine.js');
    
    // Pequeno timeout para garantir que o DOM foi completamente atualizado
    setTimeout(() => {
        if (window.Alpine) {
            console.log('Alpine encontrado, reinicializando...');
            try {
                // Para Alpine.js versão 3.x
                if (typeof window.Alpine.initTree === 'function') {
                    window.Alpine.initTree(document.body);
                    console.log('Alpine.js reinicializado com initTree');
                } 
                // Método alternativo de reinicialização
                else {
                    document.querySelectorAll('[x-data]').forEach(el => {
                        if (window.Alpine.initializeComponent) {
                            window.Alpine.initializeComponent(el);
                            console.log('Componente Alpine reinicializado:', el);
                        }
                    });
                }
            } catch (error) {
                console.error('Erro ao reinicializar o Alpine.js:', error);
            }
        } else {
            console.warn('Alpine.js não encontrado no objeto window');
        }
    }, 50);
});