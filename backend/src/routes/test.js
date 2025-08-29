import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { TEST_URLS, TEST_CREDENTIALS, getRhevolutionUrl, getTestCredentials } from '../config/test-urls.js';
import RhevolutionScraper from '../services/RhevolutionScraper.js';

const router = express.Router();

/**
 * GET /api/test/urls
 * Retorna as URLs de teste disponíveis
 */
router.get('/urls', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'URLs de teste disponíveis',
    data: {
      urls: TEST_URLS,
      environments: Object.keys(TEST_URLS)
    }
  });
}));

/**
 * GET /api/test/credentials
 * Retorna as credenciais de teste (sem senhas por segurança)
 */
router.get('/credentials', asyncHandler(async (req, res) => {
  const sanitizedCredentials = {};
  
  Object.keys(TEST_CREDENTIALS).forEach(env => {
    sanitizedCredentials[env] = {
      username: TEST_CREDENTIALS[env].username,
      database: TEST_CREDENTIALS[env].database,
      password: '***' // Mascarar senha
    };
  });
  
  res.json({
    success: true,
    message: 'Credenciais de teste disponíveis',
    data: {
      credentials: sanitizedCredentials,
      note: 'Senhas mascaradas por segurança'
    }
  });
}));

/**
 * POST /api/test/quick-login
 * Teste rápido de login com ambiente específico
 */
router.post('/quick-login', asyncHandler(async (req, res) => {
  const { environment = 'DEMO' } = req.body;
  
  console.log(`🧪 Teste rápido de login - Ambiente: ${environment}`);
  
  const url = getRhevolutionUrl(environment);
  const credentials = getTestCredentials(environment);
  
  // Criar instância temporária do scraper para teste
  const testScraper = new RhevolutionScraper();
  
  try {
    // Configurar URL temporariamente
    process.env.RHEVOLUTION_URL = url;
    
    const result = await testScraper.login(credentials.username, credentials.password);
    
    res.json({
      success: true,
      message: `Login de teste realizado com sucesso no ambiente ${environment}`,
      data: {
        environment,
        url,
        username: credentials.username,
        sessionId: result.sessionId?.substring(0, 20) + '...',
        loginTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(401).json({
      success: false,
      message: `Falha no login de teste para ambiente ${environment}`,
      error: error.message,
      data: {
        environment,
        url,
        username: credentials.username
      }
    });
  } finally {
    // Limpar recursos
    await testScraper.close();
  }
}));

/**
 * POST /api/test/connectivity
 * Testa conectividade com diferentes URLs
 */
router.post('/connectivity', asyncHandler(async (req, res) => {
  const { environments = ['DEMO'] } = req.body;
  
  console.log(`🌐 Testando conectividade para ambientes: ${environments.join(', ')}`);
  
  const results = [];
  
  for (const env of environments) {
    const url = getRhevolutionUrl(env);
    
    try {
      // Teste simples de conectividade (sem login)
      const testScraper = new RhevolutionScraper();
      
      // Configurar URL temporariamente
      const originalUrl = process.env.RHEVOLUTION_URL;
      process.env.RHEVOLUTION_URL = url;
      
      await testScraper.init();
      
      // Tentar navegar para a página
      const page = await testScraper.browser.newPage();
      const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
      
      results.push({
        environment: env,
        url,
        status: 'success',
        statusCode: response.status(),
        responseTime: Date.now()
      });
      
      await page.close();
      await testScraper.close();
      
      // Restaurar URL original
      process.env.RHEVOLUTION_URL = originalUrl;
      
    } catch (error) {
      results.push({
        environment: env,
        url,
        status: 'error',
        error: error.message,
        responseTime: Date.now()
      });
    }
  }
  
  res.json({
    success: true,
    message: 'Teste de conectividade concluído',
    data: {
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length
      }
    }
  });
}));

export default router;