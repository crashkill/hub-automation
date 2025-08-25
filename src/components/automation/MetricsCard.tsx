import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Zap,
  BarChart3,
  PieChart,
  Target,
  Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

export type MetricTrend = 'up' | 'down' | 'neutral';
export type MetricSize = 'sm' | 'md' | 'lg';
export type MetricVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: MetricTrend;
  trendValue?: string | number;
  trendLabel?: string;
  icon?: React.ReactNode;
  variant?: MetricVariant;
  size?: MetricSize;
  showChart?: boolean;
  chartData?: number[];
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const trendConfig = {
  up: {
    icon: TrendingUp,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
    label: 'Aumento'
  },
  down: {
    icon: TrendingDown,
    color: 'text-error-600',
    bgColor: 'bg-error-50',
    label: 'Diminuição'
  },
  neutral: {
    icon: Minus,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    label: 'Estável'
  }
};

const variantConfig = {
  default: {
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600'
  },
  success: {
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600'
  },
  warning: {
    iconBg: 'bg-warning-100',
    iconColor: 'text-warning-600'
  },
  error: {
    iconBg: 'bg-error-100',
    iconColor: 'text-error-600'
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  }
};

const sizeConfig = {
  sm: {
    card: 'p-4',
    icon: 'h-8 w-8',
    iconSize: 'h-4 w-4',
    value: 'text-xl',
    title: 'text-sm',
    subtitle: 'text-xs'
  },
  md: {
    card: 'p-6',
    icon: 'h-10 w-10',
    iconSize: 'h-5 w-5',
    value: 'text-2xl',
    title: 'text-base',
    subtitle: 'text-sm'
  },
  lg: {
    card: 'p-8',
    icon: 'h-12 w-12',
    iconSize: 'h-6 w-6',
    value: 'text-3xl',
    title: 'text-lg',
    subtitle: 'text-base'
  }
};

const formatValue = (value: string | number): string => {
  if (typeof value === 'number') {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  }
  return value;
};

const MiniChart: React.FC<{ data: number[]; variant: MetricVariant }> = ({ data, variant }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const variantColors = {
    default: 'stroke-gray-400',
    success: 'stroke-success-500',
    warning: 'stroke-warning-500',
    error: 'stroke-error-500',
    info: 'stroke-blue-500'
  };

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-8 w-16">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          strokeWidth="2"
          className={variantColors[variant]}
          points={points}
        />
      </svg>
    </div>
  );
};

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  trendLabel,
  icon,
  variant = 'default',
  size = 'md',
  showChart = false,
  chartData = [],
  loading = false,
  onClick,
  className
}) => {
  const variantStyles = variantConfig[variant];
  const sizeStyles = sizeConfig[size];
  const trendInfo = trend ? trendConfig[trend] : null;
  const TrendIcon = trendInfo?.icon;

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardContent className={sizeStyles.card}>
          <div className="flex items-center justify-between mb-4">
            <div className={cn('rounded-lg', sizeStyles.icon, 'bg-gray-200')} />
            {showChart && <div className="h-8 w-16 bg-gray-200 rounded" />}
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className={sizeStyles.card}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className={cn(
                'rounded-lg flex items-center justify-center',
                sizeStyles.icon,
                variantStyles.iconBg
              )}>
                <div className={cn(sizeStyles.iconSize, variantStyles.iconColor)}>
                  {icon}
                </div>
              </div>
            )}
            <h3 className={cn(
              'font-medium text-gray-900',
              sizeStyles.title
            )}>
              {title}
            </h3>
          </div>
          
          {showChart && chartData.length > 0 && (
            <MiniChart data={chartData} variant={variant} />
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          <p className={cn(
            'font-bold text-gray-900',
            sizeStyles.value
          )}>
            {formatValue(value)}
          </p>
        </div>

        {/* Subtitle and Trend */}
        <div className="flex items-center justify-between">
          {subtitle && (
            <p className={cn(
              'text-gray-600',
              sizeStyles.subtitle
            )}>
              {subtitle}
            </p>
          )}
          
          {trendInfo && (
            <div className={cn(
              'flex items-center space-x-1 px-2 py-1 rounded-full',
              trendInfo.bgColor
            )}>
              <TrendIcon className={cn('h-3 w-3', trendInfo.color)} />
              <span className={cn(
                'text-xs font-medium',
                trendInfo.color
              )}>
                {trendValue && `${trendValue} `}
                {trendLabel || trendInfo.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Preset metric cards for common use cases
export const AutomationMetrics: React.FC<{
  totalAutomations: number;
  runningAutomations: number;
  successRate: number;
  className?: string;
}> = ({ totalAutomations, runningAutomations, successRate, className }) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
    <MetricsCard
      title="Total de Automações"
      value={totalAutomations}
      icon={<Bot className="h-5 w-5" />}
      variant="info"
    />
    <MetricsCard
      title="Executando Agora"
      value={runningAutomations}
      icon={<Activity className="h-5 w-5" />}
      variant="success"
      trend="up"
    />
    <MetricsCard
      title="Taxa de Sucesso"
      value={`${successRate}%`}
      icon={<Target className="h-5 w-5" />}
      variant={successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'error'}
    />
  </div>
);

export const PerformanceMetrics: React.FC<{
  avgExecutionTime: number;
  totalExecutions: number;
  errorRate: number;
  className?: string;
}> = ({ avgExecutionTime, totalExecutions, errorRate, className }) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
    <MetricsCard
      title="Tempo Médio"
      value={`${avgExecutionTime}s`}
      icon={<Clock className="h-5 w-5" />}
      variant="default"
    />
    <MetricsCard
      title="Total de Execuções"
      value={totalExecutions}
      icon={<BarChart3 className="h-5 w-5" />}
      variant="info"
      trend="up"
    />
    <MetricsCard
      title="Taxa de Erro"
      value={`${errorRate}%`}
      icon={<XCircle className="h-5 w-5" />}
      variant={errorRate <= 5 ? 'success' : errorRate <= 15 ? 'warning' : 'error'}
      trend={errorRate <= 5 ? 'down' : 'up'}
    />
  </div>
);

export default MetricsCard;