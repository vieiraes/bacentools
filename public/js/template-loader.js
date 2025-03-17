/**
 * Sistema de carregamento de templates para BacenTools - Versão Simplificada
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('Iniciando carregamento de templates...');

    let templatesLoaded = 0;
    
    // Coletar todos os elementos com atributo data-template
    const templates = document.querySelectorAll('[data-template]');
    const totalTemplates = templates.length;
    
    console.log(`Encontrados ${totalTemplates} templates para carregar`);
    
    if (totalTemplates === 0) {
        // Se não houver templates, disparar o evento imediatamente
        console.log('Nenhum template para carregar');
        document.dispatchEvent(new CustomEvent('all-templates-loaded'));
        return;
    }
    
    // Função para verificar se todos os templates foram carregados
    function checkAllTemplatesLoaded() {
        if (templatesLoaded >= totalTemplates) {
            console.log('Todos os templates foram carregados com sucesso');
            
            // Pequeno delay para garantir que o DOM foi atualizado
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('all-templates-loaded'));
            }, 10);
        }
    }
    
    // Carregar cada template
    templates.forEach(element => {
        const templatePath = element.getAttribute('data-template');
        
        if (!templatePath) {
            console.warn('Elemento com data-template sem caminho especificado');
            templatesLoaded++;
            checkAllTemplatesLoaded();
            return;
        }
        
        fetch(templatePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                element.innerHTML = html;
                console.log(`Template ${templatePath} carregado com sucesso`);
                templatesLoaded++;
                checkAllTemplatesLoaded();
            })
            .catch(error => {
                console.error(`Erro ao carregar template ${templatePath}:`, error);
                element.innerHTML = `<div class="alert alert-danger">Erro: ${error.message}</div>`;
                templatesLoaded++;
                checkAllTemplatesLoaded();
            });
    });
});

// Listener básico para debugging
document.addEventListener('all-templates-loaded', function() {
    console.log('Evento all-templates-loaded disparado - todos os templates foram carregados');
});