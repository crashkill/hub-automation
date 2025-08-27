import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AutomationConfig, 
  AutomationExecution, 
  AutomationPlugin,
  AutomationType,
  AutomationStatus,
  AutomationEvent,
  AutomationPriority
} from '../types/automation';
import { automationRegistry } from '../services/AutomationRegistry';
import { automationExecutor } from '../services/AutomationExecutor';

interface UseAutomationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  userId?: string;
}

interface UseAutomationsReturn {
  // Plugins
  plugins: AutomationPlugin[];
  getPlugin: (type: AutomationType) => AutomationPlugin | undefined;
  searchPlugins: (query: string) => AutomationPlugin[];
  getPluginsByCategory: (category: string) => AutomationPlugin[];
  
  // Execuções
  executions: AutomationExecution[];
  executionStats: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    queued: number;
    averageDuration: number;
  };
  
  // Ações
  executeAutomation: (config: AutomationConfig, priority?: AutomationPriority) => Promise<string>;
  stopExecution: (executionId: string) => Promise<void>;
  getExecutionStatus: (executionId: string) => AutomationExecution | undefined;
  
  // Estados
  loading: boolean;
  error: string | null;
  
  // Eventos
  events: AutomationEvent[];
  
  // Utilitários
  refresh: () => void;
  clearError: () => void;
  validateConfig: (config: AutomationConfig) => { valid: boolean; errors: string[] };
}

export const useAutomations = (options: UseAutomationsOptions = {}): UseAutomationsReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 5000,
    userId
  } = options;

  // Estados
  const [plugins, setPlugins] = useState<AutomationPlugin[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenerRef = useRef<((event: AutomationEvent) => void) | null>(null);

  // Carregar plugins disponíveis
  const loadPlugins = useCallback(async () => {
    try {
      setLoading(true);
      const availablePlugins = automationRegistry.list();
      setPlugins(availablePlugins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar plugins');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar execuções
  const loadExecutions = useCallback(async () => {
    try {
      const allExecutions = automationExecutor.listExecutions();
      // Por enquanto, não filtramos por userId até implementarmos o contexto completo
      setExecutions(allExecutions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar execuções');
    }
  }, [userId]);

  // Refresh geral
  const refresh = useCallback(() => {
    loadPlugins();
    loadExecutions();
  }, [loadPlugins, loadExecutions]);

  // Configurar auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(refresh, refreshInterval);
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, refresh]);

  // Configurar listener de eventos
  useEffect(() => {
    eventListenerRef.current = (event: AutomationEvent) => {
      setEvents(prev => [event, ...prev.slice(0, 99)]); // Manter apenas os últimos 100 eventos
      
      // Atualizar execuções quando houver mudanças
      if (['execution_started', 'execution_completed', 'execution_failed', 'execution_stopped'].includes(event.type)) {
        loadExecutions();
      }
    };

    // Aqui você registraria o listener no executor
    // automationExecutor.addEventListener(eventListenerRef.current);

    return () => {
      if (eventListenerRef.current) {
        // automationExecutor.removeEventListener(eventListenerRef.current);
      }
    };
  }, [loadExecutions]);

  // Carregar dados iniciais
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Funções de plugins
  const getPlugin = useCallback((type: AutomationType) => {
    return automationRegistry.get(type);
  }, []);

  const searchPlugins = useCallback((query: string) => {
    return plugins.filter(plugin => 
      plugin.name.toLowerCase().includes(query.toLowerCase()) ||
      plugin.description.toLowerCase().includes(query.toLowerCase()) ||
      plugin.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [plugins]);

  const getPluginsByCategory = useCallback((category: string) => {
    return plugins.filter(plugin => plugin.category === category);
  }, [plugins]);

  // Funções de execução
  const executeAutomation = useCallback(async (config: AutomationConfig, priority: AutomationPriority = 'medium') => {
    try {
      setError(null);
      const executionId = await automationExecutor.execute(config, priority);
      await loadExecutions(); // Recarregar execuções
      return executionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao executar automação';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadExecutions]);

  const stopExecution = useCallback(async (executionId: string) => {
    try {
      setError(null);
      await automationExecutor.stop(executionId);
      await loadExecutions(); // Recarregar execuções
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao parar execução';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadExecutions]);

  const getExecutionStatus = useCallback((executionId: string) => {
    return executions.find(exec => exec.id === executionId);
  }, [executions]);

  // Validação de configuração
  const validateConfig = useCallback((config: AutomationConfig) => {
    const plugin = getPlugin(config.type);
    if (!plugin) {
      return { valid: false, errors: [`Plugin não encontrado para o tipo: ${config.type}`] };
    }

    try {
      const validation = plugin.validateConfig(config);
      return validation;
    } catch (err) {
      return { 
        valid: false, 
        errors: [err instanceof Error ? err.message : 'Erro na validação'] 
      };
    }
  }, [getPlugin]);

  // Estatísticas de execução
  const executionStats = {
    total: executions.length,
    running: executions.filter(e => e.status === 'running').length,
    completed: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'error').length,
    queued: executions.filter(e => e.status === 'scheduled').length,
    averageDuration: executions
      .filter(e => e.completedAt && e.startedAt)
      .reduce((acc, e) => acc + (e.completedAt!.getTime() - e.startedAt.getTime()), 0) / 
      executions.filter(e => e.completedAt && e.startedAt).length || 0
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Plugins
    plugins,
    getPlugin,
    searchPlugins,
    getPluginsByCategory,
    
    // Execuções
    executions,
    executionStats,
    
    // Ações
    executeAutomation,
    stopExecution,
    getExecutionStatus,
    
    // Estados
    loading,
    error,
    
    // Eventos
    events,
    
    // Utilitários
    refresh,
    clearError,
    validateConfig
  };
};