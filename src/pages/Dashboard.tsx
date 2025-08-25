import React, { useState, useEffect } from 'react';
import {
  Activity,
  Bot,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Settings,
  MoreVertical,
  RefreshCw,
  BarChart3,
  Plus,
  FileText
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  MetricsCard,
  AutomationMetrics,
  PerformanceMetrics
} from '../components/automation/MetricsCard';
import { AutomationCard } from '../components/automation/AutomationCard';
import { StatusIndicator } from '../components/automation/StatusIndicator';
import { cn } from '../utils/cn';

// Mock data - em uma aplicação real, isso viria de uma API
const mockDashboardData = {
  metrics: {
    totalAutomations: 24,
    runningAutomations: 8,
    successRate: 94.2,
    avgExecutionTime: 2.3,
    totalExecutions: 1247,
    errorRate: 5.8
  },
  recentAutomations: [
    {
      id: '1',
      name: 'Backup Diário',
      description: 'Backup automático dos dados do sistema',
      status: 'running' as const,
      type: 'scheduled' as const,
      lastRun: new Date(Date.now() - 30 * 60 * 1000),
      nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000),
      successRate: 98.5,
      executionCount: 156,
      duration: 45,
      tags: ['backup', 'sistema']
    },
    {
      id: '2',
      name: 'Sincronização RH',
      description: 'Sincroniza dados entre sistemas de RH',
      status: 'paused' as const,
      type: 'api' as const,
      lastRun: new Date(Date.now() - 15 * 60 * 1000),
      nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000),
      successRate: 92.1,
      executionCount: 89,
      duration: 12,
      tags: ['rh', 'sincronização']
    },
    {
      id: '3',
      name: 'Relatório Mensal',
      description: 'Geração automática de relatórios mensais',
      status: 'error' as const,
      type: 'workflow' as const,
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
      successRate: 87.3,
      executionCount: 23,
      duration: 180,
      tags: ['relatório', 'mensal']
    },
    {
      id: '4',
      name: 'Limpeza Automática',
      description: 'Limpeza automática de arquivos temporários',
      status: 'scheduled' as const,
      type: 'scheduled' as const,
      lastRun: new Date(Date.now() - 12 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000),
      successRate: 95.8,
      executionCount: 67,
      duration: 25,
      tags: ['limpeza', 'manutenção']
    },
    {
      id: '5',
      name: 'Monitoramento',
      description: 'Monitoramento contínuo do sistema',
      status: 'stopped' as const,
      type: 'api' as const,
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 1 * 60 * 60 * 1000),
      successRate: 89.2,
      executionCount: 134,
      duration: 8,
      tags: ['monitoramento', 'sistema']
    }
  ],
  systemHealth: {
    cpu: 45,
    memory: 67,
    disk: 23,
    network: 'connected' as const
  },
  alerts: [
    {
      id: '1',
      type: 'warning' as const,
      title: 'Alto uso de memória',
      description: 'O sistema está usando 67% da memória disponível'
    },
    {
      id: '2',
      type: 'error' as const,
      title: 'Falha na automação',
      description: 'A automação "Relatório Mensal" falhou na última execução'
    }
  ]
};

const QuickActions: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ações Rápidas</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="sm" className="justify-start">
            <Play className="h-4 w-4 mr-2" />
            Nova Automação
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <Activity className="h-4 w-4 mr-2" />
            Monitorar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SystemHealth: React.FC<{ health: typeof mockDashboardData.systemHealth }> = ({ health }) => {
  const getHealthColor = (value: number) => {
    if (value < 50) return 'bg-success-500';
    if (value < 80) return 'bg-warning-500';
    return 'bg-error-500';
  };

  const getHealthVariant = (value: number) => {
    if (value < 50) return 'success';
    if (value < 80) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Saúde do Sistema</h3>
          <StatusIndicator
            status={health.network === 'connected' ? 'connected' : 'disconnected'}
            label={health.network === 'connected' ? 'Online' : 'Offline'}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* CPU */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CPU</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn('h-2 rounded-full transition-all', getHealthColor(health.cpu))}
                  style={{ width: `${health.cpu}%` }}
                />
              </div>
              <Badge variant={getHealthVariant(health.cpu)} size="sm">
                {health.cpu}%
              </Badge>
            </div>
          </div>

          {/* Memory */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Memória</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className={cn('h-2 rounded-full transition-all', getHealthColor(health.memory))}
                  style={{ width: `${health.memory}%` }}
                />
              </div>
              <Badge variant={getHealthVariant(health.memory)} size="sm">
                {health.memory}%
              </Badge>
            </div>
          </div>

          {/* Disk */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Disco</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className={cn('h-2 rounded-full transition-all', getHealthColor(health.disk))}
                  style={{ width: `${health.disk}%` }}
                />
              </div>
              <Badge variant={getHealthVariant(health.disk)} size="sm">
                {health.disk}%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RecentActivity: React.FC<{ automations: typeof mockDashboardData.recentAutomations }> = ({ automations }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Atividade Recente</h3>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {automations.map((automation) => (
            <div key={automation.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <StatusIndicator
                  status={automation.status}
                  size="sm"
                />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {automation.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {automation.lastRun.toLocaleTimeString()}
                </p>
              </div>
              <Badge
                  variant={automation.status === 'running' ? 'info' : 
                          automation.status === 'error' ? 'error' : 'secondary'}
                  size="sm"
                >
                  {automation.status === 'running' && 'Executando'}
                  {automation.status === 'paused' && 'Pausado'}
                  {automation.status === 'error' && 'Erro'}
                  {automation.status === 'scheduled' && 'Agendado'}
                  {automation.status === 'stopped' && 'Parado'}
                </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const [data, setData] = useState(mockDashboardData);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Visão geral do sistema de automação</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Automações Ativas"
          value="12"
          subtitle="+2 esta semana"
          trend="up"
          icon={<Bot className="h-5 w-5" />}
          variant="success"
        />
        <MetricsCard
          title="Taxa de Sucesso"
          value="94.2%"
          subtitle="+1.2% vs mês anterior"
          trend="up"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="info"
        />
        <MetricsCard
          title="Execuções Hoje"
          value="156"
          subtitle="23 em andamento"
          icon={<Activity className="h-5 w-5" />}
        />
        <MetricsCard
          title="Tempo Médio"
          value="2.4min"
          subtitle="-0.3min vs ontem"
          trend="down"
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Execuções por Hora</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <BarChart3 className="h-8 w-8 mr-2" />
              Gráfico de execuções (implementar com recharts)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status das Automações</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Executando</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">8</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Agendado</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">4</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Pausado</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">2</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Erro</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">1</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Automations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Automações Recentes</h3>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentAutomations.slice(0, 3).map((automation) => (
              <AutomationCard
                key={automation.id}
                {...automation}
                onPlay={() => console.log('Play', automation.id)}
                onPause={() => console.log('Pause', automation.id)}
                onStop={() => console.log('Stop', automation.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Saúde do Sistema</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">CPU</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="w-8 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">45%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Memória</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div className="w-12 h-2 bg-yellow-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">72%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Disco</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div className="w-6 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">38%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Alertas Recentes</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Falha na automação</p>
                  <p className="text-xs text-gray-600">há 2 horas</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Alto uso de memória</p>
                  <p className="text-xs text-gray-600">há 4 horas</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Backup concluído</p>
                  <p className="text-xs text-gray-600">há 6 horas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" size="sm" fullWidth>
                <Plus className="h-4 w-4 mr-2" />
                Nova Automação
              </Button>
              <Button variant="outline" size="sm" fullWidth>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
              <Button variant="outline" size="sm" fullWidth>
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;