const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const EventEmitter = require('events');
const logger = require('../utils/logger');

class AutomationService extends EventEmitter {
  constructor() {
    super();
    this.runningAutomations = new Map();
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.scriptsPath = path.join(__dirname, '../../automations/python');
  }

  /**
   * Executa automação RH Evolution
   * @param {Object} config - Configurações da automação
   * @param {string} config.type - Tipo de automação (rh_evolution, outlook)
   * @param {Object} config.credentials - Credenciais necessárias
   * @param {Object} config.options - Opções específicas
   * @returns {Promise<string>} ID da execução
   */
  async executeAutomation(config) {
    const executionId = this.generateExecutionId();
    
    try {
      logger.info(`Iniciando automação ${config.type}`, { executionId, config });
      
      // Validar configuração
      this.validateConfig(config);
      
      // Preparar ambiente Python
      await this.preparePythonEnvironment();
      
      // Executar script específico
      const result = await this.runPythonScript(config, executionId);
      
      logger.info(`Automação ${config.type} concluída`, { executionId, result });
      
      return { executionId, status: 'completed', result };
      
    } catch (error) {
      logger.error(`Erro na automação ${config.type}`, { executionId, error: error.message });
      throw error;
    }
  }

  /**
   * Executa automação RH Evolution específica
   */
  async executeRHEvolutionAutomation(credentials, options = {}) {
    const config = {
      type: 'rh_evolution',
      credentials,
      options: {
        extractBankHours: options.extractBankHours || true,
        generateReports: options.generateReports || true,
        sendEmail: options.sendEmail || false,
        ...options
      }
    };
    
    return this.executeAutomation(config);
  }

  /**
   * Executa script Python com configuração específica
   */
  async runPythonScript(config, executionId) {
    return new Promise((resolve, reject) => {
      const scriptPath = this.getScriptPath(config.type);
      const args = this.buildScriptArgs(config);
      
      const pythonProcess = spawn(this.pythonPath, [scriptPath, ...args], {
        cwd: this.scriptsPath,
        env: {
          ...process.env,
          EXECUTION_ID: executionId,
          CONFIG_JSON: JSON.stringify(config)
        }
      });
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        
        // Emitir progresso em tempo real
        this.emit('progress', {
          executionId,
          type: 'stdout',
          data: chunk
        });
      });
      
      pythonProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        
        this.emit('progress', {
          executionId,
          type: 'stderr',
          data: chunk
        });
      });
      
      pythonProcess.on('close', (code) => {
        this.runningAutomations.delete(executionId);
        
        if (code === 0) {
          resolve({
            output,
            exitCode: code,
            executionTime: Date.now()
          });
        } else {
          reject(new Error(`Script falhou com código ${code}: ${errorOutput}`));
        }
      });
      
      pythonProcess.on('error', (error) => {
        this.runningAutomations.delete(executionId);
        reject(error);
      });
      
      // Armazenar processo para possível cancelamento
      this.runningAutomations.set(executionId, {
        process: pythonProcess,
        startTime: Date.now(),
        config
      });
    });
  }

  /**
   * Cancela automação em execução
   */
  async cancelAutomation(executionId) {
    const automation = this.runningAutomations.get(executionId);
    
    if (!automation) {
      throw new Error(`Automação ${executionId} não encontrada`);
    }
    
    automation.process.kill('SIGTERM');
    this.runningAutomations.delete(executionId);
    
    logger.info(`Automação ${executionId} cancelada`);
  }

  /**
   * Lista automações em execução
   */
  getRunningAutomations() {
    const running = [];
    
    for (const [executionId, automation] of this.runningAutomations) {
      running.push({
        executionId,
        type: automation.config.type,
        startTime: automation.startTime,
        duration: Date.now() - automation.startTime
      });
    }
    
    return running;
  }

  /**
   * Valida configuração da automação
   */
  validateConfig(config) {
    if (!config.type) {
      throw new Error('Tipo de automação é obrigatório');
    }
    
    if (!config.credentials) {
      throw new Error('Credenciais são obrigatórias');
    }
    
    // Validações específicas por tipo
    switch (config.type) {
      case 'rh_evolution':
        this.validateRHEvolutionConfig(config);
        break;
      case 'outlook':
        this.validateOutlookConfig(config);
        break;
      default:
        throw new Error(`Tipo de automação não suportado: ${config.type}`);
    }
  }

  validateRHEvolutionConfig(config) {
    const required = ['username', 'password'];
    
    for (const field of required) {
      if (!config.credentials[field]) {
        throw new Error(`Campo obrigatório ausente: ${field}`);
      }
    }
  }

  validateOutlookConfig(config) {
    const required = ['email', 'password'];
    
    for (const field of required) {
      if (!config.credentials[field]) {
        throw new Error(`Campo obrigatório ausente: ${field}`);
      }
    }
  }

  /**
   * Prepara ambiente Python
   */
  async preparePythonEnvironment() {
    try {
      // Verificar se diretório de scripts existe
      await fs.access(this.scriptsPath);
    } catch (error) {
      // Criar diretório se não existir
      await fs.mkdir(this.scriptsPath, { recursive: true });
    }
  }

  /**
   * Obtém caminho do script baseado no tipo
   */
  getScriptPath(type) {
    const scripts = {
      'rh_evolution': 'rh_evolution_automation.py',
      'outlook': 'outlook_automation.py',
      'data_analysis': 'data_analysis.py'
    };
    
    const scriptName = scripts[type];
    if (!scriptName) {
      throw new Error(`Script não encontrado para tipo: ${type}`);
    }
    
    return path.join(this.scriptsPath, scriptName);
  }

  /**
   * Constrói argumentos para o script Python
   */
  buildScriptArgs(config) {
    const args = [];
    
    // Adicionar argumentos baseados na configuração
    if (config.options) {
      for (const [key, value] of Object.entries(config.options)) {
        args.push(`--${key}`, String(value));
      }
    }
    
    return args;
  }

  /**
   * Gera ID único para execução
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = AutomationService;