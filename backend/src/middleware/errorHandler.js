/**
 * Middleware de tratamento de erros global
 * Garante respostas consistentes e não exposição de dados sensíveis
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Erro capturado:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: err.details || err.message
    });
  }

  // Erro de timeout do Puppeteer
  if (err.name === 'TimeoutError') {
    return res.status(408).json({
      error: 'Timeout na operação. Tente novamente.',
      code: 'TIMEOUT_ERROR'
    });
  }

  // Erro de autenticação
  if (err.code === 'AUTH_FAILED') {
    return res.status(401).json({
      error: 'Falha na autenticação',
      code: 'AUTH_FAILED'
    });
  }

  // Erro de conexão com Rhevolution
  if (err.code === 'CONNECTION_FAILED') {
    return res.status(503).json({
      error: 'Serviço temporariamente indisponível',
      code: 'SERVICE_UNAVAILABLE'
    });
  }

  // Erro genérico do servidor
  res.status(500).json({
    error: 'Erro interno do servidor',
    code: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack
    })
  });
};

  /**
   * Wrapper para funções async que automaticamente captura erros
   */
  const asyncHandler = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  /**
   * Middleware para capturar erros não tratados
   */
  const notFoundHandler = (req, res) => {
    res.status(404).json({
      error: 'Recurso não encontrado',
      code: 'NOT_FOUND',
      path: req.originalUrl
    });
  };

  module.exports = {
    errorHandler,
    asyncHandler,
    notFoundHandler
  };