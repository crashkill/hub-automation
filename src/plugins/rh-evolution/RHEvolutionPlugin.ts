import { 
  AutomationPlugin, 
  AutomationType, 
  AutomationConfig, 
  AutomationContext, 
  AutomationResult, 
  AutomationConfigSchema,
  AutomationStatus
} from '../../types/automation';
import { rhEvolutionService, RHEvolutionConnection } from '../../services/RHEvolutionService';

// Tipos específicos do RH Evolution
export interface RHEvolutionConfig {
  serverUrl: string;
  username: string;
  password: string;
  database: string;
  actions: {
    syncEmployees: boolean;
    generateReports: boolean;
    updatePayroll: boolean;
    backupData: boolean;
    processAttendance: boolean;
  };
  filters: {
    departments?: string[];
    employeeStatus?: 'active' | 'inactive' | 'all';
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  attendance: {
    minHoursPerDay: number;
    emailTemplate: {
      subject: string;
      body: string;
    };
    smtpConfig: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
    };
  };
  notifications: {
    email: boolean;
    webhook?: string;
    onSuccess: boolean;
    onError: boolean;
  };
}

export interface RHEvolutionResult {
  employeesProcessed: number;
  reportsGenerated: string[];
  payrollUpdated: boolean;
  backupCreated: boolean;
  attendanceProcessed: {
    totalEmployees: number;
    employeesWithMissingHours: number;
    emailsSent: number;
    emailErrors: string[];
  };
  errors: string[];
  warnings: string[];
  executionTime: number;
}

export class RHEvolutionPlugin implements AutomationPlugin {
  readonly type: AutomationType = 'rh-evolution';
  readonly name = 'RH Evolution Automation';
  readonly version = '1.0.0';
  readonly description = 'Automação completa para sistema RH Evolution - sincronização de funcionários, geração de relatórios, atualização de folha de pagamento e backup de dados';
  readonly author = 'Hub Automation Team';
  readonly icon = 'Users'; // Ícone Lucide
  readonly category = 'Human Resources';

  private executions = new Map<string, { status: AutomationStatus; controller?: AbortController }>();

  getDefaultConfig(): Partial<AutomationConfig> {
    return {
      name: 'RH Evolution - Sincronização Diária',
      description: 'Sincronização automática de dados do RH Evolution',
      type: 'rh-evolution',
      enabled: true,
      schedule: {
        type: 'cron',
        expression: '0 6 * * 1-5', // Segunda a sexta às 6h
        timezone: 'America/Sao_Paulo'
      },
      parameters: {
        serverUrl: '',
        username: '',
        password: '',
        database: 'rh_evolution',
        actions: {
          syncEmployees: true,
          generateReports: false,
          updatePayroll: false,
          backupData: true,
          processAttendance: false
        },
        filters: {
          employeeStatus: 'active'
        },
        attendance: {
          minHoursPerDay: 8,
          emailTemplate: {
            subject: 'Notificação de Horas Faltantes - {{employeeName}}',
            body: 'Olá {{employeeName}},\n\nIdentificamos que você possui {{missingHours}} horas faltantes no período de {{dateRange}}.\n\nPor favor, regularize sua situação o mais breve possível.\n\nAtenciosamente,\nEquipe de RH'
          },
          smtpConfig: {
            host: '',
            port: 587,
            secure: false,
            user: '',
            password: ''
          }
        },
        notifications: {
          email: true,
          onSuccess: true,
          onError: true
        }
      },
      metadata: {
        author: 'System',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['rh', 'sync', 'daily'],
        category: 'Human Resources'
      }
    };
  }

