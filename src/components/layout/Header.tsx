import React from 'react';
import { Bell, Search, Settings, User, Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { ThemeToggle } from '../ui/ThemeToggle';

interface HeaderProps {
  onMenuToggle?: () => void;
  showSearch?: boolean;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  showSearch = true,
  title = 'Hub Automation'
}) => {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between transition-colors">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">HA</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white hidden sm:block">
            {title}
          </h1>
        </div>
      </div>

      {/* Center Section - Search */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <Input
            placeholder="Buscar automações, relatórios..."
            icon={<Search className="h-4 w-4" />}
            className="w-full"
          />
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Search button for mobile */}
        {showSearch && (
          <Button variant="ghost" size="sm" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>
        )}

        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          <Badge
            variant="error"
            size="sm"
            className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center text-xs"
          >
            3
          </Badge>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Settings */}
        <Button variant="ghost" size="sm">
          <Settings className="h-5 w-5" />
        </Button>

        {/* User Profile */}
        <div className="flex items-center space-x-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Usuário</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;