import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Zap,
  Users,
  Database,
  Mail,
  FileText,
  Shield,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { AutomationPlugin, AutomationStatus } from '../../types/automation';

interface BasePluginComponentProps {
  plugin: AutomationPlugin;
  onExecute?: (plugin: AutomationPlugin) => void;
  status?: AutomationStatus;
  lastExecution?: {
    timestamp: Date;
    success: boolean;
    message?: string;
  };
  className?: string;
  features?: string[];
  customIcon?: React.ComponentType<any>;
  isExecuting?: boolean;
}

export const BasePluginComponent: React.FC<BasePluginComponentProps> = ({
  plugin,
  onExecute,
  status = 'idle',
  lastExecution,
  className,
  features,
  customIcon,
  isExecuting = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPluginIcon = () => {
    // Se um ícone customizado foi fornecido, use-o
    if (customIcon) {
      const CustomIcon = customIcon;
      return <CustomIcon className="w-6 h-6 text-blue-600" />;
    }

    switch (plugin.type) {
      case 'rh-evolution': return <Users className="w-6 h-6 text-blue-600" />;
      case 'email-marketing': return <Mail className="w-6 h-6 text-blue-600" />;
      case 'data-sync': return <Database className="w-6 h-6 text-blue-600" />;
      case 'report-generator': return <FileText className="w-6 h-6 text-blue-600" />;
      case 'backup': return <Shield className="w-6 h-6 text-blue-600" />;
      case 'monitoring': return <Activity className="w-6 h-6 text-blue-600" />;
      default: return <Zap className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'paused':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'bg-blue-50 border-blue-200';
      case 'completed': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'paused': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-white border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running': return 'Executando...';
      case 'completed': return 'Concluído';
      case 'error': return 'Erro';
      case 'paused': return 'Pausado';
      case 'scheduled': return 'Agendado';
      default: return 'Inativo';
    }
  };

  const handleExecute = () => {
    if (onExecute) {
      onExecute(plugin);
    }
  };



  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${getStatusColor()} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getPluginIcon()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{plugin.name}</h3>
                {getStatusIcon()}
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">{plugin.category}</p>
                {status !== 'idle' && (
                  <Badge 
                    variant={status === 'completed' ? 'default' : status === 'error' ? 'error' : 'secondary'}
                    className="text-xs"
                  >
                    {getStatusText()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{plugin.version}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? '−' : '+'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-4">{plugin.description}</p>

        {/* Status da última execução */}
        {lastExecution && (
          <Alert 
            variant={lastExecution.success ? 'success' : 'error'}
            className="mb-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Última execução: {lastExecution.timestamp.toLocaleString('pt-BR')}
              </span>
              {lastExecution.message && (
                <span className="text-xs text-gray-500">
                  {lastExecution.message}
                </span>
              )}
            </div>
          </Alert>
        )}

        {/* Detalhes expandidos */}
        {isExpanded && (
          <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Autor:</span>
                <p className="text-gray-600">{plugin.author}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tipo:</span>
                <p className="text-gray-600">{plugin.type}</p>
              </div>
            </div>
            
            {features && features.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Funcionalidades:</span>
                <ul className="text-gray-600 text-xs mt-1 space-y-1">
                  {features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleExecute}
            disabled={status === 'running' || isExecuting}
            className="flex-1"
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Executando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {status === 'running' ? 'Executando...' : 'Executar'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasePluginComponent;