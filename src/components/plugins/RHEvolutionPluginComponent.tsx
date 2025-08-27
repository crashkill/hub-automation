import React from 'react';
import { Users } from 'lucide-react';
import { AutomationPlugin, AutomationStatus } from '../../types/automation';
import { RHEvolutionPlugin } from '../../plugins/rh-evolution/RHEvolutionPlugin';
import { BasePluginComponent } from './BasePluginComponent';

interface RHEvolutionPluginComponentProps {
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



export const RHEvolutionPluginComponent: React.FC<RHEvolutionPluginComponentProps> = ({
  onExecute,
  status = 'idle',
  lastExecution,
  className,
  isExecuting = false
}) => {
  const plugin = new RHEvolutionPlugin();
  
  const features = [
    'Sincronização de funcionários',
    'Geração de relatórios automáticos',
    'Atualização de folha de pagamento',
    'Backup automático de dados',
    'Notificações por email e webhook',
    'Processamento de horas faltantes',
    'Envio automático de e-mails'
  ];



  return (
    <BasePluginComponent
      plugin={plugin}
      onExecute={onExecute}
      status={status}
      lastExecution={lastExecution}
      className={className}
      features={features}
      customIcon={Users}
      isExecuting={isExecuting}
    />
  );
};

export default RHEvolutionPluginComponent;