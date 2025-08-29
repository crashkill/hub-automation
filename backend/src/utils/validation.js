import Joi from 'joi';

/**
 * Schema de validação para variáveis de ambiente
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
  RHEVOLUTION_URL: Joi.string().uri().required(),
  RHEVOLUTION_USERNAME: Joi.string().required(),
  RHEVOLUTION_PASSWORD: Joi.string().required(),
  CACHE_TTL: Joi.number().positive().default(300), // 5 minutos
  PUPPETEER_HEADLESS: Joi.boolean().default(true),
  PUPPETEER_TIMEOUT: Joi.number().positive().default(30000), // 30 segundos
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info')
}).unknown();

/**
 * Valida as variáveis de ambiente necessárias
 */
export const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    console.error('❌ Erro na validação das variáveis de ambiente:');
    console.error(error.details.map(detail => `  - ${detail.message}`).join('\n'));
    console.error('\n💡 Certifique-se de configurar todas as variáveis no Doppler:');
    console.error('  - RHEVOLUTION_URL: URL do sistema Rhevolution');
    console.error('  - RHEVOLUTION_USERNAME: Usuário para login');
    console.error('  - RHEVOLUTION_PASSWORD: Senha para login');
    process.exit(1);
  }

  // Atualizar process.env com valores validados e defaults
  Object.assign(process.env, value);
  
  console.log('✅ Variáveis de ambiente validadas com sucesso');
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 Rhevolution URL: ${process.env.RHEVOLUTION_URL}`);
};

/**
 * Schema para validação de dados de entrada da API
 */
export const schemas = {
  // Validação para login
  login: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).required()
  }),

  // Validação para busca de funcionários
  employeeSearch: Joi.object({
    department: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive', 'all').default('active'),
    limit: Joi.number().min(1).max(1000).default(100),
    offset: Joi.number().min(0).default(0)
  }),

  // Validação para geração de relatórios
  reportGeneration: Joi.object({
    type: Joi.string().valid('payroll', 'attendance', 'benefits', 'performance').required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    format: Joi.string().valid('pdf', 'excel', 'csv').default('pdf'),
    departments: Joi.array().items(Joi.string()).optional()
  })
};

/**
 * Middleware de validação para rotas
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.body = value;
    next();
  };
};