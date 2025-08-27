// Tipos base para o sistema de automações plugáveis

export type AutomationStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error' | 'scheduled';
export type AutomationType = 'rh-evolution' | 'email-marketing' | 'data-sync' | 'report-generator' | 'backup' | 'monitoring';
export type AutomationPriority = 'low' | 'medium' | 'high' | 'critical';

// Interface base para configuração de automação
export interface AutomationConfig {
  id: string;
  name: string;
  description: string;
  type: AutomationType;
  version: string;
  enabled: boolean;
  schedule?: {
    type: 'cron' | 'interval' | 'manual';
    expression?: string; // Cron expression ou intervalo em ms
    timezone?: string;
  };
  parameters: Record<string, any>;
  metadata: {
    author: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    category: string;
  };
}

// Interface para execução de automação
export interface AutomationExecution {
  id: string;
  automationId: string;
  status: AutomationStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // em segundos
  result?: {
    success: boolean;
    data?: any;
    error?: string;
    logs: string[];
  };
  triggeredBy: 'schedule' | 'manual' | 'api' | 'webhook';
  priority: AutomationPriority;
}

// Interface para métricas de automação
export interface AutomationMetrics {
  automationId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecution?: Date;
  nextExecution?: Date;
  successRate: number;
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    networkUsage: number;
  };
}

// Interface base para plugin de automação
export interface AutomationPlugin {
  readonly type: AutomationType;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly icon: string; // Nome do ícone Lucide
  readonly category: string;
  
  // Configuração padrão do plugin
  getDefaultConfig(): Partial<AutomationConfig>;
  
  // Validação da configuração
  validateConfig(config: AutomationConfig): { valid: boolean; errors: string[] };
  
  // Execução da automação
  execute(config: AutomationConfig, context: AutomationContext): Promise<AutomationResult>;
  
  // Parar execução
  stop(executionId: string): Promise<void>;
  
  // Obter status atual
  getStatus(executionId: string): Promise<AutomationStatus>;
  
  // Configurações específicas do plugin (UI)
  getConfigSchema(): AutomationConfigSchema;
}

// Contexto de execução
export interface AutomationContext {
  executionId: string;
  userId: string;
  environment: 'development' | 'staging' | 'production';
  secrets: Record<string, string>; // Secrets do Doppler
  logger: {
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
    debug: (message: string, data?: any) => void;
  };
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
}

// Resultado da execução
export interface AutomationResult {
  success: boolean;
  data?: any;
  error?: string;
  logs: string[];
  metrics?: {
    duration: number;
    resourceUsage: {
      cpu: number;
      memory: number;
      network: number;
    };
  };
}

// Schema para configuração do plugin
export interface AutomationConfigSchema {
  fields: AutomationConfigField[];
  groups?: AutomationConfigGroup[];
}

export interface AutomationConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'url' | 'email';
  required: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: any;
  options?: { label: string; value: any }[]; // Para select/multiselect
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | null; // Retorna erro ou null
  };
  group?: string;
  dependsOn?: {
    field: string;
    value: any;
  };
}

export interface AutomationConfigGroup {
  id: string;
  label: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// Eventos do sistema de automação
export interface AutomationEvent {
  id: string;
  type: 'execution.started' | 'execution.completed' | 'execution.failed' | 'execution.paused' | 'config.updated' | 'plugin.installed' | 'plugin.uninstalled';
  automationId: string;
  executionId?: string;
  timestamp: Date;
  data: any;
  userId: string;
}

// Registry de plugins
export interface AutomationRegistry {
  plugins: Map<AutomationType, AutomationPlugin>;
  register(plugin: AutomationPlugin): void;
  unregister(type: AutomationType): void;
  get(type: AutomationType): AutomationPlugin | undefined;
  list(): AutomationPlugin[];
  getByCategory(category: string): AutomationPlugin[];
}