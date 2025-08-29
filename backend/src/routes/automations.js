const express = require('express');
const router = express.Router();
const AutomationService = require('../services/AutomationService');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

// Instância do serviço de automação
const automationService = new AutomationService();

/**
 * @route POST /api/automations/rh-evolution/execute
 * @desc Executa automação RH Evolution
 * @access Private
 */
router.post('/rh-evolution/execute', auth, async (req, res) => {
  try {
    const { credentials, options } = req.body;
    
    // Validar entrada
    if (!credentials || !credentials.username || !credentials.password) {
      return res.status(400).json({
        success: false,
        message: 'Credenciais são obrigatórias (username, password)'
      });
    }
    
    // Executar automação
    const result = await automationService.executeRHEvolutionAutomation(
      credentials,
      options
    );
    
    logger.info('Automação RH Evolution executada', {
      userId: req.user.id,
      executionId: result.executionId
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Automação iniciada com sucesso'
    });
    
  } catch (error) {
    logger.error('Erro ao executar automação RH Evolution', {
      userId: req.user.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/automations/execute
 * @desc Executa automação genérica
 * @access Private
 */
router.post('/execute', auth, async (req, res) => {
  try {
    const config = req.body;
    
    // Validar configuração básica
    if (!config.type) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de automação é obrigatório'
      });
    }
    
    const result = await automationService.executeAutomation(config);
    
    logger.info('Automação executada', {
      userId: req.user.id,
      type: config.type,
      executionId: result.executionId
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Automação iniciada com sucesso'
    });
    
  } catch (error) {
    logger.error('Erro ao executar automação', {
      userId: req.user.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/automations/running
 * @desc Lista automações em execução
 * @access Private
 */
router.get('/running', auth, async (req, res) => {
  try {
    const runningAutomations = automationService.getRunningAutomations();
    
    res.json({
      success: true,
      data: runningAutomations,
      count: runningAutomations.length
    });
    
  } catch (error) {
    logger.error('Erro ao listar automações em execução', {
      userId: req.user.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route DELETE /api/automations/:executionId/cancel
 * @desc Cancela automação em execução
 * @access Private
 */
router.delete('/:executionId/cancel', auth, async (req, res) => {
  try {
    const { executionId } = req.params;
    
    await automationService.cancelAutomation(executionId);
    
    logger.info('Automação cancelada', {
      userId: req.user.id,
      executionId
    });
    
    res.json({
      success: true,
      message: 'Automação cancelada com sucesso'
    });
    
  } catch (error) {
    logger.error('Erro ao cancelar automação', {
      userId: req.user.id,
      executionId: req.params.executionId,
      error: error.message
    });
    
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/automations/types
 * @desc Lista tipos de automação disponíveis
 * @access Private
 */
router.get('/types', auth, async (req, res) => {
  try {
    const types = [
      {
        id: 'rh_evolution',
        name: 'RH Evolution',
        description: 'Automação completa do sistema RH Evolution',
        features: [
          'Login automático',
          'Extração de banco de horas',
          'Geração de relatórios',
          'Análise de créditos/débitos',
          'Envio por email'
        ],
        requiredCredentials: ['username', 'password'],
        optionalFields: [
          'extractBankHours',
          'generateReports',
          'sendEmail'
        ]
      },
      {
        id: 'outlook',
        name: 'Outlook Automation',
        description: 'Automação de envio de emails via Outlook',
        features: [
          'Login automático no Outlook',
          'Envio de emails personalizados',
          'Anexo de relatórios'
        ],
        requiredCredentials: ['email', 'password'],
        optionalFields: [
          'recipients',
          'subject',
          'attachments'
        ]
      }
    ];
    
    res.json({
      success: true,
      data: types
    });
    
  } catch (error) {
    logger.error('Erro ao listar tipos de automação', {
      userId: req.user.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/automations/health
 * @desc Verifica saúde do serviço de automação
 * @access Private
 */
router.get('/health', auth, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      runningAutomations: automationService.getRunningAutomations().length,
      pythonPath: automationService.pythonPath,
      scriptsPath: automationService.scriptsPath
    };
    
    res.json({
      success: true,
      data: health
    });
    
  } catch (error) {
    logger.error('Erro ao verificar saúde do serviço', {
      userId: req.user.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Serviço indisponível'
    });
  }
});

// WebSocket para progresso em tempo real
const setupWebSocket = (io) => {
  // Escutar eventos de progresso do serviço
  automationService.on('progress', (data) => {
    // Emitir progresso para clientes conectados
    io.emit('automation:progress', data);
  });
  
  io.on('connection', (socket) => {
    logger.info('Cliente conectado ao WebSocket de automações', {
      socketId: socket.id
    });
    
    // Enviar status inicial
    socket.emit('automation:status', {
      running: automationService.getRunningAutomations()
    });
    
    socket.on('disconnect', () => {
      logger.info('Cliente desconectado do WebSocket', {
        socketId: socket.id
      });
    });
  });
};

module.exports = {
  router,
  setupWebSocket
};