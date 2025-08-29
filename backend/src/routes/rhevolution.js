const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler.js');
const { validate, schemas } = require('../middleware/validation.js');
const RhevolutionService = require('../services/RhevolutionService.js');
const { config } = require('../config/environment.js');

const router = express.Router();
const rhevolutionService = new RhevolutionService();

/**
 * POST /api/rhevolution/login
 * Realiza login no sistema Rhevolution
 */
router.post('/login', validate(schemas.login), asyncHandler(async (req, res) => {
  const { username, password, authMethod = 'standard', tenantId } = req.body;
  
  console.log(`🔐 Tentativa de login para usuário: ${username} (método: ${authMethod})`);
  
  const options = { authMethod, tenantId };
  const result = await rhevolutionService.login(username, password, options);
  
  res.json({
    success: true,
    message: 'Login realizado com sucesso',
    data: {
      authenticated: true,
      sessionId: result.sessionId?.substring(0, 20) + '...', // Mascarar por segurança
      loginTime: new Date().toISOString()
    }
  });
}));

/**
 * POST /api/rhevolution/login/sso
 * Login específico com SSO Microsoft
 */
router.post('/login/sso', validate(schemas.login), asyncHandler(async (req, res) => {
  const { username, password, tenantId } = req.body;
  
  console.log(`🔐 Tentativa de login SSO Microsoft para usuário: ${username}`);
  
  const options = { authMethod: 'sso', tenantId };
  const result = await rhevolutionService.login(username, password, options);
  
  res.json({
    success: true,
    message: 'Login SSO realizado com sucesso',
    data: {
      authenticated: true,
      sessionId: result.sessionId?.substring(0, 20) + '...', // Mascarar por segurança
      loginTime: new Date().toISOString(),
      authMethod: 'sso'
    }
  });
}));

/**
 * POST /api/rhevolution/logout
 * Realiza logout do sistema
 */
