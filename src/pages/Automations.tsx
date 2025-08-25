import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  Square,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Bot
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalContent, ModalHeader, ModalFooter } from '../components/ui/Modal';
import { AutomationCard } from '../components/automation/AutomationCard';
import { StatusIndicator } from '../components/automation/StatusIndicator';
import { cn } from '../utils/cn';

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'status' | 'lastRun' | 'successRate' | 'type';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'running' | 'paused' | 'stopped' | 'error' | 'scheduled';
type FilterType = 'all' | 'workflow' | 'script' | 'api' | 'scheduled';

interface AutomationData {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'stopped' | 'error' | 'scheduled';
  type: 'workflow' | 'script' | 'api' | 'scheduled';
  lastRun?: Date;
  nextRun?: Date;
  successRate: number;
  executionCount: number;
  avgDuration: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Mock data
const mockAutomations: AutomationData[] = [
  {
    id: '1',
    name: 'Backup Diário do Sistema',
    description: 'Realiza backup completo dos dados do sistema todos os dias às 2h da manhã',
    status: 'running',
    type: 'scheduled',
    lastRun: new Date(Date.now() - 30 * 60 * 1000),
    nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000),
    successRate: 98.5,
    executionCount: 156,
    avgDuration: 45,
    tags: ['backup', 'sistema', 'crítico'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    name: 'Sincronização RH Evolution',
    description: 'Sincroniza dados de funcionários entre o sistema RH Evolution e o banco principal',
    status: 'scheduled',
    type: 'api',
    lastRun: new Date(Date.now() - 15 * 60 * 1000),
    nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000),
    successRate: 92.1,
    executionCount: 89,
    avgDuration: 12,
    tags: ['rh', 'sincronização', 'api'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: '3',
    name: 'Relatório Mensal de Performance',
    description: 'Gera relatórios mensais de performance e envia por email para gestores',
    status: 'error',
    type: 'workflow',
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
    successRate: 87.3,
    executionCount: 23,
    avgDuration: 180,
    tags: ['relatório', 'mensal', 'email'],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-19')
  },
  {
    id: '4',
    name: 'Limpeza de Logs Antigos',
    description: 'Remove logs do sistema com mais de 30 dias para liberar espaço em disco',
    status: 'paused',
    type: 'script',
    lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    successRate: 100,
    executionCount: 45,
    avgDuration: 8,
    tags: ['limpeza', 'logs', 'manutenção'],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-17')
  },
  {
    id: '5',
    name: 'Monitoramento de Serviços',
    description: 'Monitora a saúde dos serviços críticos e envia alertas em caso de falha',
    status: 'running',
    type: 'workflow',
    lastRun: new Date(Date.now() - 5 * 60 * 1000),
    nextRun: new Date(Date.now() + 10 * 60 * 1000),
    successRate: 95.8,
    executionCount: 2340,
    avgDuration: 3,
    tags: ['monitoramento', 'alertas', 'crítico'],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-21')
  }
];

const FilterPanel: React.FC<{
  statusFilter: FilterStatus;
  typeFilter: FilterType;
  onStatusChange: (status: FilterStatus) => void;
  onTypeChange: (type: FilterType) => void;
  onClear: () => void;
}> = ({ statusFilter, typeFilter, onStatusChange, onTypeChange, onClear }) => {
  const statusOptions: { value: FilterStatus; label: string; count: number }[] = [
    { value: 'all', label: 'Todos', count: mockAutomations.length },
    { value: 'running', label: 'Executando', count: mockAutomations.filter(a => a.status === 'running').length },
    { value: 'scheduled', label: 'Agendado', count: mockAutomations.filter(a => a.status === 'scheduled').length },
    { value: 'paused', label: 'Pausado', count: mockAutomations.filter(a => a.status === 'paused').length },
    { value: 'error', label: 'Erro', count: mockAutomations.filter(a => a.status === 'error').length },
    { value: 'stopped', label: 'Parado', count: mockAutomations.filter(a => a.status === 'stopped').length }
  ];

  const typeOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Todos os Tipos' },
    { value: 'workflow', label: 'Workflow' },
    { value: 'script', label: 'Script' },
    { value: 'api', label: 'API' },
    { value: 'scheduled', label: 'Agendado' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h3>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Status</label>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onStatusChange(option.value)}
                  className={cn(
                    'w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors',
                    statusFilter === option.value
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <span className="text-sm">{option.label}</span>
                  <Badge variant="secondary" size="sm">{option.count}</Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Tipo</label>
            <div className="space-y-2">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onTypeChange(option.value)}
                  className={cn(
                    'w-full flex items-center p-2 rounded-lg text-left transition-colors',
                    typeFilter === option.value
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AutomationListItem: React.FC<{
  automation: AutomationData;
  onAction: (action: string, id: string) => void;
}> = ({ automation, onAction }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <StatusIndicator
               status={automation.status}
               size="md"
             />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {automation.name}
                </h3>
                <Badge variant="secondary" size="sm">
                  {automation.type}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate mb-2">
                {automation.description}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>Taxa: {automation.successRate}%</span>
                <span>Execuções: {automation.executionCount}</span>
                {automation.lastRun && (
                  <span>Última: {automation.lastRun.toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('start', automation.id)}
              disabled={automation.status === 'running'}
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('pause', automation.id)}
              disabled={automation.status !== 'running'}
            >
              <Pause className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('edit', automation.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const Automations: React.FC = () => {
  const [automations, setAutomations] = useState<AutomationData[]>(mockAutomations);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const filteredAndSortedAutomations = useMemo(() => {
    let filtered = automations.filter(automation => {
      const matchesSearch = automation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           automation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           automation.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || automation.status === statusFilter;
      const matchesType = typeFilter === 'all' || automation.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'lastRun' || sortField === 'name') {
        aValue = sortField === 'lastRun' ? (a.lastRun?.getTime() || 0) : a.name.toLowerCase();
        bValue = sortField === 'lastRun' ? (b.lastRun?.getTime() || 0) : b.name.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [automations, searchTerm, statusFilter, typeFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleAction = (action: string, id: string) => {
    console.log(`Action: ${action} on automation: ${id}`);
    
    if (action === 'delete') {
      setSelectedAutomation(id);
      setShowDeleteModal(true);
    }
    
    // Aqui você implementaria as ações reais
  };

  const handleDelete = () => {
    if (selectedAutomation) {
      setAutomations(prev => prev.filter(a => a.id !== selectedAutomation));
      setSelectedAutomation(null);
      setShowDeleteModal(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automações</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gerencie todas as suas automações ({filteredAndSortedAutomations.length} de {automations.length})
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Automação
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4 flex-1">
            <Input
              placeholder="Buscar automações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="max-w-md"
            />
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300')}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('name')}
            >
              {sortField === 'name' && sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 flex-shrink-0">
              <FilterPanel
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                onStatusChange={setStatusFilter}
                onTypeChange={setTypeFilter}
                onClear={clearFilters}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {filteredAndSortedAutomations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2 dark:text-gray-300">Nenhuma automação encontrada</h3>
                    <p className="text-sm dark:text-gray-400">
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                        ? 'Tente ajustar os filtros de busca'
                        : 'Comece criando sua primeira automação'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'
                  : 'space-y-4'
              )}>
                {filteredAndSortedAutomations.map((automation) => (
                  viewMode === 'grid' ? (
                    <AutomationCard
                      key={automation.id}
                      {...automation}
                      onPlay={() => handleAction('start', automation.id)}
                      onPause={() => handleAction('pause', automation.id)}
                      onStop={() => handleAction('stop', automation.id)}
                    />
                  ) : (
                    <AutomationListItem
                      key={automation.id}
                      automation={automation}
                      onAction={handleAction}
                    />
                  )
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <ModalHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar Exclusão</h3>
          </ModalHeader>
          <ModalContent>
            <p className="text-gray-600 dark:text-gray-300">
              Tem certeza que deseja excluir esta automação? Esta ação não pode ser desfeita.
            </p>
          </ModalContent>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </ModalFooter>
        </Modal>
      </div>
  );
};

export default Automations;