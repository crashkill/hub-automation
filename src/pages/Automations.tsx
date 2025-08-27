import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Filter, 
  Search, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Activity,
  Zap,
  Users,
  Database,
  Mail,
  FileText,
  Shield,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAutomations } from '../hooks/useAutomations';
import { AutomationPlugin, AutomationExecution, AutomationStatus, AutomationPriority, AutomationConfig } from '../types/automation';

import { RHEvolutionPluginComponent } from '../components/plugins/RHEvolutionPluginComponent';
import { GenericPluginComponent } from '../components/plugins/GenericPluginComponent';

type FilterStatus = 'all' | 'idle' | 'running' | 'paused' | 'completed' | 'error' | 'scheduled';

interface ExecutionCardProps {
  execution: AutomationExecution;
  onStop: (executionId: string) => void;
  onView: (executionId: string) => void;
  isStopping?: boolean;
}

const ExecutionCard = ({ execution, onStop, onView, isStopping = false }: ExecutionCardProps) => {
  const getStatusIcon = (status: AutomationStatus) => {
    switch (status) {
      case 'running': return <Activity className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'scheduled': return <Clock className="w-4 h-4 text-purple-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: AutomationStatus): string => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: AutomationPriority): string => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const duration = execution.completedAt && execution.startedAt 
    ? Math.round((execution.completedAt.getTime() - execution.startedAt.getTime()) / 1000)
    : null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getStatusIcon(execution.status)}
          <div>
            <h4 className="font-medium text-gray-900">Execução #{execution.id.slice(0, 8)}</h4>
            <p className="text-sm text-gray-500">
              {execution.startedAt.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(execution.status)}>
            {execution.status}
          </Badge>
          <Badge className={getPriorityColor(execution.priority)}>
            {execution.priority}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Automação: {execution.automationId}</span>
          {duration && (
            <span>{duration}s</span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStop(execution.id)}
            disabled={execution.status !== 'running' || isStopping}
          >
            {isStopping ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Parando...
              </>
            ) : (
              <>
                <Square className="w-4 h-4 mr-2" />
                Parar
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(execution.id)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default function Automations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedExecution, setSelectedExecution] = useState<AutomationExecution | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [executingPlugins, setExecutingPlugins] = useState<Set<string>>(new Set());
  const [stoppingExecutions, setStoppingExecutions] = useState<Set<string>>(new Set());

  const {
    plugins,
    executions,
    executeAutomation,
    stopExecution,
    loading,
    error,
    refresh
  } = useAutomations({ autoRefresh: true });

  // Filtrar plugins por termo de busca
  const filteredPlugins = plugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar execuções por status
  const filteredExecutions = executions.filter(execution => {
    if (statusFilter === 'all') return true;
    return execution.status === statusFilter;
  });

  const handleExecutePlugin = async (plugin: AutomationPlugin) => {
    try {
      setExecutingPlugins(prev => new Set(prev).add(plugin.type));
      toast.info(`Iniciando execução da automação "${plugin.name}"...`);
      
      // Obter configuração padrão do plugin
      const defaultConfig = plugin.getDefaultConfig();
      
      // Buscar credenciais do arquivo .env para RH Evolution
      let finalConfig = { ...defaultConfig };
      
      if (plugin.type === 'rh-evolution') {
        try {
          // Buscar credenciais das variáveis de ambiente
          const serverUrl = import.meta.env.VITE_RH_EVOLUTION_SERVER_URL || '';
          const username = import.meta.env.VITE_RH_EVOLUTION_USERNAME || '';
          const password = import.meta.env.VITE_RH_EVOLUTION_PASSWORD || '';
          
          if (serverUrl && username && password) {
            console.log('🔐 Carregando credenciais do arquivo .env para RH Evolution');
            finalConfig = {
              ...defaultConfig,
              parameters: {
                ...defaultConfig.parameters,
                serverUrl,
                username,
                password
              }
            };
          } else {
            console.warn('⚠️ Credenciais não encontradas no arquivo .env, usando configuração padrão');
            console.warn('Variáveis esperadas: VITE_RH_EVOLUTION_SERVER_URL, VITE_RH_EVOLUTION_USERNAME, VITE_RH_EVOLUTION_PASSWORD');
          }
        } catch (error) {
          console.error('❌ Erro ao buscar credenciais do arquivo .env:', error);
          console.warn('⚠️ Usando configuração padrão devido ao erro');
        }
      }
      
      const config: AutomationConfig = {
           ...finalConfig,
           id: `${plugin.type}-${Date.now()}`,
           name: plugin.name,
           description: plugin.description,
           version: plugin.version,
           type: plugin.type,
           enabled: true,
           parameters: finalConfig.parameters || {},
           metadata: {
             author: plugin.author,
             createdAt: new Date(),
             updatedAt: new Date(),
             tags: [plugin.category],
             category: plugin.category
           }
         };
      
      await executeAutomation(config, 'medium');
      toast.success(`Automação "${plugin.name}" iniciada com sucesso!`);
      refresh();
    } catch (error) {
      console.error('Erro ao executar automação:', error);
      toast.error(`Erro ao executar automação "${plugin.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setExecutingPlugins(prev => {
        const newSet = new Set(prev);
        newSet.delete(plugin.type);
        return newSet;
      });
    }
  };

  const handleStopExecution = async (executionId: string) => {
    try {
      setStoppingExecutions(prev => new Set(prev).add(executionId));
      toast.info('Parando execução...');
      await stopExecution(executionId);
      toast.success('Execução parada com sucesso!');
      refresh();
    } catch (error) {
      console.error('Erro ao parar execução:', error);
      toast.error(`Erro ao parar execução: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setStoppingExecutions(prev => {
        const newSet = new Set(prev);
        newSet.delete(executionId);
        return newSet;
      });
    }
  };

  const handleViewExecution = (executionId: string) => {
    const execution = executions.find(e => e.id === executionId);
    if (execution) {
      setSelectedExecution(execution);
      setShowExecutionModal(true);
    }
  };



  // Função para obter o status atual de um plugin
  const getPluginStatus = (plugin: AutomationPlugin): AutomationStatus => {
    // Verificar se há execuções em andamento para este plugin
    const runningExecution = executions.find(
      execution => execution.automationId === plugin.type && execution.status === 'running'
    );
    
    if (runningExecution) {
      return 'running';
    }
    
    // Verificar a última execução para determinar o status
    const lastExecution = executions
      .filter(execution => execution.automationId === plugin.type)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];
    
    if (lastExecution) {
      return lastExecution.status;
    }
    
    return 'idle';
  };

  // Função para obter a última execução de um plugin
  const getLastExecution = (plugin: AutomationPlugin) => {
    const lastExecution = executions
      .filter(execution => execution.automationId === plugin.type)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];
    
    if (!lastExecution) {
      return undefined;
    }
    
    return {
      timestamp: lastExecution.startedAt,
      success: lastExecution.status === 'completed',
      message: lastExecution.result?.error || 
               (lastExecution.status === 'completed' ? 'Execução concluída com sucesso' : 'Execução finalizada')
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar automações</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={refresh}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automações</h1>
          <p className="text-gray-600">Gerencie e execute suas automações</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar automações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os status</option>
            <option value="idle">Inativo</option>
            <option value="running">Executando</option>
            <option value="paused">Pausado</option>
            <option value="completed">Concluído</option>
            <option value="error">Erro</option>
            <option value="scheduled">Agendado</option>
          </select>
        </div>
      </div>

      {/* Plugins Disponíveis */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plugins Disponíveis</h2>
        {filteredPlugins.length === 0 ? (
          <Card className="p-8 text-center">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum plugin encontrado</h3>
            <p className="text-gray-500">Tente ajustar os filtros de busca.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins.map((plugin) => {
              // Renderizar componente específico baseado no tipo do plugin
              if (plugin.type === 'rh-evolution') {
                return (
                  <RHEvolutionPluginComponent
                    key={plugin.type}
                    onExecute={handleExecutePlugin}
                    status={getPluginStatus(plugin)}
                    lastExecution={getLastExecution(plugin)}
                    isExecuting={executingPlugins.has(plugin.type)}
                  />
                );
              }
              
              // Fallback para o GenericPluginComponent
               return (
                 <GenericPluginComponent
                   key={plugin.type}
                   plugin={plugin}
                   onExecute={handleExecutePlugin}
                   status={getPluginStatus(plugin)}
                   lastExecution={getLastExecution(plugin)}
                   isExecuting={executingPlugins.has(plugin.type)}
                 />
               );
            })}
          </div>
        )}
      </div>

      {/* Execuções Recentes */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Execuções Recentes</h2>
        {filteredExecutions.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma execução encontrada</h3>
            <p className="text-gray-500">Execute uma automação para ver o histórico aqui.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredExecutions.map((execution) => (
              <ExecutionCard
                key={execution.id}
                execution={execution}
                onStop={handleStopExecution}
                onView={handleViewExecution}
                isStopping={stoppingExecutions.has(execution.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Execução */}
      {showExecutionModal && selectedExecution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalhes da Execução</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExecutionModal(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID</label>
                  <p className="text-sm text-gray-900">{selectedExecution.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <Badge className={getStatusColor(selectedExecution.status)}>
                    {selectedExecution.status}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Iniciado em</label>
                  <p className="text-sm text-gray-900">{selectedExecution.startedAt.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                  <Badge className={getPriorityColor(selectedExecution.priority)}>
                    {selectedExecution.priority}
                  </Badge>
                </div>
              </div>
              
              {selectedExecution.result && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resultado</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(selectedExecution.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

// Função auxiliar para cores de status (fora do componente para evitar redeclaração)
function getStatusColor(status: AutomationStatus): string {
  switch (status) {
    case 'running': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'error': return 'bg-red-100 text-red-800';
    case 'paused': return 'bg-yellow-100 text-yellow-800';
    case 'scheduled': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getPriorityColor(priority: AutomationPriority): string {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}