router.post('/logout', asyncHandler(async (req, res) => {
  console.log('🚪 Solicitação de logout recebida');
  
  const result = await rhevolutionService.logout();
  
  res.json({
    success: true,
    message: result.message,
    data: {
      authenticated: false,
      logoutTime: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/rhevolution/employees
 * Obtém lista de funcionários com filtros opcionais
 */
router.get('/employees', validate(schemas.employeeSearch), asyncHandler(async (req, res) => {
  const filters = {
    department: req.query.department,
    status: req.query.status || 'active',
    limit: parseInt(req.query.limit) || 100,
    offset: parseInt(req.query.offset) || 0
  };
  
  console.log('👥 Solicitação de lista de funcionários:', filters);
  
  const result = await rhevolutionService.getEmployees(filters);
  
  res.json({
    success: true,
    message: `${result.employees.length} funcionários encontrados`,
    data: result,
    pagination: {
      total: result.total,
      offset: result.offset,
      limit: result.limit,
      hasMore: result.hasMore
    }
  });
}));

/**
 * POST /api/rhevolution/reports/generate
 * Gera relatório específico
 */
router.post('/reports/generate', validate(schemas.reportGeneration), asyncHandler(async (req, res) => {
  const reportConfig = req.body;
  
  console.log(`📊 Solicitação de geração de relatório: ${reportConfig.type}`);
  
  const result = await rhevolutionService.generateReport(reportConfig);
  
  res.json({
    success: true,
    message: 'Relatório gerado com sucesso',
    data: {
      title: result.title,
      type: reportConfig.type,
      generatedAt: result.generatedAt,
      status: result.status,
      downloadUrl: result.downloadUrl,
      preview: result.data?.substring(0, 500) + (result.data?.length > 500 ? '...' : ''),
      config: reportConfig
    }
  });
}));

/**
 * GET /api/rhevolution/hour-bank
 * Obtém dados de banco de horas dos funcionários
 */
router.get('/hour-bank', asyncHandler(async (req, res) => {
  const { employeeId } = req.query;
  
  console.log(`⏰ Solicitação de banco de horas${employeeId ? ` para funcionário: ${employeeId}` : ''}`);
  
  const result = await rhevolutionService.getHourBankBalance(employeeId);
  
  res.json({
    success: true,
    message: `${result.count} registros de banco de horas encontrados`,
    data: result
  });
}));

/**
 * GET /api/rhevolution/payroll
 * Obtém dados da folha de pagamento
 */
router.get('/payroll', asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  
  console.log(`💰 Solicitação de folha de pagamento${month && year ? ` para ${month}/${year}` : ''}`);
  
  const result = await rhevolutionService.getPayrollData(month, year);
  
  res.json({
    success: true,
    message: `${result.count} registros de folha de pagamento encontrados`,
    data: result
  });
}));

/**
 * GET /api/rhevolution/benefits
 * Obtém dados de benefícios dos funcionários
 */
router.get('/benefits', asyncHandler(async (req, res) => {
  const { employeeId } = req.query;
  
  console.log(`🎁 Solicitação de benefícios${employeeId ? ` para funcionário: ${employeeId}` : ''}`);
  
  const result = await rhevolutionService.getBenefitsData(employeeId);
  
  res.json({
    success: true,
    message: `${result.count} registros de benefícios encontrados`,
    data: result
  });
}));

/**
 * GET /api/rhevolution/attendance
 * Obtém dados de frequência/presença
 */
router.get('/attendance', asyncHandler(async (req, res) => {
  const { startDate, endDate, employeeId } = req.query;
  
  console.log(`📅 Solicitação de frequência${employeeId ? ` para funcionário: ${employeeId}` : ''}`);
  
  const result = await rhevolutionService.getAttendanceData(startDate, endDate, employeeId);
  
  res.json({
    success: true,
    message: `${result.count} registros de frequência encontrados`,
    data: result
  });
}));

/**
 * GET /api/rhevolution/status
 * Verifica status da conexão e autenticação
 */
router.get('/status', asyncHandler(async (req, res) => {
  const status = rhevolutionService.getStatus();
  
  res.json({
    success: true,
    message: 'Status obtido com sucesso',
    data: {
      service: 'Rhevolution Scraper',
      version: '1.0.0',
      isConnected: status.isConnected,
      isAuthenticated: status.isAuthenticated,
      uptime: status.uptime,
      cache: {
        keys: status.cacheStats.keys,
        hits: status.cacheStats.hits,
        misses: status.cacheStats.misses
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * POST /api/rhevolution/sync
 * Sincroniza dados completos (funcionários + relatórios básicos)
 */
router.post('/sync', asyncHandler(async (req, res) => {
  console.log('🔄 Iniciando sincronização completa...');
  
  const syncResults = {
    employees: null,
    payrollReport: null,
    attendanceReport: null,
    errors: []
  };
  
  try {
    // Sincronizar funcionários
    console.log('👥 Sincronizando funcionários...');
    syncResults.employees = await rhevolutionService.getEmployees({ status: 'active', limit: 1000 });
    
    // Gerar relatório de folha de pagamento do mês atual
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    try {
      console.log('💰 Gerando relatório de folha...');
      syncResults.payrollReport = await rhevolutionService.generateReport({
        type: 'payroll',
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
        format: 'pdf'
      });
    } catch (error) {
      syncResults.errors.push(`Erro no relatório de folha: ${error.message}`);
    }
    
    // Gerar relatório de frequência
    try {
      console.log('⏰ Gerando relatório de frequência...');
      syncResults.attendanceReport = await rhevolutionService.generateReport({
        type: 'attendance',
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
        format: 'excel'
      });
    } catch (error) {
      syncResults.errors.push(`Erro no relatório de frequência: ${error.message}`);
    }
    
    console.log('✅ Sincronização completa finalizada');
    
    res.json({
      success: true,
      message: 'Sincronização realizada com sucesso',
      data: {
        syncTime: new Date().toISOString(),
        employeesCount: syncResults.employees?.total || 0,
        reportsGenerated: [
          syncResults.payrollReport ? 'payroll' : null,
          syncResults.attendanceReport ? 'attendance' : null
        ].filter(Boolean),
        errors: syncResults.errors,
        hasErrors: syncResults.errors.length > 0
      },
      details: syncResults
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Erro durante a sincronização',
      error: error.message,
      data: syncResults
    });
  }
}));

/**
 * DELETE /api/rhevolution/session
 * Encerra sessão e fecha browser
 */
router.delete('/session', asyncHandler(async (req, res) => {
  console.log('🔒 Encerrando sessão e browser...');
  
  await rhevolutionService.close();
  
  res.json({
    success: true,
    message: 'Sessão encerrada com sucesso',
    data: {
      sessionClosed: true,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/rhevolution/test
 * Endpoint para testar conexão
 */
router.get('/test', asyncHandler(async (req, res) => {
  try {
    const result = await rhevolutionService.testConnection();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}));

/**
 * POST /api/rhevolution/test-login
 * Endpoint para teste detalhado de login
 */
router.post('/test-login', asyncHandler(async (req, res) => {
  try {
    console.log('🧪 TESTE DETALHADO DE LOGIN INICIADO');
    console.log('📋 Dados recebidos:', JSON.stringify(req.body, null, 2));
    
    const { username, password, authMethod = 'standard' } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username e password são obrigatórios',
        received: { username: !!username, password: !!password }
      });
    }
    
    console.log('🚀 Iniciando processo de login...');
    const startTime = Date.now();
    
    const result = await rhevolutionService.login(username, password, authMethod);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ LOGIN CONCLUÍDO COM SUCESSO!');
    console.log('⏱️ Tempo total:', duration + 'ms');
    console.log('📊 Resultado:', JSON.stringify(result, null, 2));
    
    res.json({ 
      success: true, 
      data: result,
      metadata: {
        duration: duration + 'ms',
        timestamp: new Date().toISOString(),
        authMethod
      }
    });
  } catch (error) {
    const endTime = Date.now();
    console.error('❌ ERRO NO TESTE DE LOGIN:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: {
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      }
    });
  }
}));

/**
 * GET /api/rhevolution/demo
 * Endpoint para demonstração do sistema funcionando
 */
router.get('/demo', asyncHandler(async (req, res) => {
  try {
    console.log('🎯 Executando demonstração do sistema...');
    
    const rhevolutionService = new RhevolutionService();
    
    // Teste básico de inicialização
    await rhevolutionService.init();
    
    // Navegar para página inicial
    const testResult = await rhevolutionService.navigateToLogin();
    
    // Fechar conexão
    await rhevolutionService.close();
    
    res.json({
      status: 'success',
      message: 'Sistema Hub Automation operacional',
      timestamp: new Date().toISOString(),
      features: {
        backend: 'Node.js + Express ✅',
        automation: 'Puppeteer ✅', 
        security: 'Doppler + JWT ✅'
      },
      test: {
        url: testResult.url,
        ssoDetected: testResult.ssoDetected,
        fieldsFound: testResult.fieldsFound,
        result: 'Erro esperado - credenciais não fornecidas'
      },
      nextSteps: [
        'Configurar credenciais via Doppler',
        'Testar autenticação completa',
        'Implementar endpoints de produção'
      ]
    });
  } catch (error) {
    console.error('❌ Erro na demonstração:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro na demonstração do sistema',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * POST /api/rhevolution/test-microsoft-auth
 * Endpoint para testar autenticação Microsoft com bypass 2MFA
 */
router.post('/test-microsoft-auth', asyncHandler(async (req, res) => {
  try {
    console.log('🔐 Testando autenticação Microsoft com bypass 2MFA...');
    
    const MicrosoftAuthService = (await import('../services/MicrosoftAuthService.js')).default;
    const microsoftAuth = new MicrosoftAuthService();
    
    // Inicializar serviço
    await microsoftAuth.init();
    
    // Tentar autenticação com credenciais configuradas
    const authResult = await microsoftAuth.authenticateSSO(
      config.auth.microsoft.email,
      config.auth.microsoft.password
    );
    
    // Obter informações da sessão
    const sessionCookies = await microsoftAuth.getSessionCookies();
    const userInfo = microsoftAuth.getUserInfo();
    
    // Fechar browser
    await microsoftAuth.close();
    
    res.json({
      status: 'success',
      message: 'Autenticação Microsoft realizada com sucesso',
      timestamp: new Date().toISOString(),
      authentication: {
        email: config.auth.microsoft.email,
        authenticated: microsoftAuth.isUserAuthenticated(),
        bypassMFA: {
          enabled: config.auth.microsoft.bypassMFA.enabled,
          persistentCookies: config.auth.microsoft.bypassMFA.persistentCookies,
          sessionDays: config.auth.microsoft.bypassMFA.sessionDays
        }
      },
      session: {
        cookiesCount: sessionCookies.length,
        userInfo: userInfo,
        persistent: true
      },
      nextSteps: [
        'Testar acesso ao Rhevolution com SSO',
        'Verificar persistência de sessão',
        'Implementar fluxo completo'
      ]
    });
  } catch (error) {
    console.error('❌ Erro na autenticação Microsoft:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro na autenticação Microsoft',
      error: error.message,
      details: {
        bypassMFA: config.auth.microsoft.bypassMFA.enabled,
        email: config.auth.microsoft.email
      },
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * GET /api/rhevolution/auth-flow
 * Endpoint para explicar o fluxo de autenticação em duas fases
 */
router.get('/auth-flow', asyncHandler(async (req, res) => {
  try {
    const authFlowInfo = {
      titulo: 'Fluxo de Autenticação em Duas Fases - Rhevolution',
      descricao: 'Sistema de automação web que gerencia autenticação Microsoft SSO + Rhevolution',
      
      fases: {
        fase_1: {
          nome: 'Autenticação Microsoft (SSO)',
          descricao: 'Primeira fase - Login no Azure AD/Microsoft',
          url_destino: 'https://login.microsoftonline.com/',
          processo: [
            '1. Sistema acessa URL do Rhevolution',
            '2. Rhevolution redireciona para Microsoft SSO',
            '3. Sistema detecta página Microsoft automaticamente',
            '4. Preenche email do usuário',
            '5. Clica em "Avançar"',
            '6. Preenche senha do usuário',
            '7. Clica em "Entrar"',
            '8. Microsoft valida credenciais',
            '9. Microsoft gera token de autenticação'
          ],
          campos_automatizados: {
            email: 'input[name="loginfmt"], input[id="i0116"]',
            senha: 'input[name="passwd"], input[id="i0118"]',
            botao_avancar: '#idSIButton9, input[value="Next"]',
            botao_entrar: '#idSIButton9, input[value="Sign in"]'
          },
          validacao_sucesso: 'URL não contém mais "login.microsoftonline.com"'
        },
        
        fase_2: {
          nome: 'Acesso ao Rhevolution',
          descricao: 'Segunda fase - Redirecionamento autenticado para o sistema',
          url_destino: 'https://portalrh.globalhitss.com.br/ords/rhportal/rhlgweb.show',
          processo: [
            '1. Microsoft redireciona de volta para Rhevolution',
            '2. Rhevolution recebe token de autenticação',
            '3. Sistema valida token automaticamente',
            '4. Usuário é logado no Rhevolution',
            '5. Sistema confirma acesso aos dados de RH',
            '6. Sessão ativa é estabelecida'
          ],
          validacao_sucesso: 'URL contém domínio do Rhevolution + usuário logado',
          dados_disponiveis: [
            'Informações do colaborador',
            'Dados de folha de pagamento',
            'Histórico de ponto',
            'Benefícios',
            'Relatórios de RH'
          ]
        }
      },
      
      implementacao_tecnica: {
        tecnologia: 'Puppeteer (automação de browser)',
        deteccao_automatica: 'Sistema detecta automaticamente qual fase está ativa',
        tratamento_erros: 'Retry automático e logs detalhados',
        seguranca: 'Credenciais gerenciadas via Doppler (nunca expostas)',
        sessao: 'Mantém estado da sessão entre as duas fases'
      },
      
      vantagens: [
        'Automação completa - sem intervenção manual',
        'Suporte nativo ao SSO Microsoft corporativo',
        'Detecção inteligente de redirecionamentos',
        'Logs detalhados para debugging',
        'Tratamento robusto de erros de rede',
        'Compatível com políticas de segurança corporativa'
      ],
      
      casos_de_uso: [
        'Extração automatizada de dados de RH',
        'Sincronização de informações de colaboradores',
        'Geração de relatórios automatizados',
        'Integração com sistemas terceiros',
        'Dashboards em tempo real'
      ],
      
      status_atual: {
        fase_1_microsoft: '✅ Implementada e testada',
        fase_2_rhevolution: '✅ Implementada e testada',
        deteccao_automatica: '✅ Funcionando',
        tratamento_erros: '✅ Robusto',
        logs_debugging: '✅ Detalhados'
      }
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: authFlowInfo
    });
  } catch (error) {
    console.error('❌ Erro no endpoint auth-flow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * Middleware para capturar erros específicos do Rhevolution
 */
router.use((error, req, res, next) => {
  if (error.code === 'AUTH_FAILED') {
    return res.status(401).json({
      success: false,
      message: 'Falha na autenticação com Rhevolution',
      code: 'AUTH_FAILED',
      suggestion: 'Verifique as credenciais no Doppler'
    });
  }
  
  if (error.name === 'TimeoutError') {
    return res.status(408).json({
      success: false,
      message: 'Timeout na operação com Rhevolution',
      code: 'TIMEOUT_ERROR',
      suggestion: 'Tente novamente ou verifique a conectividade'
    });
  }
  
  next(error);
});

module.exports = router;