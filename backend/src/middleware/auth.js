const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e adiciona o usuário ao request
 */
const auth = (req, res, next) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }
    
    // Verificar formato: "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso inválido'
      });
    }
    
    // Verificar e decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adicionar usuário ao request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };
    
    // Log de acesso
    logger.info('Usuário autenticado', {
      userId: req.user.id,
      email: req.user.email,
      route: req.path,
      method: req.method,
      ip: req.ip
    });
    
    next();
    
  } catch (error) {
    logger.warn('Falha na autenticação', {
      error: error.message,
      route: req.path,
      method: req.method,
      ip: req.ip
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Falha na autenticação'
    });
  }
};

/**
 * Middleware para verificar permissões específicas
 * @param {string|Array} requiredPermissions - Permissão(ões) necessária(s)
 */
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }
      
      const userPermissions = req.user.permissions || [];
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];
      
      // Verificar se usuário tem pelo menos uma das permissões necessárias
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission) || 
        userPermissions.includes('admin') // Admin tem todas as permissões
      );
      
      if (!hasPermission) {
        logger.warn('Acesso negado - permissão insuficiente', {
          userId: req.user.id,
          userPermissions,
          requiredPermissions: permissions,
          route: req.path
        });
        
        return res.status(403).json({
          success: false,
          message: 'Permissão insuficiente para acessar este recurso',
          code: 'INSUFFICIENT_PERMISSION'
        });
      }
      
      next();
      
    } catch (error) {
      logger.error('Erro na verificação de permissões', {
        userId: req.user?.id,
        error: error.message,
        route: req.path
      });
      
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

/**
 * Middleware para verificar roles específicos
 * @param {string|Array} requiredRoles - Role(s) necessário(s)
 */
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }
      
      const userRole = req.user.role;
      const roles = Array.isArray(requiredRoles) 
        ? requiredRoles 
        : [requiredRoles];
      
      if (!roles.includes(userRole)) {
        logger.warn('Acesso negado - role insuficiente', {
          userId: req.user.id,
          userRole,
          requiredRoles: roles,
          route: req.path
        });
        
        return res.status(403).json({
          success: false,
          message: 'Nível de acesso insuficiente',
          code: 'INSUFFICIENT_ROLE'
        });
      }
      
      next();
      
    } catch (error) {
      logger.error('Erro na verificação de role', {
        userId: req.user?.id,
        error: error.message,
        route: req.path
      });
      
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

/**
 * Middleware opcional de autenticação
 * Adiciona usuário ao request se token válido, mas não bloqueia se inválido
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next();
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    if (!token) {
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };
    
    next();
    
  } catch (error) {
    // Em caso de erro, apenas continua sem usuário
    next();
  }
};

module.exports = {
  auth,
  requirePermission,
  requireRole,
  optionalAuth
};