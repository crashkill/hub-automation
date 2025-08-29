/**
 * Configurações de ambiente para o Hub Automation
 * Todas as variáveis sensíveis devem ser gerenciadas pelo Doppler
 */

// Validar variáveis obrigatórias
const requiredEnvVars = [
  'RHEVOLUTION_URL',
  'RHEVOLUTION_USERNAME', 
  'RHEVOLUTION_PASSWORD',
  'MICROSOFT_EMAIL',
  'MICROSOFT_PASSWORD',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`❌ Variáveis de ambiente obrigatórias não encontradas: ${missingVars.join(', ')}\n🔧 Configure-as no Doppler e execute com: doppler run -- npm start`);
}

/**
 * Configurações do Rhevolution
 */
const rhevolutionConfig = {
  url: process.env.RHEVOLUTION_URL || 'https://portalrh.globalhitss.com.br/ords/rhportal/rhlgweb.show',
  username: process.env.RHEVOLUTION_USERNAME || 'fabricio.lima',
  password: process.env.RHEVOLUTION_PASSWORD || 'F4br1c10FSW@2025@',
  database: process.env.RHEVOLUTION_DATABASE || 'rh_evolution',
  
  // Configurações de timeout
  timeout: {
    navigation: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000,
    element: parseInt(process.env.PUPPETEER_ELEMENT_TIMEOUT) || 10000,
    request: parseInt(process.env.PUPPETEER_REQUEST_TIMEOUT) || 15000
  },
  
  // Configurações do Puppeteer
  puppeteer: {
    headless: false, // Temporariamente desabilitado para debug
    devtools: process.env.NODE_ENV === 'development',
    slowMo: process.env.NODE_ENV === 'development' ? 100 : 0,
    defaultViewport: {
      width: 1366,
      height: 768
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
};

/**
 * Configurações do servidor
 */
const serverConfig = {
  port: parseInt(process.env.PORT) || 3001,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Configurações de CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  
  // Configurações de rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests por IP
    message: {
      error: 'Muitas requisições. Tente novamente em 15 minutos.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
};

/**
 * Configurações de autenticação
 */
const authConfig = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  
  // Configurações do Microsoft SSO
  microsoft: {
    email: process.env.MICROSOFT_EMAIL || 'fabricio.lima@globalhitss.com.br',
    password: process.env.MICROSOFT_PASSWORD || 'F4br1c10FSW@2025@',
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/auth/microsoft/callback',
    
    // Configurações de bypass 2MFA
    bypassMFA: {
      enabled: process.env.MICROSOFT_BYPASS_MFA === 'true' || true,
      persistentCookies: process.env.MICROSOFT_PERSISTENT_COOKIES === 'true' || true,
      keepMeSignedIn: process.env.MICROSOFT_KEEP_SIGNED_IN === 'true' || true,
      sessionDays: parseInt(process.env.MICROSOFT_SESSION_DAYS) || 30
    }
  }
};

/**
 * Configurações de cache
 */
const cacheConfig = {
  ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutos
  maxKeys: parseInt(process.env.CACHE_MAX_KEYS) || 1000,
  checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600 // 10 minutos
};

/**
 * Configurações de logging
 */
const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? 'json' : 'dev',
  
  // Não logar dados sensíveis
  sanitize: {
    password: true,
    token: true,
    secret: true,
    authorization: true
  }
};

/**
 * Configuração consolidada
 */
const config = {
  rhevolution: rhevolutionConfig,
  server: serverConfig,
  auth: authConfig,
  cache: cacheConfig,
  logging: loggingConfig
};

module.exports = {
  rhevolutionConfig,
  serverConfig,
  authConfig,
  cacheConfig,
  loggingConfig,
  config
};

// Log das configurações (sem dados sensíveis)
console.log('🔧 Configurações carregadas:', {
  rhevolution: {
    url: rhevolutionConfig.url,
    database: rhevolutionConfig.database,
    timeout: rhevolutionConfig.timeout
  },
  server: {
    port: serverConfig.port,
    nodeEnv: serverConfig.nodeEnv,
    cors: serverConfig.cors.origin
  },
  puppeteer: {
    headless: rhevolutionConfig.puppeteer.headless
  }
});