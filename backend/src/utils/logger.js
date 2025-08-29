const winston = require('winston');
const path = require('path');

// Configuração de formatos
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Adicionar metadados se existirem
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Configuração de transports
const transports = [
  // Console (sempre ativo em desenvolvimento)
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  })
];

// Adicionar arquivos de log em produção
if (process.env.NODE_ENV === 'production') {
  const logsDir = path.join(process.cwd(), 'logs');
  
  // Log geral
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      format: logFormat,
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  
  // Log de erros
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      format: logFormat,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  
  // Log de automações
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'automations.log'),
      format: logFormat,
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  );
}

// Criar logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  // Não sair do processo em caso de erro
  exitOnError: false
});

// Logger específico para automações
const automationLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({ label: 'AUTOMATION' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, label, ...meta }) => {
          return `${timestamp} [${label}] [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      )
    })
  ]
});

// Logger específico para segurança
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({ label: 'SECURITY' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, label, ...meta }) => {
          return `${timestamp} [${label}] [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      )
    })
  ]
});

// Adicionar arquivo específico para logs de segurança em produção
if (process.env.NODE_ENV === 'production') {
  const logsDir = path.join(process.cwd(), 'logs');
  
  securityLogger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.label({ label: 'SECURITY' }),
        winston.format.json()
      ),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  );
  
  automationLogger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'automations.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.label({ label: 'AUTOMATION' }),
        winston.format.json()
      ),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  );
}

// Função para sanitizar dados sensíveis dos logs
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'credential',
    'auth'
  ];
  
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  });
  
  return sanitized;
};

// Wrapper para logs seguros
const safeLog = (level, message, meta = {}) => {
  const sanitizedMeta = sanitizeLogData(meta);
  logger[level](message, sanitizedMeta);
};

// Métodos de conveniência
const logMethods = {
  info: (message, meta) => safeLog('info', message, meta),
  warn: (message, meta) => safeLog('warn', message, meta),
  error: (message, meta) => safeLog('error', message, meta),
  debug: (message, meta) => safeLog('debug', message, meta),
  
  // Logs específicos
  automation: (message, meta) => {
    const sanitizedMeta = sanitizeLogData(meta);
    automationLogger.info(message, sanitizedMeta);
  },
  
  security: (message, meta) => {
    const sanitizedMeta = sanitizeLogData(meta);
    securityLogger.warn(message, sanitizedMeta);
  },
  
  // Log de auditoria
  audit: (action, userId, details = {}) => {
    const auditData = {
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...sanitizeLogData(details)
    };
    
    securityLogger.info(`AUDIT: ${action}`, auditData);
  }
};

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  // Dar tempo para o log ser escrito antes de sair
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
});

module.exports = {
  ...logMethods,
  logger,
  automationLogger,
  securityLogger,
  sanitizeLogData
};