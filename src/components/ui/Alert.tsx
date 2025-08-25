import React from 'react';
import { cn } from '../../utils/cn';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  title?: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  showIcon?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({
    className,
    variant = 'default',
    title,
    description,
    dismissible = false,
    onDismiss,
    icon,
    showIcon = true,
    children,
    ...props
  }, ref) => {
    const baseClasses = [
      'relative rounded-lg border p-4',
      'transition-all duration-200',
    ];

    const variantClasses = {
      default: [
        'bg-gray-50 border-gray-200 text-gray-800',
      ],
      success: [
        'bg-green-50 border-green-200 text-green-800',
      ],
      warning: [
        'bg-yellow-50 border-yellow-200 text-yellow-800',
      ],
      error: [
        'bg-red-50 border-red-200 text-red-800',
      ],
      info: [
        'bg-blue-50 border-blue-200 text-blue-800',
      ],
    };

    const defaultIcons = {
      default: <Info className="h-5 w-5" />,
      success: <CheckCircle className="h-5 w-5" />,
      warning: <AlertTriangle className="h-5 w-5" />,
      error: <AlertCircle className="h-5 w-5" />,
      info: <Info className="h-5 w-5" />,
    };

    const iconColors = {
      default: 'text-gray-500',
      success: 'text-green-500',
      warning: 'text-yellow-500',
      error: 'text-red-500',
      info: 'text-blue-500',
    };

    const displayIcon = icon || (showIcon ? defaultIcons[variant] : null);

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start">
          {displayIcon && (
            <div className={cn('flex-shrink-0 mr-3', iconColors[variant])}>
              {displayIcon}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="text-sm font-medium mb-1">
                {title}
              </h4>
            )}
            
            {description && (
              <p className="text-sm opacity-90">
                {description}
              </p>
            )}
            
            {children && (
              <div className="mt-2">
                {children}
              </div>
            )}
          </div>
          
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className={cn(
                'flex-shrink-0 ml-3 p-1 rounded-md',
                'hover:bg-black hover:bg-opacity-10',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                variant === 'default' && 'focus:ring-gray-500',
                variant === 'success' && 'focus:ring-green-500',
                variant === 'warning' && 'focus:ring-yellow-500',
                variant === 'error' && 'focus:ring-red-500',
                variant === 'info' && 'focus:ring-blue-500'
              )}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };