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

  const handleSave = () => {
    console.log('Saving profile:', profile);
    // Implementar salvamento
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }
    console.log('Changing password');
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
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
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Telefone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              leftIcon={<Phone className="h-4 w-4" />}
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
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
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
              rightIcon={
                <button onClick={() => setShowPasswords(!showPasswords)}>
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
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
          <Button onClick={handlePasswordChange}>
            Alterar Senha
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>(mockNotificationSettings);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    console.log('Saving notification settings:', settings);
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
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Preferências
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SecuritySettings: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySettings>(mockSecuritySettings);

  const handleToggle2FA = () => {
    setSettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
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
              >
                {settings.twoFactorEnabled ? 'Desativar' : 'Ativar'}
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

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(mockSystemSettings);
  const [showResetModal, setShowResetModal] = useState(false);

  const handleSave = () => {
    console.log('Saving system settings:', settings);
  };

  const handleReset = () => {
    console.log('Resetting system settings');
    setShowResetModal(false);
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
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
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
        return (
          <Card>
            <CardContent className="text-center py-12">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Integrações</h3>
              <p className="text-gray-600 dark:text-gray-400">Configurações de integração em desenvolvimento</p>
            </CardContent>
          </Card>
        );
      case 'appearance':
        return (
          <Card>
            <CardContent className="text-center py-12">
              <Palette className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aparência</h3>
              <p className="text-gray-600 dark:text-gray-400">Configurações de tema em desenvolvimento</p>
            </CardContent>
          </Card>
        );
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