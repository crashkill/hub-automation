import { 
  AutomationConfig, 
  AutomationExecution, 
  AutomationContext, 
  AutomationResult,
  AutomationStatus,
  AutomationEvent,
  AutomationPriority
} from '../types/automation';
import { automationRegistry } from './AutomationRegistry';

/**
 * Serviço responsável por executar automações
 * Gerencia o ciclo de vida das execuções e fornece contexto seguro
 */
export class AutomationExecutor {
  private static instance: AutomationExecutor;
  private executions = new Map<string, AutomationExecution>();
  private eventListeners = new Map<string, Array<(event: AutomationEvent) => void>>();
  private executionQueue: Array<{ config: AutomationConfig; priority: AutomationPriority; userId: string }> = [];
  private isProcessingQueue = false;
  private maxConcurrentExecutions = 3;
  private currentExecutions = 0;

  private constructor() {
    this.startQueueProcessor();
  }

  public static getInstance(): AutomationExecutor {
    if (!AutomationExecutor.instance) {
      AutomationExecutor.instance = new AutomationExecutor();
    }
    return AutomationExecutor.instance;
  }

  /**
   * Executa uma automação
   */
  public async execute(
    config: AutomationConfig, 
    userId: string, 
    priority: AutomationPriority = 'medium',
    triggeredBy: 'schedule' | 'manual' | 'api' | 'webhook' = 'manual'
  ): Promise<string> {
    // Validar se o plugin existe
    const plugin = automationRegistry.get(config.type);
    if (!plugin) {
      throw new Error(`Plugin ${config.type} não encontrado`);
    }

    // Validar configuração
    const validation = plugin.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Configuração inválida: ${validation.errors.join(', ')}`);
    }

    // Criar execução
    const executionId = this.generateExecutionId();
    const execution: AutomationExecution = {
      id: executionId,
      automationId: config.id,
      status: 'scheduled',
      startedAt: new Date(),
      triggeredBy,
      priority
    };

    this.executions.set(executionId, execution);

    // Emitir evento de início
    this.emitEvent({
      id: this.generateEventId(),
      type: 'execution.started',
      automationId: config.id,
      executionId,
      timestamp: new Date(),
      data: { priority, triggeredBy },
      userId
    });

    // Adicionar à fila ou executar imediatamente
    if (this.currentExecutions >= this.maxConcurrentExecutions) {
      this.executionQueue.push({ config, priority, userId });
      console.info(`Execução ${executionId} adicionada à fila (${this.executionQueue.length} na fila)`);
    } else {
      this.executeImmediate(config, userId, execution);
    }

    return executionId;
  }

  /**
   * Para uma execução em andamento
   */
  public async stop(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execução ${executionId} não encontrada`);
    }

    if (execution.status !== 'running') {
      throw new Error(`Execução ${executionId} não está em execução`);
    }

    const plugin = automationRegistry.get(execution.automationId as any);
    if (plugin) {
      await plugin.stop(executionId);
    }

    execution.status = 'paused';
    execution.completedAt = new Date();
    execution.duration = Math.round((execution.completedAt.getTime() - execution.startedAt.getTime()) / 1000);

    this.emitEvent({
      id: this.generateEventId(),
      type: 'execution.paused',
      automationId: execution.automationId,
      executionId,
      timestamp: new Date(),
      data: { reason: 'user_requested' },
      userId: 'system' // TODO: Obter userId real
    });
  }

  /**
   * Obtém o status de uma execução
   */
  public getExecutionStatus(executionId: string): AutomationExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Lista todas as execuções
   */
  public listExecutions(filters?: {
    status?: AutomationStatus;
    automationId?: string;
    userId?: string;
    limit?: number;
  }): AutomationExecution[] {
    let executions = Array.from(this.executions.values());

    if (filters) {
      if (filters.status) {
        executions = executions.filter(e => e.status === filters.status);
      }
      if (filters.automationId) {
        executions = executions.filter(e => e.automationId === filters.automationId);
      }
      if (filters.limit) {
        executions = executions.slice(0, filters.limit);
      }
    }

    return executions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * Obtém estatísticas de execução
   */
  public getExecutionStats(): {
    total: number;
    running: number;
    completed: number;
    failed: number;
    queued: number;
    averageDuration: number;
  } {
    const executions = Array.from(this.executions.values());
    const completed = executions.filter(e => e.status === 'completed');
    const failed = executions.filter(e => e.status === 'error');
    const running = executions.filter(e => e.status === 'running');
    
    const totalDuration = completed.reduce((sum, e) => sum + (e.duration || 0), 0);
    const averageDuration = completed.length > 0 ? totalDuration / completed.length : 0;

    return {
      total: executions.length,
      running: running.length,
      completed: completed.length,
      failed: failed.length,
      queued: this.executionQueue.length,
      averageDuration: Math.round(averageDuration)
    };
  }

  /**
   * Limpa execuções antigas
   */
  public cleanupOldExecutions(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let removedCount = 0;
    for (const [id, execution] of this.executions.entries()) {
      if (execution.startedAt < cutoffDate && execution.status !== 'running') {
        this.executions.delete(id);
        removedCount++;
      }
    }

    console.info(`Limpeza concluída: ${removedCount} execuções antigas removidas`);
    return removedCount;
  }

  /**
   * Adiciona listener para eventos de automação
   */
  public addEventListener(eventType: string, listener: (event: AutomationEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove listener de eventos
   */
  public removeEventListener(eventType: string, listener: (event: AutomationEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Executa uma automação imediatamente
   */
  private async executeImmediate(
    config: AutomationConfig, 
    userId: string, 
    execution: AutomationExecution
  ): Promise<void> {
    this.currentExecutions++;
    execution.status = 'running';
    
    try {
      const plugin = automationRegistry.get(config.type)!;
      
      // Criar contexto de execução
      const context = this.createExecutionContext(execution.id, userId);
      
      // Executar automação
      const result = await plugin.execute(config, context);
      
      // Atualizar execução com resultado
      execution.status = result.success ? 'completed' : 'error';
      execution.completedAt = new Date();
      execution.duration = Math.round((execution.completedAt.getTime() - execution.startedAt.getTime()) / 1000);
      execution.result = {
        success: result.success,
        data: result.data,
        error: result.error,
        logs: result.logs || []
      };

      // Emitir evento de conclusão
      this.emitEvent({
        id: this.generateEventId(),
        type: result.success ? 'execution.completed' : 'execution.failed',
        automationId: config.id,
        executionId: execution.id,
        timestamp: new Date(),
        data: { result, duration: execution.duration },
        userId
      });

    } catch (error) {
      execution.status = 'error';
      execution.completedAt = new Date();
      execution.duration = Math.round((execution.completedAt.getTime() - execution.startedAt.getTime()) / 1000);
      execution.result = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        logs: []
      };

      this.emitEvent({
        id: this.generateEventId(),
        type: 'execution.failed',
        automationId: config.id,
        executionId: execution.id,
        timestamp: new Date(),
        data: { error: execution.result.error, duration: execution.duration },
        userId
      });

      console.error(`Erro na execução ${execution.id}:`, error);
    } finally {
      this.currentExecutions--;
    }
  }

  /**
   * Cria contexto de execução seguro
   */
  private createExecutionContext(executionId: string, userId: string): AutomationContext {
    return {
      executionId,
      userId,
      environment: 'development' as 'development' | 'staging' | 'production',
      secrets: this.getSecrets(), // TODO: Integrar com Doppler
      logger: {
        info: (message: string, data?: any) => {
          console.info(`[${executionId}] ${message}`, data);
        },
        warn: (message: string, data?: any) => {
          console.warn(`[${executionId}] ${message}`, data);
        },
        error: (message: string, error?: any) => {
          console.error(`[${executionId}] ${message}`, error);
        },
        debug: (message: string, data?: any) => {
          console.debug(`[${executionId}] ${message}`, data);
        }
      },
      storage: {
        get: async (key: string) => {
          // TODO: Implementar storage persistente
          return localStorage.getItem(`automation_${executionId}_${key}`);
        },
        set: async (key: string, value: any) => {
          // TODO: Implementar storage persistente
          localStorage.setItem(`automation_${executionId}_${key}`, JSON.stringify(value));
        },
        delete: async (key: string) => {
          // TODO: Implementar storage persistente
          localStorage.removeItem(`automation_${executionId}_${key}`);
        }
      }
    };
  }

  /**
   * Obtém secrets do Doppler (placeholder)
   */
  private getSecrets(): Record<string, string> {
    // TODO: Integrar com Doppler
    return {
      // Secrets serão carregados do Doppler
    };
  }

  /**
   * Processa a fila de execuções
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessingQueue && this.executionQueue.length > 0 && this.currentExecutions < this.maxConcurrentExecutions) {
        this.processQueue();
      }
    }, 1000); // Verifica a cada segundo
  }

  /**
   * Processa próximo item da fila
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Ordenar por prioridade
      this.executionQueue.sort((a, b) => {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      const next = this.executionQueue.shift();
      if (next && this.currentExecutions < this.maxConcurrentExecutions) {
        const executionId = this.generateExecutionId();
        const execution: AutomationExecution = {
          id: executionId,
          automationId: next.config.id,
          status: 'running',
          startedAt: new Date(),
          triggeredBy: 'manual', // TODO: Preservar triggeredBy original
          priority: next.priority
        };

        this.executions.set(executionId, execution);
        this.executeImmediate(next.config, next.userId, execution);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Emite evento para listeners
   */
  private emitEvent(event: AutomationEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Erro ao processar evento:', error);
      }
    });

    // Também emitir para listeners globais
    const globalListeners = this.eventListeners.get('*') || [];
    globalListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Erro ao processar evento global:', error);
      }
    });
  }

  /**
   * Gera ID único para execução
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gera ID único para evento
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Exportar instância singleton
export const automationExecutor = AutomationExecutor.getInstance();