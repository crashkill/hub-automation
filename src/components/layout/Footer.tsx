import React from 'react';
import { Heart, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface FooterProps {
  className?: string;
  showLinks?: boolean;
  compact?: boolean;
}

const footerLinks = [
  {
    label: 'Documentação',
    href: '/docs',
    external: false
  },
  {
    label: 'API Reference',
    href: '/api-docs',
    external: false
  },
  {
    label: 'Suporte',
    href: '/support',
    external: false
  },
  {
    label: 'Status',
    href: 'https://status.hubautomation.com',
    external: true
  },
  {
    label: 'Changelog',
    href: '/changelog',
    external: false
  }
];

export const Footer: React.FC<FooterProps> = ({
  className,
  showLinks = true,
  compact = false
}) => {
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer className={cn(
        'bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors',
        className
      )}>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <span>© {currentYear} Hub Automation</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Feito com</span>
            <Heart className="h-3 w-3 text-red-500 fill-current" />
            <span>pela equipe</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn(
      'bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors',
      className
    )}>
      <div className="px-6 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HA</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">Hub Automation</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 max-w-md">
              Plataforma completa para automação de processos empresariais. 
              Simplifique suas operações e aumente a produtividade com nossas 
              soluções inteligentes.
            </p>
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <span>Feito com</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>pela equipe de desenvolvimento</span>
            </div>
          </div>

          {/* Quick Links */}
          {showLinks && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                {footerLinks.map((link) => (
                  <li key={link.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 justify-start"
                      onClick={() => {
                        if (link.external) {
                          window.open(link.href, '_blank', 'noopener,noreferrer');
                        } else {
                          // Handle internal navigation
                          console.log('Navigate to:', link.href);
                        }
                      }}
                    >
                      <span className="flex items-center space-x-1">
                        <span>{link.label}</span>
                        {link.external && (
                          <ExternalLink className="h-3 w-3" />
                        )}
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* System Info */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Sistema</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Versão:</span>
                <span className="font-mono">v2.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Build:</span>
                <span className="font-mono">#1234</span>
              </div>
              <div className="flex justify-between">
                <span>Ambiente:</span>
                <span className="font-mono">Production</span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span className="text-green-600 font-medium">99.9%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © {currentYear} Hub Automation. Todos os direitos reservados.
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-gray-500 hover:text-primary-600"
              >
                Política de Privacidade
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-gray-500 hover:text-primary-600"
              >
                Termos de Uso
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-gray-500 hover:text-primary-600"
              >
                Cookies
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;