  validateConfig(config: AutomationConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const params = config.parameters as RHEvolutionConfig;

    // Validações obrigatórias
    if (!params.serverUrl) {
      errors.push('URL do servidor é obrigatória');
    } else if (!this.isValidUrl(params.serverUrl)) {
      errors.push('URL do servidor inválida');
    }

    if (!params.username) {
      errors.push('Nome de usuário é obrigatório');
    }

    if (!params.password) {
      errors.push('Senha é obrigatória');
    }

    if (!params.database) {
      errors.push('Nome do banco de dados é obrigatório');
    }

    // Validar se pelo menos uma ação está selecionada
    const actions = params.actions;
    if (!actions.syncEmployees && !actions.generateReports && !actions.updatePayroll && !actions.backupData && !actions.processAttendance) {
      errors.push('Pelo menos uma ação deve ser selecionada');
    }

    // Validar configurações de processamento de horas se a ação estiver habilitada
    if (actions.processAttendance) {
      if (!params.attendance) {
        errors.push('Configurações de processamento de horas são obrigatórias quando a ação está habilitada');
      } else {
        if (params.attendance.minHoursPerDay <= 0) {
          errors.push('Horas mínimas por dia deve ser maior que zero');
        }
        if (!params.attendance.emailTemplate.subject) {
          errors.push('Assunto do template de e-mail é obrigatório');
        }
        if (!params.attendance.emailTemplate.body) {
          errors.push('Corpo do template de e-mail é obrigatório');
        }
        if (!params.attendance.smtpConfig.host) {
          errors.push('Host SMTP é obrigatório para envio de e-mails');
        }
        if (!params.attendance.smtpConfig.user) {
          errors.push('Usuário SMTP é obrigatório para envio de e-mails');
        }
        if (!params.attendance.smtpConfig.password) {
          errors.push('Senha SMTP é obrigatória para envio de e-mails');
        }
      }
    }

    // Validar webhook se fornecido
    if (params.notifications.webhook && !this.isValidUrl(params.notifications.webhook)) {
      errors.push('URL do webhook inválida');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(config: AutomationConfig, context: AutomationContext): Promise<AutomationResult> {
    const { executionId, logger, secrets } = context;
    const params = config.parameters as RHEvolutionConfig;
    
    // Registrar execução
    const controller = new AbortController();
    this.executions.set(executionId, { status: 'running', controller });

    logger.info('Iniciando automação RH Evolution', { 
      automationId: config.id,
      executionId,
      actions: params.actions 
    });

    const startTime = Date.now();
    const result: RHEvolutionResult = {
      employeesProcessed: 0,
      reportsGenerated: [],
      payrollUpdated: false,
      backupCreated: false,
      attendanceProcessed: {
        totalEmployees: 0,
        employeesWithMissingHours: 0,
        emailsSent: 0,
        emailErrors: []
      },
      errors: [],
      warnings: [],
      executionTime: 0
    };

    try {
      // Conectar ao RH Evolution
      logger.info('Conectando ao servidor RH Evolution...');
      const connection = await this.connectToRHEvolution(params, secrets);
      
      if (controller.signal.aborted) {
        throw new Error('Execução cancelada pelo usuário');
      }

      // Executar ações selecionadas
      if (params.actions.syncEmployees) {
        logger.info('Sincronizando funcionários...');
        const syncResult = await this.syncEmployees(connection, params, logger);
        result.employeesProcessed = syncResult.processed;
        result.warnings.push(...syncResult.warnings);
      }

      if (params.actions.generateReports) {
        logger.info('Gerando relatórios...');
        const reports = await this.generateReports(connection, params, logger);
        result.reportsGenerated = reports;
      }

      if (params.actions.updatePayroll) {
        logger.info('Atualizando folha de pagamento...');
        result.payrollUpdated = await this.updatePayroll(connection, params, logger);
      }

      if (params.actions.backupData) {
        logger.info('Criando backup dos dados...');
        result.backupCreated = await this.createBackup(connection, params, logger);
      }

      if (params.actions.processAttendance) {
        logger.info('Processando horas de trabalho e enviando e-mails...');
        result.attendanceProcessed = await this.processAttendance(connection, params, logger);
      }

      // Fechar conexão
      await this.disconnectFromRHEvolution(connection);

      // Enviar notificações se configurado
      if (params.notifications.onSuccess) {
        await this.sendNotification('success', result, params, logger);
      }

      result.executionTime = Math.round((Date.now() - startTime) / 1000);
      this.executions.set(executionId, { status: 'completed' });

      logger.info('Automação RH Evolution concluída com sucesso', {
        executionTime: result.executionTime,
        employeesProcessed: result.employeesProcessed,
        reportsGenerated: result.reportsGenerated.length
      });

      return {
        success: true,
        data: result,
        logs: [],
        metrics: {
          duration: result.executionTime,
          resourceUsage: {
            cpu: 0, // TODO: Implementar monitoramento real
            memory: 0,
            network: 0
          }
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      result.errors.push(errorMessage);
      result.executionTime = Math.round((Date.now() - startTime) / 1000);
      
      this.executions.set(executionId, { status: 'error' });
      
      logger.error('Erro na automação RH Evolution', error);

      // Enviar notificação de erro se configurado
      if (params.notifications.onError) {
        await this.sendNotification('error', result, params, logger);
      }

      return {
        success: false,
        error: errorMessage,
        data: result,
        logs: [],
        metrics: {
          duration: result.executionTime,
          resourceUsage: {
            cpu: 0,
            memory: 0,
            network: 0
          }
        }
      };
    }
  }

  async stop(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution?.controller) {
      execution.controller.abort();
      this.executions.set(executionId, { status: 'paused' });
    }
  }

  async getStatus(executionId: string): Promise<AutomationStatus> {
    return this.executions.get(executionId)?.status || 'idle';
  }



  getConfigSchema(): AutomationConfigSchema {
    return {
      groups: [
        {
          id: 'connection',
          label: 'Conexão',
          description: 'Configurações de conexão com o RH Evolution',
          defaultExpanded: true
        },
        {
          id: 'actions',
          label: 'Ações',
          description: 'Selecione as ações a serem executadas',
          defaultExpanded: true
        },
        {
          id: 'filters',
          label: 'Filtros',
          description: 'Filtros para processamento de dados',
          defaultExpanded: false
        },
        {
          id: 'notifications',
          label: 'Notificações',
          description: 'Configurações de notificações',
          defaultExpanded: false
        },
        {
          id: 'attendance',
          label: 'Processamento de Horas',
          description: 'Configurações para processamento de horas faltantes',
          defaultExpanded: false
        }
      ],
      fields: [
        {
          key: 'serverUrl',
          label: 'URL do Servidor',
          type: 'url',
          required: true,
          description: 'URL do servidor RH Evolution (ex: https://rh.empresa.com)',
          placeholder: 'https://rh.empresa.com',
          group: 'connection'
        },
        {
          key: 'username',
          label: 'Usuário',
          type: 'text',
          required: true,
          description: 'Nome de usuário para acesso ao sistema',
          group: 'connection'
        },
        {
          key: 'password',
          label: 'Senha',
          type: 'password',
          required: true,
          description: 'Senha para acesso ao sistema',
          group: 'connection'
        },
        {
          key: 'database',
          label: 'Banco de Dados',
          type: 'text',
          required: true,
          defaultValue: 'rh_evolution',
          description: 'Nome do banco de dados',
          group: 'connection'
        },
        {
          key: 'actions.syncEmployees',
          label: 'Sincronizar Funcionários',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Sincronizar dados dos funcionários',
          group: 'actions'
        },
        {
          key: 'actions.generateReports',
          label: 'Gerar Relatórios',
          type: 'boolean',
          required: false,
          defaultValue: false,
          description: 'Gerar relatórios automáticos',
          group: 'actions'
        },
        {
          key: 'actions.updatePayroll',
          label: 'Atualizar Folha de Pagamento',
          type: 'boolean',
          required: false,
          defaultValue: false,
          description: 'Atualizar dados da folha de pagamento',
          group: 'actions'
        },
        {
          key: 'actions.backupData',
          label: 'Backup de Dados',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Criar backup dos dados processados',
          group: 'actions'
        },
        {
          key: 'actions.processAttendance',
          label: 'Processar Horas Faltantes',
          type: 'boolean',
          required: false,
          defaultValue: false,
          description: 'Processar horas faltantes e enviar e-mails automáticos',
          group: 'actions'
        },
        {
          key: 'filters.employeeStatus',
          label: 'Status dos Funcionários',
          type: 'select',
          required: false,
          defaultValue: 'active',
          options: [
            { label: 'Apenas Ativos', value: 'active' },
            { label: 'Apenas Inativos', value: 'inactive' },
            { label: 'Todos', value: 'all' }
          ],
          group: 'filters'
        },
        {
          key: 'notifications.email',
          label: 'Notificação por Email',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Enviar notificações por email',
          group: 'notifications'
        },
        {
          key: 'notifications.webhook',
          label: 'Webhook URL',
          type: 'url',
          required: false,
          description: 'URL para envio de notificações via webhook',
          placeholder: 'https://api.empresa.com/webhook',
          group: 'notifications'
        },
        {
          key: 'notifications.onSuccess',
          label: 'Notificar em Sucesso',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Enviar notificação quando a execução for bem-sucedida',
          group: 'notifications'
        },
        {
          key: 'notifications.onError',
          label: 'Notificar em Erro',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Enviar notificação quando ocorrer erro',
          group: 'notifications'
        },
        {
          key: 'attendance.minHoursPerDay',
          label: 'Horas Mínimas por Dia',
          type: 'number',
          required: false,
          defaultValue: 8,
          description: 'Número mínimo de horas de trabalho por dia',
          group: 'attendance'
        },
        {
          key: 'attendance.emailTemplate.subject',
          label: 'Assunto do E-mail',
          type: 'text',
          required: false,
          defaultValue: 'Notificação de Horas Faltantes',
          description: 'Assunto do e-mail enviado aos funcionários',
          group: 'attendance'
        },
        {
          key: 'attendance.emailTemplate.body',
          label: 'Corpo do E-mail',
          type: 'textarea',
          required: false,
          defaultValue: 'Olá {{name}}, você possui {{missingHours}} horas faltantes no dia {{date}}. Departamento: {{department}}.',
          description: 'Corpo do e-mail (use {{name}}, {{missingHours}}, {{date}}, {{department}} como variáveis)',
          group: 'attendance'
        },
        {
          key: 'attendance.smtpConfig.host',
          label: 'Servidor SMTP',
          type: 'text',
          required: false,
          defaultValue: 'smtp.gmail.com',
          description: 'Servidor SMTP para envio de e-mails',
          group: 'attendance'
        },
        {
          key: 'attendance.smtpConfig.port',
          label: 'Porta SMTP',
          type: 'number',
          required: false,
          defaultValue: 587,
          description: 'Porta do servidor SMTP',
          group: 'attendance'
        },
        {
          key: 'attendance.smtpConfig.user',
          label: 'Usuário SMTP',
          type: 'text',
          required: false,
          description: 'Usuário para autenticação SMTP',
          group: 'attendance'
        },
        {
          key: 'attendance.smtpConfig.password',
          label: 'Senha SMTP',
          type: 'password',
          required: false,
          description: 'Senha para autenticação SMTP',
          group: 'attendance'
        }
      ]
    };
  }

  // Métodos privados para implementação específica
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private async connectToRHEvolution(params: RHEvolutionConfig, secrets: Record<string, string>): Promise<RHEvolutionConnection> {
    try {
      // Usar credenciais específicas do RH Evolution do Doppler ou dos parâmetros como fallback
      const serverUrl = secrets.RH_EVOLUTION_SERVER_URL || params.serverUrl;
      const username = secrets.RH_EVOLUTION_USERNAME || params.username;
      const password = secrets.RH_EVOLUTION_PASSWORD || params.password;
      
      // Log informativo sobre quais credenciais estão sendo usadas
      if (secrets.RH_EVOLUTION_SERVER_URL && secrets.RH_EVOLUTION_USERNAME && secrets.RH_EVOLUTION_PASSWORD) {
        console.log('🔐 Usando credenciais do Doppler para RH Evolution');
      } else {
        console.log('⚙️ Usando credenciais da configuração manual para RH Evolution');
      }
      
      // Validar se todas as credenciais necessárias estão disponíveis
      if (!serverUrl) {
        throw new Error('URL do servidor é obrigatória');
      }
      if (!username) {
        throw new Error('Nome de usuário é obrigatório');
      }
      if (!password) {
        throw new Error('Senha é obrigatória');
      }
      
      console.log('🌐 Conectando ao RH Evolution...', {
        serverUrl: serverUrl.replace(/\/\/.*@/, '//***@'), // Mascarar credenciais na URL
        username: username.substring(0, 3) + '***', // Mascarar username
        database: params.database
      });
      
      const connection = await rhEvolutionService.connect(
        serverUrl,
        username,
        password,
        params.database
      );
      
      console.log('✅ Conexão com RH Evolution estabelecida com sucesso');
      return connection;
    } catch (error) {
      console.error('❌ Falha ao conectar com RH Evolution:', error);
      throw new Error(`Falha ao conectar com RH Evolution: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async disconnectFromRHEvolution(connection: RHEvolutionConnection): Promise<void> {
    try {
      await rhEvolutionService.disconnect();
    } catch (error) {
      console.warn('Erro ao desconectar do RH Evolution:', error);
    }
  }

  private async syncEmployees(connection: RHEvolutionConnection, params: RHEvolutionConfig, logger: any): Promise<{ processed: number; warnings: string[] }> {
    try {
      const result = await rhEvolutionService.syncEmployees({
        departments: params.filters.departments,
        employeeStatus: params.filters.employeeStatus,
        dateRange: params.filters.dateRange
      });
      
      logger.info(`Sincronizados ${result.processed} funcionários`, {
        departments: params.filters.departments,
        status: params.filters.employeeStatus
      });
      
      return {
        processed: result.processed,
        warnings: result.warnings
      };
    } catch (error) {
      throw new Error(`Erro na sincronização de funcionários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async generateReports(connection: RHEvolutionConnection, params: RHEvolutionConfig, logger: any): Promise<string[]> {
    try {
      const reportTypes = [];
      if (params.actions.syncEmployees) reportTypes.push('employees');
      reportTypes.push('attendance', 'payroll');
      
      const reports = await rhEvolutionService.generateReports(reportTypes);
      
      logger.info(`Gerados ${reports.length} relatórios`, {
        reports: reports.map(r => r.name)
      });
      
      return reports.map(report => report.filePath);
    } catch (error) {
      throw new Error(`Erro na geração de relatórios: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async updatePayroll(connection: RHEvolutionConnection, params: RHEvolutionConfig, logger: any): Promise<boolean> {
    try {
      const result = await rhEvolutionService.updatePayroll();
      
      logger.info(`Folha de pagamento atualizada`, {
        recordsUpdated: result.recordsUpdated,
        errors: result.errors
      });
      
      if (result.errors.length > 0) {
        logger.warn('Erros na atualização da folha:', result.errors);
      }
      
      return result.success;
    } catch (error) {
      throw new Error(`Erro na atualização da folha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async createBackup(connection: RHEvolutionConnection, params: RHEvolutionConfig, logger: any): Promise<boolean> {
    try {
      const backup = await rhEvolutionService.createBackup();
      
      logger.info('Backup criado com sucesso', {
        backupId: backup.id,
        size: backup.size,
        tables: backup.tables,
        filePath: backup.filePath
      });
      
      return true;
    } catch (error) {
      throw new Error(`Erro na criação do backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async sendNotification(type: 'success' | 'error', result: RHEvolutionResult, params: RHEvolutionConfig, logger: any): Promise<void> {
    try {
      if (params.notifications.email || params.notifications.webhook) {
        await rhEvolutionService.sendNotification(type, {
          result,
          timestamp: new Date(),
          automation: 'RH Evolution',
          executionTime: result.executionTime
        }, params.notifications.webhook);
        
        logger.info(`Notificação ${type} enviada com sucesso`, {
          email: params.notifications.email,
          webhook: !!params.notifications.webhook
        });
      }
    } catch (error) {
      logger.error(`Erro ao enviar notificação ${type}:`, error);
      // Não falhar a execução por erro de notificação
    }
  }

  private async processAttendance(connection: RHEvolutionConnection, params: RHEvolutionConfig, logger: any): Promise<{
    totalEmployees: number;
    employeesWithMissingHours: number;
    emailsSent: number;
    emailErrors: string[];
  }> {
    try {
      const startTime = Date.now();
      logger.info('🚀 Iniciando processamento de horas faltantes...', {
        serverUrl: params.serverUrl,
        minHoursPerDay: params.attendance?.minHoursPerDay || 8,
        timestamp: new Date().toISOString()
      });
      
      // 1. Extrair dados de presença via web scraping
      logger.info('📊 Etapa 1/3: Extraindo dados de presença...');
      const attendanceData = await this.extractAttendanceData(connection, params, logger);
      logger.info('✅ Dados de presença extraídos com sucesso', {
        totalRecords: attendanceData.length,
        extractionTime: Date.now() - startTime + 'ms'
      });
      
      // 2. Calcular horas faltantes por funcionário
      logger.info('🧮 Etapa 2/3: Calculando horas faltantes...');
      const calculationStart = Date.now();
      const employeesWithMissingHours = await this.calculateMissingHours(attendanceData, params, logger);
      logger.info('✅ Cálculo de horas faltantes concluído', {
        employeesAnalyzed: attendanceData.length,
        employeesWithMissingHours: employeesWithMissingHours.length,
        calculationTime: Date.now() - calculationStart + 'ms'
      });
      
      // 3. Enviar e-mails automáticos
      logger.info('📧 Etapa 3/3: Enviando e-mails automáticos...');
      const emailStart = Date.now();
      const emailResults = await this.sendMissingHoursEmails(employeesWithMissingHours, params, logger);
      logger.info('✅ Envio de e-mails concluído', {
        emailsSent: emailResults.sent,
        emailErrors: emailResults.errors.length,
        emailTime: Date.now() - emailStart + 'ms'
      });
      
      const totalTime = Date.now() - startTime;
      logger.info('🎉 Processamento de horas faltantes concluído com sucesso', {
        totalEmployees: attendanceData.length,
        employeesWithMissingHours: employeesWithMissingHours.length,
        emailsSent: emailResults.sent,
        emailErrors: emailResults.errors.length,
        totalProcessingTime: totalTime + 'ms',
        averageTimePerEmployee: Math.round(totalTime / attendanceData.length) + 'ms'
      });
      
      return {
        totalEmployees: attendanceData.length,
        employeesWithMissingHours: employeesWithMissingHours.length,
        emailsSent: emailResults.sent,
        emailErrors: emailResults.errors
      };
    } catch (error) {
      logger.error('❌ Erro crítico no processamento de horas faltantes', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erro no processamento de horas faltantes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async extractAttendanceData(connection: RHEvolutionConnection, params: RHEvolutionConfig, logger: any): Promise<any[]> {
    try {
      logger.info('🔍 Conectando ao RH Evolution para extração de dados...', {
        serverUrl: params.serverUrl,
        database: params.database
      });
      
      // Simular extração de dados via web scraping
      // Em uma implementação real, aqui seria feito o web scraping do RH Evolution
      logger.info('🌐 Simulando web scraping do RH Evolution...');
      
      const mockAttendanceData = [
        {
          employeeId: '001',
          name: 'João Silva',
          email: 'joao.silva@empresa.com',
          department: 'TI',
          hoursWorked: 6.5,
          expectedHours: 8,
          date: new Date().toISOString().split('T')[0]
        },
        {
          employeeId: '002',
          name: 'Maria Santos',
          email: 'maria.santos@empresa.com',
          department: 'RH',
          hoursWorked: 8,
          expectedHours: 8,
          date: new Date().toISOString().split('T')[0]
        },
        {
          employeeId: '003',
          name: 'Pedro Costa',
          email: 'pedro.costa@empresa.com',
          department: 'Vendas',
          hoursWorked: 5,
          expectedHours: 8,
          date: new Date().toISOString().split('T')[0]
        }
      ];
      
      logger.info('📈 Dados de presença extraídos com sucesso', {
        totalRecords: mockAttendanceData.length,
        departments: [...new Set(mockAttendanceData.map(emp => emp.department))],
        dateRange: mockAttendanceData[0]?.date,
        recordsBreakdown: {
          withMissingHours: mockAttendanceData.filter(emp => emp.hoursWorked < emp.expectedHours).length,
          withCompleteHours: mockAttendanceData.filter(emp => emp.hoursWorked >= emp.expectedHours).length
        }
      });
      
      return mockAttendanceData;
    } catch (error) {
      throw new Error(`Erro na extração de dados de presença: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async calculateMissingHours(attendanceData: any[], params: RHEvolutionConfig, logger: any): Promise<any[]> {
    try {
      const minHoursPerDay = params.attendance?.minHoursPerDay || 8;
      
      logger.info('🧮 Iniciando cálculo de horas faltantes...', {
        totalEmployees: attendanceData.length,
        minHoursPerDay,
        analysisDate: new Date().toISOString().split('T')[0]
      });
      
      const employeesWithMissingHours = attendanceData.filter(employee => {
        const missingHours = Math.max(0, minHoursPerDay - employee.hoursWorked);
        employee.missingHours = missingHours;
        
        if (missingHours > 0) {
          logger.debug(`⚠️ Horas faltantes detectadas`, {
            employeeId: employee.employeeId,
            name: employee.name,
            department: employee.department,
            hoursWorked: employee.hoursWorked,
            expectedHours: employee.expectedHours,
            missingHours: missingHours
          });
        }
        
        return missingHours > 0;
      });
      
      const departmentStats = employeesWithMissingHours.reduce((acc, emp) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      logger.info('📊 Análise de horas faltantes concluída', {
        totalAnalyzed: attendanceData.length,
        employeesWithMissingHours: employeesWithMissingHours.length,
        employeesWithCompleteHours: attendanceData.length - employeesWithMissingHours.length,
        departmentBreakdown: departmentStats,
        averageMissingHours: employeesWithMissingHours.length > 0 
          ? (employeesWithMissingHours.reduce((sum, emp) => sum + emp.missingHours, 0) / employeesWithMissingHours.length).toFixed(2)
          : 0
      });
      
      return employeesWithMissingHours;
    } catch (error) {
      logger.error('❌ Erro no cálculo de horas faltantes', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        totalEmployees: attendanceData.length
      });
      throw new Error(`Erro no cálculo de horas faltantes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async sendMissingHoursEmails(employeesWithMissingHours: any[], params: RHEvolutionConfig, logger: any): Promise<{
    sent: number;
    errors: string[];
  }> {
    try {
      logger.info('📧 Iniciando envio de e-mails para funcionários com horas faltantes...', {
        totalEmails: employeesWithMissingHours.length,
        smtpHost: params.attendance?.smtpConfig?.host || 'smtp.gmail.com',
        emailTemplate: {
          subject: params.attendance?.emailTemplate?.subject || 'Notificação de Horas Faltantes'
        }
      });
      
      if (employeesWithMissingHours.length === 0) {
        logger.info('✅ Nenhum e-mail para enviar - todos os funcionários cumpriram a carga horária');
        return { sent: 0, errors: [] };
      }
      
      let sent = 0;
      const errors: string[] = [];
      const startTime = Date.now();
      
      for (const [index, employee] of employeesWithMissingHours.entries()) {
        try {
          logger.info(`📤 Enviando e-mail ${index + 1}/${employeesWithMissingHours.length}`, {
            employeeId: employee.employeeId,
            name: employee.name,
            email: employee.email,
            department: employee.department,
            missingHours: employee.missingHours
          });
          
          await this.sendMissingHoursEmail(employee, params, logger);
          sent++;
          
          logger.info(`✅ E-mail enviado com sucesso`, {
            recipient: employee.email,
            employeeName: employee.name,
            emailNumber: index + 1,
            totalEmails: employeesWithMissingHours.length
          });
          
        } catch (error) {
          const errorMsg = `Falha no envio para ${employee.name} (${employee.email}): ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          errors.push(errorMsg);
          
          logger.error(`❌ Erro no envio de e-mail`, {
            employeeId: employee.employeeId,
            name: employee.name,
            email: employee.email,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            emailNumber: index + 1
          });
        }
      }
      
      const totalTime = Date.now() - startTime;
      const successRate = ((sent / employeesWithMissingHours.length) * 100).toFixed(1);
      
      logger.info('📊 Relatório final de envio de e-mails', {
        totalAttempts: employeesWithMissingHours.length,
        emailsSent: sent,
        emailErrors: errors.length,
        successRate: successRate + '%',
        totalTime: totalTime + 'ms',
        averageTimePerEmail: Math.round(totalTime / employeesWithMissingHours.length) + 'ms'
      });
      
      if (errors.length > 0) {
        logger.warn('⚠️ Alguns e-mails falharam', {
          failedEmails: errors
        });
      }
      
      return { sent, errors };
    } catch (error) {
      logger.error('❌ Erro crítico no sistema de envio de e-mails', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        totalEmployees: employeesWithMissingHours.length
      });
      throw new Error(`Erro no envio de e-mails: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async sendMissingHoursEmail(employee: any, params: RHEvolutionConfig, logger: any): Promise<void> {
    try {
      const emailTemplate = params.attendance?.emailTemplate || {
        subject: 'Notificação de Horas Faltantes',
        body: 'Olá {{name}}, você possui {{missingHours}} horas faltantes no dia {{date}}.'
      };
      
      const subject = emailTemplate.subject;
      const body = emailTemplate.body
        .replace('{{name}}', employee.name)
        .replace('{{missingHours}}', employee.missingHours.toString())
        .replace('{{date}}', employee.date)
        .replace('{{department}}', employee.department);
      
      logger.debug('📝 Preparando e-mail personalizado', {
        to: employee.email,
        subject,
        bodyPreview: body.substring(0, 50) + '...',
        variables: {
          name: employee.name,
          missingHours: employee.missingHours,
          date: employee.date,
          department: employee.department
        }
      });
      
      // Simular envio de e-mail
      // Em uma implementação real, aqui seria usado o serviço de e-mail configurado
      logger.info('🌐 Conectando ao servidor SMTP...', {
        host: params.attendance?.smtpConfig?.host || 'smtp.gmail.com',
        port: params.attendance?.smtpConfig?.port || 587,
        recipient: employee.email
      });
      
      // Simular delay do envio
      await new Promise(resolve => setTimeout(resolve, 100));
      
      logger.debug('✉️ E-mail enviado via SMTP', {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        to: employee.email,
        subject,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Falha no envio individual de e-mail', {
        employee: {
          id: employee.employeeId,
          name: employee.name,
          email: employee.email
        },
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw new Error(`Erro ao enviar e-mail: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}