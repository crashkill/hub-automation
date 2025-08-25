import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
  inputSize?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    inputSize = 'md',
    disabled,
    ...props
  }, ref) => {
    const inputId = React.useId();
    const hasError = !!error;

    const baseClasses = [
      'w-full rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'placeholder:text-gray-400',
    ];

    const variantClasses = {
      default: [
        'border border-gray-300 bg-white',
        'focus:border-blue-500 focus:ring-blue-500/20',
        hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '',
      ],
      filled: [
        'border-0 bg-gray-100',
        'focus:bg-white focus:ring-blue-500/20',
        hasError ? 'bg-red-50 focus:ring-red-500/20' : '',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const iconPadding = {
      sm: leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '',
      md: leftIcon ? 'pl-12' : rightIcon ? 'pr-12' : '',
      lg: leftIcon ? 'pl-14' : rightIcon ? 'pr-14' : '',
    };

    const iconSize = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const iconPosition = {
      sm: leftIcon ? 'left-3' : 'right-3',
      md: leftIcon ? 'left-4' : 'right-4',
      lg: leftIcon ? 'left-4' : 'right-4',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-2',
              hasError ? 'text-red-700' : 'text-gray-700',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              'absolute top-1/2 transform -translate-y-1/2 text-gray-400',
              iconPosition[inputSize],
              disabled && 'opacity-50'
            )}>
              <div className={iconSize[inputSize]}>
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              baseClasses,
              variantClasses[variant],
              sizeClasses[inputSize],
              iconPadding[inputSize],
              className
            )}
            disabled={disabled}
            {...props}
          />
          
          {rightIcon && (
            <div className={cn(
              'absolute top-1/2 transform -translate-y-1/2 text-gray-400',
              iconPosition[inputSize],
              disabled && 'opacity-50'
            )}>
              <div className={iconSize[inputSize]}>
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p className={cn(
            'mt-2 text-sm',
            hasError ? 'text-red-600' : 'text-gray-500'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };