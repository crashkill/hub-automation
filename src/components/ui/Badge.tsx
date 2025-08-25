import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    rounded = false,
    dot = false,
    children,
    ...props
  }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-medium transition-colors',
      'border',
    ];

    const variantClasses = {
      default: [
        'bg-gray-100 text-gray-800 border-gray-200',
      ],
      success: [
        'bg-green-100 text-green-800 border-green-200',
      ],
      warning: [
        'bg-yellow-100 text-yellow-800 border-yellow-200',
      ],
      error: [
        'bg-red-100 text-red-800 border-red-200',
      ],
      info: [
        'bg-blue-100 text-blue-800 border-blue-200',
      ],
      secondary: [
        'bg-purple-100 text-purple-800 border-purple-200',
      ],
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-sm gap-1.5',
      lg: 'px-3 py-1.5 text-base gap-2',
    };

    const roundedClasses = rounded ? 'rounded-full' : 'rounded-md';

    const dotClasses = {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    };

    const dotColors = {
      default: 'bg-gray-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      secondary: 'bg-purple-500',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          roundedClasses,
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'rounded-full',
              dotClasses[size],
              dotColors[variant]
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };