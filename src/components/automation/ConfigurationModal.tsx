import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import {
  AutomationPlugin,
  AutomationConfig,
  AutomationConfigField,
  AutomationConfigGroup,
} from '../../types/automation';
import {
  ChevronDown,
  ChevronRight,
  Info,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Componentes simples para substituir os que não existem
const Label: React.FC<{ htmlFor?: string; className?: string; children: React.ReactNode }> = ({ htmlFor, className, children }) => (
  <label htmlFor={htmlFor} className={cn('block text-sm font-medium text-gray-700', className)}>
    {children}
  </label>
);

const Textarea: React.FC<{
  id?: string;
  value?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  rows?: number;
}> = ({ id, value, placeholder, onChange, className, rows = 3 }) => (
  <textarea
    id={id}
    value={value}
    placeholder={placeholder}
    onChange={onChange}
    rows={rows}
    className={cn(
      'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      className
    )}
  />
);

const Switch: React.FC<{
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}> = ({ id, checked, onCheckedChange }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange?.(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      checked ? 'bg-blue-600' : 'bg-gray-200'
    )}
  >
    <span
      className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1'
      )}
    />
  </button>
);

const Select: React.FC<{
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}> = ({ value, onValueChange, children }) => (
  <select
    value={value}
    onChange={(e) => onValueChange?.(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  >
    {children}
  </select>
);

const SelectItem: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => (
  <option value={value}>{children}</option>
);

const Collapsible: React.FC<{
  open?: boolean;
  onOpenChange?: () => void;
  children: React.ReactNode;
}> = ({ children }) => <div>{children}</div>;

const CollapsibleTrigger: React.FC<{
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ className, onClick, children }) => (
  <button type="button" onClick={onClick} className={className}>
    {children}
  </button>
);

const CollapsibleContent: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => (
  <div className={className}>{children}</div>
);

interface ConfigurationModalProps {
  plugin: AutomationPlugin | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AutomationConfig) => void;
  initialConfig?: Partial<AutomationConfig>;
}

