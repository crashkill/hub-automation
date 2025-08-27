import React, { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Lock,
  Key,
  AlertTriangle,
  Globe,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '../components/ui/Modal';
import { Layout } from '../components/layout';
import { cn } from '../utils/cn';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'integrations' | 'appearance' | 'system';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  avatar?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  automationAlerts: boolean;
  systemUpdates: boolean;
  weeklyReports: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordLastChanged: Date;
  loginHistory: Array<{
    date: Date;
    ip: string;
    location: string;
    device: string;
  }>;
}

interface SystemSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  autoBackup: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

const mockUserProfile: UserProfile = {
  name: 'Fabrício Lima',
  email: 'fabricio.lima@hitss.com',
  phone: '+55 11 99999-9999',
  role: 'Administrador',
  department: 'TI'
};

const mockNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  automationAlerts: true,
  systemUpdates: false,
  weeklyReports: true
};

const mockSecuritySettings: SecuritySettings = {
  twoFactorEnabled: false,
  sessionTimeout: 30,
  passwordLastChanged: new Date('2024-01-15'),
  loginHistory: [
    {
      date: new Date('2024-01-21T09:30:00'),
      ip: '192.168.1.100',
      location: 'São Paulo, SP',
      device: 'Chrome - Windows'
    },
    {
      date: new Date('2024-01-20T14:15:00'),
      ip: '192.168.1.100',
      location: 'São Paulo, SP',
      device: 'Chrome - Windows'
    }
  ]
};

const mockSystemSettings: SystemSettings = {
  theme: 'light',
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  dateFormat: 'DD/MM/YYYY',
  autoBackup: true,
  logLevel: 'info'
};

const SettingsNavigation: React.FC<{
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'profile' as const, label: 'Perfil', icon: User },
    { id: 'notifications' as const, label: 'Notificações', icon: Bell },
    { id: 'security' as const, label: 'Segurança', icon: Shield },
    { id: 'integrations' as const, label: 'Integrações', icon: Database },
    { id: 'appearance' as const, label: 'Aparência', icon: Palette },
    { id: 'system' as const, label: 'Sistema', icon: Globe }
  ];

  return (
    <Card>
      <CardContent className="p-0">
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'w-full flex items-center px-4 py-3 text-left text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="h-5 w-5 mr-3" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
};

const ProfileSettings: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      toast.info('Salvando informações do perfil...');
      console.log('Saving profile:', profile);
      
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Informações do perfil salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar informações do perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    
    try {
      setIsChangingPassword(true);
      toast.info('Alterando senha...');
      console.log('Changing password');
      
      // Simular delay de alteração
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Senha alterada com sucesso!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Informações Pessoais</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome Completo"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              icon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Telefone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              icon={<Phone className="h-4 w-4" />}
            />
            <Input
              label="Cargo"
              value={profile.role}
              onChange={(e) => setProfile({ ...profile, role: e.target.value })}
            />
            <Input
              label="Departamento"
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
            />
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
              <Key className="h-4 w-4 mr-2" />
              Alterar Senha
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
        <ModalHeader>
          <h3 className="text-lg font-semibold text-gray-900">Alterar Senha</h3>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <Input
              label="Senha Atual"
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              icon={
                <button onClick={() => setShowPasswords(!showPasswords)}>
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              iconPosition="right"
            />
            <Input
              label="Nova Senha"
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirmar Nova Senha"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
            {isChangingPassword ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Key className="h-4 w-4 mr-2" />
            )}
            {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>(mockNotificationSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      toast.info('Salvando preferências de notificação...');
      console.log('Saving notification settings:', settings);
      
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success('Preferências de notificação salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências de notificação');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Preferências de Notificação</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(settings).map(([key, value]) => {
            const labels = {
              emailNotifications: 'Notificações por Email',
              pushNotifications: 'Notificações Push',
              automationAlerts: 'Alertas de Automação',
              systemUpdates: 'Atualizações do Sistema',
              weeklyReports: 'Relatórios Semanais'
            };

            return (
              <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {labels[key as keyof typeof labels]}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {key === 'emailNotifications' && 'Receber notificações por email'}
                    {key === 'pushNotifications' && 'Receber notificações push no navegador'}
                    {key === 'automationAlerts' && 'Alertas quando automações falharem'}
                    {key === 'systemUpdates' && 'Notificações sobre atualizações do sistema'}
                    {key === 'weeklyReports' && 'Relatório semanal de atividades'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(key as keyof NotificationSettings)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    value ? 'bg-blue-600' : 'bg-gray-200'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      value ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SecuritySettings: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySettings>(mockSecuritySettings);
  const [isToggling2FA, setIsToggling2FA] = useState(false);

  const handleToggle2FA = async () => {
    try {
      setIsToggling2FA(true);
      const newState = !settings.twoFactorEnabled;
      toast.info(newState ? 'Ativando 2FA...' : 'Desativando 2FA...');
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setSettings(prev => ({ ...prev, twoFactorEnabled: newState }));
      toast.success(newState ? '2FA ativado com sucesso!' : '2FA desativado com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar 2FA:', error);
      toast.error('Erro ao alterar configuração de 2FA');
    } finally {
      setIsToggling2FA(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Autenticação de Dois Fatores</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">2FA</h4>
              <p className="text-sm text-gray-600">
                Adicione uma camada extra de segurança à sua conta
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={settings.twoFactorEnabled ? 'success' : 'warning'}>
                {settings.twoFactorEnabled ? 'Ativado' : 'Desativado'}
              </Badge>
              <Button
                variant={settings.twoFactorEnabled ? 'destructive' : 'secondary'}
                onClick={handleToggle2FA}
                disabled={isToggling2FA}
              >
                {isToggling2FA ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {isToggling2FA 
                  ? (settings.twoFactorEnabled ? 'Desativando...' : 'Ativando...')
                  : (settings.twoFactorEnabled ? 'Desativar' : 'Ativar')
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Configurações de Sessão</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout da Sessão (minutos)
              </label>
              <Input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  sessionTimeout: parseInt(e.target.value) || 30 
                }))}
                className="max-w-xs"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Última alteração de senha: {settings.passwordLastChanged.toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico de Login</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {settings.loginHistory.map((login, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {login.date.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {login.location} • {login.device}
                  </p>
                </div>
                <Badge variant="secondary" size="sm">
                  {login.ip}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  category: 'automation' | 'integration' | 'utility';
  author: string;
  lastUpdated: Date;
}

const mockPlugins: Plugin[] = [
  {
    id: 'rh-evolution',
    name: 'RH Evolution',
    description: 'Automação para sistema RH Evolution com sincronização de funcionários e relatórios',
    version: '1.0.0',
    enabled: true,
    category: 'automation',
    author: 'Hub Automation Team',
    lastUpdated: new Date('2024-01-20')
  },
  {
    id: 'email-notifications',
    name: 'Email Notifications',
    description: 'Sistema de notificações por email para alertas e relatórios',
    version: '1.2.1',
    enabled: true,
    category: 'integration',
    author: 'Hub Automation Team',
    lastUpdated: new Date('2024-01-18')
  },
  {
    id: 'backup-manager',
    name: 'Backup Manager',
    description: 'Gerenciamento automático de backups do sistema',
    version: '0.9.5',
    enabled: false,
    category: 'utility',
    author: 'Community',
    lastUpdated: new Date('2024-01-15')
  }
];

const IntegrationsSettings: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>(mockPlugins);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleTogglePlugin = async (pluginId: string) => {
    try {
      const plugin = plugins.find(p => p.id === pluginId);
      if (!plugin) return;
      
      const newState = !plugin.enabled;
      toast.info(`${newState ? 'Ativando' : 'Desativando'} plugin ${plugin.name}...`);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setPlugins(prev => prev.map(p => 
        p.id === pluginId 
          ? { ...p, enabled: newState }
          : p
      ));
      
      toast.success(`Plugin ${plugin.name} ${newState ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar plugin:', error);
      toast.error('Erro ao alterar status do plugin');
    }
  };

  const filteredPlugins = selectedCategory === 'all' 
    ? plugins 
    : plugins.filter(plugin => plugin.category === selectedCategory);

  const getCategoryBadgeColor = (category: Plugin['category']) => {
    switch (category) {
      case 'automation': return 'bg-blue-100 text-blue-800';
      case 'integration': return 'bg-green-100 text-green-800';
      case 'utility': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Gerenciamento de Plugins</h3>
            <div className="flex space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas as Categorias</option>
                <option value="automation">Automação</option>
                <option value="integration">Integração</option>
                <option value="utility">Utilitários</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPlugins.map((plugin) => (
              <div key={plugin.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{plugin.name}</h4>
                      <Badge 
                        variant="secondary" 
                        className={getCategoryBadgeColor(plugin.category)}
                      >
                        {plugin.category}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        v{plugin.version}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{plugin.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Por: {plugin.author}</span>
                      <span>Atualizado: {plugin.lastUpdated.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={plugin.enabled ? 'success' : 'secondary'}>
                      {plugin.enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <button
                      onClick={() => handleTogglePlugin(plugin.id)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        plugin.enabled ? 'bg-blue-600' : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          plugin.enabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Configurações do Doppler</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="info" title="Integração Ativa">
              O sistema está conectado ao Doppler para gerenciamento seguro de credenciais.
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Projeto Atual</h4>
                <p className="text-sm text-gray-600">hub-automation</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Ambiente</h4>
                <p className="text-sm text-gray-600">development</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AppearanceSettings: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);

  const accentColors = [
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Roxo', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Laranja', value: '#f59e0b' },
    { name: 'Vermelho', value: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Tema</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Modo de Cor
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'auto'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={cn(
                      'p-4 border-2 rounded-lg text-center transition-colors',
                      theme === mode
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="text-sm font-medium capitalize">
                      {mode === 'light' ? 'Claro' : mode === 'dark' ? 'Escuro' : 'Automático'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cor de Destaque
              </label>
              <div className="grid grid-cols-6 gap-3">
                {accentColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setAccentColor(color.value)}
                    className={cn(
                      'w-12 h-12 rounded-lg border-2 transition-all',
                      accentColor === color.value
                        ? 'border-gray-400 scale-110'
                        : 'border-gray-200 hover:scale-105'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanho da Fonte
              </label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="small">Pequena</option>
                <option value="medium">Média</option>
                <option value="large">Grande</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Modo Compacto</h4>
                <p className="text-sm text-gray-600">
                  Reduz o espaçamento entre elementos da interface
                </p>
              </div>
              <button
                onClick={() => setCompactMode(!compactMode)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  compactMode ? 'bg-blue-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    compactMode ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Pré-visualização</h3>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg" style={{ borderColor: accentColor }}>
            <h4 className="font-medium mb-2" style={{ color: accentColor }}>
              Exemplo de Interface
            </h4>
            <p className="text-gray-600 mb-3">
              Esta é uma pré-visualização de como a interface ficará com suas configurações.
            </p>
            <Button style={{ backgroundColor: accentColor }} className="text-white">
              Botão de Exemplo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(mockSystemSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      toast.info('Salvando configurações do sistema...');
      console.log('Saving system settings:', settings);
      
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Configurações do sistema salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações do sistema');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      toast.info('Restaurando configurações padrão...');
      console.log('Resetting system settings');
      
      // Simular delay de reset
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Restaurar configurações padrão
      setSettings(mockSystemSettings);
      setShowResetModal(false);
      
      toast.success('Configurações restauradas para os valores padrão!');
    } catch (error) {
      console.error('Erro ao restaurar configurações:', error);
      toast.error('Erro ao restaurar configurações padrão');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configurações Gerais</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tema
              </label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  theme: e.target.value as 'light' | 'dark' | 'auto' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Idioma
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fuso Horário
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                <option value="America/New_York">New York (GMT-5)</option>
                <option value="Europe/London">London (GMT+0)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formato de Data
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Backup Automático</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Realizar backup automático dos dados diariamente
                </p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  settings.autoBackup ? 'bg-blue-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    settings.autoBackup ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="destructive" onClick={() => setShowResetModal(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Restaurar Padrões
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)}>
        <ModalHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Restaurar Configurações Padrão</h3>
        </ModalHeader>
        <ModalContent>
          <Alert variant="warning" title="Atenção">
            Esta ação irá restaurar todas as configurações para os valores padrão. 
            Esta ação não pode ser desfeita.
          </Alert>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowResetModal(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleReset}>
            Restaurar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'integrations':
        return <IntegrationsSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'system':
        return <SystemSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-600 dark:text-gray-400">Gerencie as configurações do sistema</p>
      </div>

      {/* Navigation */}
      <SettingsNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {renderContent()}
      </div>
    </div>
  );
};

export default Settings;