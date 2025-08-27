import React from 'react';
import { Zap } from 'lucide-react';
import { AutomationPlugin, AutomationStatus } from '../../types/automation';
import { BasePluginComponent } from './BasePluginComponent';

interface GenericPluginComponentProps {
  plugin: AutomationPlugin;
  onExecute?: (plugin: AutomationPlugin) => void;
  status?: AutomationStatus;
  lastExecution?: {
    timestamp: Date;
    success: boolean;
    message?: string;
  };
  className?: string;
  isExecuting?: boolean;
}

export const GenericPluginComponent: React.FC<GenericPluginComponentProps> = ({
  plugin,
  onExecute,
  status = 'idle',
  lastExecution,
  className,
  isExecuting = false
}) => {
  // Funcionalidades genéricas baseadas no tipo do plugin
  const getGenericFeatures = (pluginType: string): string[] => {
    switch (pluginType) {
      case 'email-marketing':
        return [
          'Envio de campanhas de email',
          'Segmentação de listas',
          'Relatórios de performance',
          'Templates personalizáveis',
          'Automação de follow-up'
        ];
      case 'data-sync':
        return [
          'Sincronização de dados',
          'Mapeamento de campos',
          'Validação de integridade',
          'Logs de sincronização',
          'Rollback automático'
        ];
      case 'report-generator':
        return [
          'Geração automática de relatórios',
          'Múltiplos formatos de saída',
          'Agendamento de relatórios',
          'Distribuição por email',
          'Dashboards interativos'
        ];
      case 'backup':
        return [
          'Backup automático de dados',
          'Compressão e criptografia',
          'Armazenamento em nuvem',
          'Verificação de integridade',
          'Restauração rápida'
        ];
      case 'monitoring':
        return [
          'Monitoramento em tempo real',
          'Alertas personalizáveis',
          'Métricas de performance',
          'Logs centralizados',
          'Notificações automáticas'
        ];
      default:
        return [
          'Automação personalizada',
          'Configuração flexível',
          'Logs detalhados',
          'Integração com APIs',
          'Execução programada'
        ];
    }
  };

  const features = getGenericFeatures(plugin.type);

  return (
    <BasePluginComponent
      plugin={plugin}
      onExecute={onExecute}
      status={status}
      lastExecution={lastExecution}
      className={className}
      features={features}
      customIcon={Zap}
      isExecuting={isExecuting}
    />
  );
};