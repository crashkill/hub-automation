import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface Automation {
  id: string;
  name: string;
  description: string;
  type: 'web' | 'api' | 'database' | 'file' | 'email';
  status: 'running' | 'stopped' | 'paused' | 'error';
  successRate: number;
  executions: number;
  lastRun: Date;
  schedule?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mockAutomations: Automation[] = [
  {
    id: '1',
    name: 'Backup Diário',
    description: 'Realiza backup automático dos dados do sistema',
    type: 'database',
    status: 'running',
    successRate: 98.5,
    executions: 247,
    lastRun: new Date('2024-01-15T02:00:00'),
    schedule: '0 2 * * *',
    isActive: true,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Relatório Semanal',
    description: 'Gera e envia relatórios semanais por email',
    type: 'email',
    status: 'running',
    successRate: 95.2,
    executions: 52,
    lastRun: new Date('2024-01-14T09:00:00'),
    schedule: '0 9 * * 1',
    isActive: true,
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2024-01-14')
  },
  {
    id: '3',
    name: 'Sincronização API',
    description: 'Sincroniza dados com API externa',
    type: 'api',
    status: 'error',
    successRate: 87.3,
    executions: 1205,
    lastRun: new Date('2024-01-15T14:30:00'),
    schedule: '*/15 * * * *',
    isActive: false,
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date('2024-01-15')
  }
];

export const useAutomations = () => {
  const [automations, setAutomations] = useLocalStorage<Automation[]>('automations', mockAutomations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAutomation = useCallback((automation: Omit<Automation, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const newAutomation: Automation = {
        ...automation,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setAutomations(prev => [...prev, newAutomation]);
      return newAutomation;
    } catch (err) {
      setError('Erro ao criar automação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setAutomations]);

  const updateAutomation = useCallback((id: string, updates: Partial<Automation>) => {
    setLoading(true);
    setError(null);
    
    try {
      setAutomations(prev => 
        prev.map(automation => 
          automation.id === id 
            ? { ...automation, ...updates, updatedAt: new Date() }
            : automation
        )
      );
    } catch (err) {
      setError('Erro ao atualizar automação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setAutomations]);

  const deleteAutomation = useCallback((id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      setAutomations(prev => prev.filter(automation => automation.id !== id));
    } catch (err) {
      setError('Erro ao excluir automação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setAutomations]);

  const toggleAutomation = useCallback((id: string) => {
    updateAutomation(id, { 
      isActive: !automations.find(a => a.id === id)?.isActive 
    });
  }, [automations, updateAutomation]);

  const startAutomation = useCallback((id: string) => {
    updateAutomation(id, { status: 'running', isActive: true });
  }, [updateAutomation]);

  const stopAutomation = useCallback((id: string) => {
    updateAutomation(id, { status: 'stopped', isActive: false });
  }, [updateAutomation]);

  const pauseAutomation = useCallback((id: string) => {
    updateAutomation(id, { status: 'paused' });
  }, [updateAutomation]);

  const getAutomationById = useCallback((id: string) => {
    return automations.find(automation => automation.id === id);
  }, [automations]);

  const getAutomationsByStatus = useCallback((status: Automation['status']) => {
    return automations.filter(automation => automation.status === status);
  }, [automations]);

  const getAutomationsByType = useCallback((type: Automation['type']) => {
    return automations.filter(automation => automation.type === type);
  }, [automations]);

  return {
    automations,
    loading,
    error,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    startAutomation,
    stopAutomation,
    pauseAutomation,
    getAutomationById,
    getAutomationsByStatus,
    getAutomationsByType
  };
};