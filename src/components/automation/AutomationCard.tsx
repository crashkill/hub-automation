import React from 'react';
import {
  Play,
  Pause,
  Square,
  Settings,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

export type AutomationStatus = 'running' | 'paused' | 'stopped' | 'error' | 'scheduled';
export type AutomationType = 'workflow' | 'script' | 'api' | 'scheduled';

interface AutomationCardProps {
  id: string;
  name: string;
  description?: string;
  status: AutomationStatus;
  type: AutomationType;
  lastRun?: Date;
  nextRun?: Date;
  successRate?: number;
  executionCount?: number;
  duration?: number; // in seconds
  tags?: string[];
  onPlay?: (id: string) => void;
  onPause?: (id: string) => void;
  onStop?: (id: string) => void;
  onSettings?: (id: string) => void;
  onMoreActions?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

const statusConfig = {
  running: {
    color: 'success' as const,
    icon: <Activity className="h-4 w-4" />,
    label: 'Executando'
  },
  paused: {
    color: 'warning' as const,
    icon: <Pause className="h-4 w-4" />,
    label: 'Pausado'
  },
  stopped: {
    color: 'secondary' as const,
    icon: <Square className="h-4 w-4" />,
    label: 'Parado'
  },
  error: {
    color: 'error' as const,
    icon: <XCircle className="h-4 w-4" />,
    label: 'Erro'
  },
  scheduled: {
    color: 'info' as const,
    icon: <Clock className="h-4 w-4" />,
    label: 'Agendado'
  }
};

const typeConfig = {
  workflow: { label: 'Workflow', color: 'default' as const },
  script: { label: 'Script', color: 'secondary' as const },
  api: { label: 'API', color: 'info' as const },
  scheduled: { label: 'Agendado', color: 'warning' as const }
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const AutomationCard: React.FC<AutomationCardProps> = ({
  id,
  name,
  description,
  status,
  type,
  lastRun,
  nextRun,
  successRate,
  executionCount,
  duration,
  tags = [],
  onPlay,
  onPause,
  onStop,
  onSettings,
  onMoreActions,
  onClick,
  className
}) => {
  const statusInfo = statusConfig[status];
  const typeInfo = typeConfig[type];

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.(id);
  };

  const canPlay = status === 'paused' || status === 'stopped';
  const canPause = status === 'running';
  const canStop = status === 'running' || status === 'paused';

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow cursor-pointer',
        status === 'error' && 'border-error-200 bg-error-50',
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
              <Badge variant={statusInfo.color} size="sm">
                {statusInfo.icon}
                <span className="ml-1">{statusInfo.label}</span>
              </Badge>
            </div>
            
            {description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {description}
              </p>
            )}
            
            <div className="flex items-center space-x-2">
              <Badge variant={typeInfo.color} size="sm">
                {typeInfo.label}
              </Badge>
              
              {tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
              
              {tags.length > 2 && (
                <Badge variant="secondary" size="sm">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {canPlay && onPlay && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(id);
                }}
                title="Executar"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            
            {canPause && onPause && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPause(id);
                }}
                title="Pausar"
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}
            
            {canStop && onStop && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onStop(id);
                }}
                title="Parar"
              >
                <Square className="h-4 w-4" />
              </Button>
            )}
            
            {onSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSettings(id);
                }}
                title="Configurações"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            
            {onMoreActions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoreActions(id);
                }}
                title="Mais ações"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {lastRun && (
            <div className="flex items-center space-x-2 text-gray-600">
              <CheckCircle className="h-4 w-4" />
              <div>
                <p className="font-medium">Última execução</p>
                <p className="text-xs">{formatDate(lastRun)}</p>
              </div>
            </div>
          )}
          
          {nextRun && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <div>
                <p className="font-medium">Próxima execução</p>
                <p className="text-xs">{formatDate(nextRun)}</p>
              </div>
            </div>
          )}
          
          {successRate !== undefined && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Activity className="h-4 w-4" />
              <div>
                <p className="font-medium">Taxa de sucesso</p>
                <p className={cn(
                  'text-xs font-medium',
                  successRate >= 90 ? 'text-success-600' :
                  successRate >= 70 ? 'text-warning-600' : 'text-error-600'
                )}>
                  {successRate.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
          
          {executionCount !== undefined && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Activity className="h-4 w-4" />
              <div>
                <p className="font-medium">Execuções</p>
                <p className="text-xs">{executionCount.toLocaleString()}</p>
              </div>
            </div>
          )}
          
          {duration !== undefined && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <div>
                <p className="font-medium">Duração média</p>
                <p className="text-xs">{formatDuration(duration)}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomationCard;