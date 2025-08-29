/**
 * URLs de teste para diferentes ambientes do Rhevolution
 * Use essas URLs para testar o web scraping em diferentes cenários
 */

export const TEST_URLS = {
  // URL de demonstração (não funcional - para testes de erro)
  DEMO: 'https://rhevolution.example.com',
  
  // URLs de teste comuns (substitua pelas URLs reais quando disponíveis)
  DEVELOPMENT: 'https://rhevolution-dev.techware.com.br',
  STAGING: 'https://rhevolution-staging.techware.com.br',
  PRODUCTION: 'https://rhevolution.techware.com.br',
  
  // URLs específicas de clientes (exemplos)
  GLOBAL_HITSS: 'https://rh.globalhitss.com.br',
  CLARO: 'https://rhevolution.claro.com.br',
  
  // URL local para desenvolvimento (se disponível)
  LOCAL: 'http://localhost:8080/rhevolution'
};

export const TEST_CREDENTIALS = {
  DEMO: {
    username: 'demo_user',
    password: 'demo_password',
    database: 'rh_evolution'
  },
  
  DEVELOPMENT: {
    username: process.env.DEV_USERNAME || 'dev_user',
    password: process.env.DEV_PASSWORD || 'dev_password',
    database: process.env.DEV_DATABASE || 'rh_dev'
  }
};

/**
 * Função para obter URL baseada no ambiente
 */
export function getRhevolutionUrl(environment = 'DEMO') {
  return TEST_URLS[environment] || TEST_URLS.DEMO;
}

/**
 * Função para obter credenciais baseadas no ambiente
 */
export function getTestCredentials(environment = 'DEMO') {
  return TEST_CREDENTIALS[environment] || TEST_CREDENTIALS.DEMO;
}