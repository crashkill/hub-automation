const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { router: automationRoutes, setupWebSocket } = require('./routes/automations.js');
const logger = require('./utils/logger.js');
const { config, validateEnv, errorHandler } = require('./config/index.js');

// Importar rotas
const rhevolutionRoutes = require('./routes/rhevolution');
const reportsRoutes = require('./routes/reports');
// const testRoutes = require('./routes/test');
// const msalAuthRoutes = require('./routes/msalAuth');

// Validar variáveis de ambiente
validateEnv();

const app = express();
const PORT = config.port;

// Middleware de segurança
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configurado para o frontend
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware geral
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    automations: {
      pythonPath: config.macroManager.pythonPath,
      scriptsPath: config.macroManager.scriptsPath
    }
  });
});

// Rotas
app.use('/api/automations', automationRoutes);
app.use('/api/rhevolution', rhevolutionRoutes);
app.use('/api/reports', reportsRoutes);
// app.use('/api/test', testRoutes);
// app.use('/auth/microsoft', msalAuthRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Criar servidor HTTP e WebSocket
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST']
  }
});

// Configurar WebSocket para automações
setupWebSocket(io);

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Backend Hub Automation rodando na porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
  console.log(`🔌 WebSocket habilitado para automações em tempo real`);
  console.log(`🐍 Python: ${config.macroManager.pythonPath}`);
  console.log(`📁 Scripts: ${config.macroManager.scriptsPath}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT. Encerrando servidor...');
  process.exit(0);
});

module.exports = app;