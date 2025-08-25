import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Bot,
  BarChart3,
  Settings,
  Users,
  FileText,
  Calendar,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  isActive?: boolean;
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  className?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="h-5 w-5" />,
    href: '/dashboard'
  },
  {
    id: 'automations',
    label: 'Automações',
    icon: <Bot className="h-5 w-5" />,
    href: '/automations',
    badge: '12'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    href: '/analytics'
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: <FileText className="h-5 w-5" />,
    href: '/reports'
  },
  {
    id: 'schedule',
    label: 'Agendamentos',
    icon: <Calendar className="h-5 w-5" />,
    href: '/schedule'
  },
  {
    id: 'users',
    label: 'Usuários',
    icon: <Users className="h-5 w-5" />,
    href: '/users'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: <Settings className="h-5 w-5" />,
    href: '/settings'
  },
  {
    id: 'help',
    label: 'Ajuda',
    icon: <HelpCircle className="h-5 w-5" />,
    href: '/help'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  activeItem = 'dashboard',
  onItemClick,
  className
}) => {
  const handleItemClick = (item: SidebarItem) => {
    onItemClick?.(item.id);
  };

  return (
    <aside
      className={cn(
        'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HA</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">Hub Automation</span>
            </div>
          )}
          
          {isCollapsed && (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">HA</span>
            </div>
          )}
          
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className={cn(
                'hidden lg:flex',
                isCollapsed && 'mx-auto mt-2'
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = activeItem === item.id;
          
          return (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => handleItemClick(item)}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'no-underline',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={cn(
                'flex-shrink-0',
                isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
              )}>
                {item.icon}
              </span>
              
              {!isCollapsed && (
                <>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      size="sm"
                      className="ml-auto"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Versão 2.0.0</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Última atualização: Hoje</p>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">v2</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;