export function ConfigurationModal({
  plugin,
  isOpen,
  onClose,
  onSave,
  initialConfig,
}: ConfigurationModalProps) {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (plugin && isOpen) {
      const defaultConfig = plugin.getDefaultConfig();
      const mergedConfig = {
        ...defaultConfig,
        ...initialConfig,
      };
      setConfig(mergedConfig.parameters || {});
      setErrors({});
      
      // Expandir grupos por padrão
      const schema = plugin.getConfigSchema();
      const defaultExpanded = new Set<string>();
      schema.groups?.forEach(group => {
        if (group.defaultExpanded !== false) {
          defaultExpanded.add(group.id);
        }
      });
      setExpandedGroups(defaultExpanded);
    }
  }, [plugin, isOpen, initialConfig]);

  const handleFieldChange = (fieldKey: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [fieldKey]: value,
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const validateField = (field: AutomationConfigField, value: any): string | null => {
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label} é obrigatório`;
    }

    if (field.validation) {
      const { min, max, pattern, custom } = field.validation;

      if (typeof value === 'string') {
        if (min && value.length < min) {
          return `${field.label} deve ter pelo menos ${min} caracteres`;
        }
        if (max && value.length > max) {
          return `${field.label} deve ter no máximo ${max} caracteres`;
        }
        if (pattern && !new RegExp(pattern).test(value)) {
          return `${field.label} tem formato inválido`;
        }
      }

      if (typeof value === 'number') {
        if (min && value < min) {
          return `${field.label} deve ser pelo menos ${min}`;
        }
        if (max && value > max) {
          return `${field.label} deve ser no máximo ${max}`;
        }
      }

      if (custom) {
        const customError = custom(value);
        if (customError) {
          return customError;
        }
      }
    }

    return null;
  };

  const validateAllFields = (): boolean => {
    if (!plugin) return false;

    const schema = plugin.getConfigSchema();
    const newErrors: Record<string, string> = {};

    schema.fields.forEach(field => {
      const value = config[field.key];
      const error = validateField(field, value);
      if (error) {
        newErrors[field.key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!plugin) return;

    setIsValidating(true);
    const isValid = validateAllFields();

    if (!isValid) {
      setIsValidating(false);
      return;
    }

    try {
      const fullConfig: AutomationConfig = {
        id: initialConfig?.id || `${plugin.type}-${Date.now()}`,
        name: plugin.name,
        description: plugin.description,
        version: plugin.version,
        type: plugin.type,
        enabled: initialConfig?.enabled ?? true,
        parameters: config,
        metadata: {
          author: plugin.author,
          createdAt: initialConfig?.metadata?.createdAt || new Date(),
          updatedAt: new Date(),
          tags: [plugin.category],
          category: plugin.category,
        },
      };

      // Validar com o plugin
      const validation = plugin.validateConfig(fullConfig);
      if (!validation.valid) {
        const fieldErrors: Record<string, string> = {};
        validation.errors.forEach(error => {
          fieldErrors['general'] = error;
        });
        setErrors(fieldErrors);
        setIsValidating(false);
        return;
      }

      onSave(fullConfig);
      onClose();
    } catch (error) {
      setErrors({ general: 'Erro ao salvar configuração' });
    } finally {
      setIsValidating(false);
    }
  };

  const renderField = (field: AutomationConfigField) => {
    const value = config[field.key] ?? field.defaultValue;
    const error = errors[field.key];
    const isDisabled = field.dependsOn && config[field.dependsOn.field] !== field.dependsOn.value;

    if (isDisabled) {
      return null;
    }

    const fieldId = `field-${field.key}`;

    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={fieldId} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.description && (
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {field.description}
              </div>
            </div>
          )}
        </div>

        {field.type === 'text' && (
          <Input
            id={fieldId}
            type="text"
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.type === 'password' && (
          <Input
            id={fieldId}
            type="password"
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.type === 'email' && (
          <Input
            id={fieldId}
            type="email"
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.type === 'url' && (
          <Input
            id={fieldId}
            type="url"
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.type === 'number' && (
          <Input
            id={fieldId}
            type="number"
            value={value || ''}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value) || 0)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.type === 'textarea' && (
          <Textarea
            id={fieldId}
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={error ? 'border-red-500' : ''}
            rows={3}
          />
        )}

        {field.type === 'boolean' && (
          <div className="flex items-center space-x-2">
            <Switch
              id={fieldId}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
            />
            <Label htmlFor={fieldId} className="text-sm text-gray-600">
              {field.description || 'Ativar esta opção'}
            </Label>
          </div>
        )}

        {(field.type === 'select' || field.type === 'multiselect') && field.options && (
          <Select
            value={value || ''}
            onValueChange={(newValue) => handleFieldChange(field.key, newValue)}
          >
            <option value="" disabled>{field.placeholder || 'Selecione uma opção'}</option>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        )}

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    );
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  if (!plugin) return null;

  const schema = plugin.getConfigSchema();
  const hasGroups = schema.groups && schema.groups.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{plugin.icon}</span>
          <div>
            <h3 className="text-lg font-semibold">Configurar {plugin.name}</h3>
            <p className="text-sm text-gray-500">{plugin.description}</p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            v{plugin.version}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Configure os parâmetros para esta automação. Campos marcados com * são obrigatórios.
        </p>
      </ModalHeader>

      <ModalContent className="max-h-[60vh] overflow-y-auto">
        <div className="space-y-6">
          {errors.general && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <div>{errors.general}</div>
            </Alert>
          )}

          {hasGroups ? (
            // Renderizar campos agrupados
            <div className="space-y-4">
              {schema.groups!.map((group) => {
                const groupFields = schema.fields.filter(field => field.group === group.id);
                const isExpanded = expandedGroups.has(group.id);

                return (
                  <Collapsible
                    key={group.id}
                    open={isExpanded}
                    onOpenChange={() => toggleGroup(group.id)}
                  >
                    <CollapsibleTrigger 
                      className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={() => toggleGroup(group.id)}
                    >
                      <div className="text-left">
                        <h4 className="font-medium">{group.label}</h4>
                        {group.description && (
                          <p className="text-sm text-gray-600">{group.description}</p>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </CollapsibleTrigger>
                    {isExpanded && (
                      <CollapsibleContent className="pt-4 space-y-4">
                        {groupFields.map(renderField)}
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                );
              })}

              {/* Campos sem grupo */}
              {schema.fields
                .filter(field => !field.group)
                .map(renderField)
              }
            </div>
          ) : (
            // Renderizar campos sem agrupamento
            <div className="space-y-4">
              {schema.fields.map(renderField)}
            </div>
          )}
        </div>
      </ModalContent>

      <ModalFooter>
        <div className="flex justify-between w-full">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isValidating}
            className="min-w-[120px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {isValidating ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}