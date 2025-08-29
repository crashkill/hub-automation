/**
 * Configurações centralizadas da aplicação
 */

// Validar variáveis de ambiente essenciais
const validateEnv = () => {
  const requiredEnvVars = [
    'JWT_SECRET'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Variáveis de ambiente não configuradas: ${missingVars.join(', ')}`);
    console.warn('Algumas funcionalidades podem não funcionar corretamente.');
  }
};

// Configurações da aplicação
const config = {
  // Servidor
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Rate Limiting
  rateLimitWindow: 15 * 60 * 1000, // 15 minutos
  rateLimitMax: 100, // máximo de requests por IP
  
  // Logs
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // MacroManager
  macroManager: {
    pythonPath: process.env.PYTHON_PATH || 'python3',
    scriptsPath: process.env.SCRIPTS_PATH || '/Users/fabriciocardosodelima/Desktop/Projetos React/Hub-Authomation/MacroManager',
    mainScript: 'main.py'
  },
  
  // Credenciais RH Evolution (via Doppler)
  rhEvolution: {
    username: process.env.RHEVOLUTION_USERNAME,
    password: process.env.RHEVOLUTION_PASSWORD,
    baseUrl: process.env.RHEVOLUTION_URL || 'https://rhevolution.com'
  },
  
  // Outlook
  outlook: {
    email: process.env.OUTLOOK_EMAIL,
    password: process.env.OUTLOOK_PASSWORD
  },
  
  // Azure/Microsoft
  azure: {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    tenantId: process.env.AZURE_TENANT_ID
  }
};

// Middleware de tratamento de erros simples
const errorHandler = (err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  
  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: err.details || err.message
    });
  }
  
  // Erro de autenticação
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      success: false,
      message: 'Não autorizado'
    });
  }
  
  // Erro genérico
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
};

module.exports = {
  config,
  validateEnv,
  errorHandler
};