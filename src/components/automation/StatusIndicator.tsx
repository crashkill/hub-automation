import React from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
  Pause,
  Square,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '../../utils/cn';

export type StatusType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'loading' 
  | 'running' 
  | 'paused' 
  | 'stopped' 
  | 'pending' 
  | 'scheduled' 
  | 'connected' 
  | 'disconnected';

export type StatusSize = 'sm' | 'md' | 'lg' | 'xl';

interface StatusIndicatorProps {
  status: StatusType;
  size?: StatusSize;
  label?: string;
  showIcon?: boolean;
  showPulse?: boolean;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    borderColor: 'border-success-200',
    dotColor: 'bg-success-500',
    label: 'Sucesso'
  },
  error: {
    icon: XCircle,
    color: 'text-error-600',
    bgColor: 'bg-error-100',
    borderColor: 'border-error-200',
    dotColor: 'bg-error-500',
    label: 'Erro'
  },
  warning: {
    icon: AlertCircle,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    borderColor: 'border-warning-200',
    dotColor: 'bg-warning-500',
    label: 'Aviso'
  },
  info: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
    label: 'Informação'
  },
  loading: {
    icon: Loader2,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    borderColor: 'border-primary-200',
    dotColor: 'bg-primary-500',
    label: 'Carregando'
  },
  running: {
    icon: Activity,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    borderColor: 'border-success-200',
    dotColor: 'bg-success-500',
    label: 'Executando'
  },
  paused: {
    icon: Pause,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    borderColor: 'border-warning-200',
    dotColor: 'bg-warning-500',
    label: 'Pausado'
  },
  stopped: {
    icon: Square,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    dotColor: 'bg-gray-500',
    label: 'Parado'
  },
  pending: {
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    dotColor: 'bg-gray-500',
    label: 'Pendente'
  },
  scheduled: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
    label: 'Agendado'
  },
  connected: {
    icon: Wifi,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    borderColor: 'border-success-200',
    dotColor: 'bg-success-500',
    label: 'Conectado'
  },
  disconnected: {
    icon: WifiOff,
    color: 'text-error-600',
    bgColor: 'bg-error-100',
    borderColor: 'border-error-200',
    dotColor: 'bg-error-500',
    label: 'Desconectado'
  }
};

const sizeConfig = {
  sm: {
    container: 'h-6',
    icon: 'h-3 w-3',
    dot: 'h-2 w-2',
    text: 'text-xs'
  },
  md: {
    container: 'h-8',
    icon: 'h-4 w-4',
    dot: 'h-3 w-3',
    text: 'text-sm'
  },
  lg: {
    container: 'h-10',
    icon: 'h-5 w-5',
    dot: 'h-4 w-4',
    text: 'text-base'
  },
  xl: {
    container: 'h-12',
    icon: 'h-6 w-6',
    dot: 'h-5 w-5',
    text: 'text-lg'
  }
};

const shouldPulse = (status: StatusType): boolean => {
  return ['loading', 'running', 'connected'].includes(status);
};

const shouldSpin = (status: StatusType): boolean => {
  return status === 'loading';
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  label,
  showIcon = true,
  showPulse,
  className,
  iconClassName,
  labelClassName
}) => {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;
  
  const displayLabel = label || config.label;
  const shouldShowPulse = showPulse ?? shouldPulse(status);
  const shouldIconSpin = shouldSpin(status);

  return (
    <div className={cn(
      'inline-flex items-center space-x-2',
      sizeStyles.container,
      className
    )}>
      {/* Status Dot */}
      <div className="relative">
        <div className={cn(
          'rounded-full',
          config.dotColor,
          sizeStyles.dot
        )} />
        
        {shouldShowPulse && (
          <div className={cn(
            'absolute inset-0 rounded-full animate-ping',
            config.dotColor,
            'opacity-75'
          )} />
        )}
      </div>

      {/* Icon */}
      {showIcon && (
        <Icon className={cn(
          config.color,
          sizeStyles.icon,
          shouldIconSpin && 'animate-spin',
          iconClassName
        )} />
      )}

      {/* Label */}
      {displayLabel && (
        <span className={cn(
          'font-medium',
          config.color,
          sizeStyles.text,
          labelClassName
        )}>
          {displayLabel}
        </span>
      )}
    </div>
  );
};

// Preset components for common use cases
export const SystemStatus: React.FC<{
  isOnline: boolean;
  size?: StatusSize;
  className?: string;
}> = ({ isOnline, size, className }) => (
  <StatusIndicator
    status={isOnline ? 'connected' : 'disconnected'}
    size={size}
    label={isOnline ? 'Sistema Online' : 'Sistema Offline'}
    className={className}
  />
);

export const AutomationStatus: React.FC<{
  status: 'running' | 'paused' | 'stopped' | 'error';
  size?: StatusSize;
  className?: string;
}> = ({ status, size, className }) => (
  <StatusIndicator
    status={status}
    size={size}
    className={className}
  />
);

export const LoadingStatus: React.FC<{
  label?: string;
  size?: StatusSize;
  className?: string;
}> = ({ label = 'Carregando...', size, className }) => (
  <StatusIndicator
    status="loading"
    label={label}
    size={size}
    className={className}
  />
);

export const HealthStatus: React.FC<{
  isHealthy: boolean;
  size?: StatusSize;
  className?: string;
}> = ({ isHealthy, size, className }) => (
  <StatusIndicator
    status={isHealthy ? 'success' : 'error'}
    size={size}
    label={isHealthy ? 'Saudável' : 'Com problemas'}
    className={className}
  />
);

export default StatusIndicator;