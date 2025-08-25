import { colors, spacing, typography, borderRadius, shadows, transitions } from './tokens';

// Configuração do tema principal
export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  
  // Componentes específicos
  components: {
    button: {
      variants: {
        primary: {
          background: colors.primary[600],
          color: '#ffffff',
          hover: {
            background: colors.primary[700],
          },
          active: {
            background: colors.primary[800],
          },
          focus: {
            ring: colors.primary[500],
          },
        },
        secondary: {
          background: colors.gray[100],
          color: colors.gray[900],
          border: colors.gray[300],
          hover: {
            background: colors.gray[200],
          },
          active: {
            background: colors.gray[300],
          },
          focus: {
            ring: colors.gray[500],
          },
        },
        outline: {
          background: 'transparent',
          color: colors.primary[600],
          border: colors.primary[600],
          hover: {
            background: colors.primary[50],
          },
          active: {
            background: colors.primary[100],
          },
          focus: {
            ring: colors.primary[500],
          },
        },
        ghost: {
          background: 'transparent',
          color: colors.gray[700],
          hover: {
            background: colors.gray[100],
          },
          active: {
            background: colors.gray[200],
          },
          focus: {
            ring: colors.gray[500],
          },
        },
        danger: {
          background: colors.error[600],
          color: '#ffffff',
          hover: {
            background: colors.error[700],
          },
          active: {
            background: colors.error[800],
          },
          focus: {
            ring: colors.error[500],
          },
        },
      },
      sizes: {
        sm: {
          padding: `${spacing[1]} ${spacing[3]}`,
          fontSize: typography.fontSize.sm,
          gap: spacing[1],
        },
        md: {
          padding: `${spacing[2]} ${spacing[4]}`,
          fontSize: typography.fontSize.base,
          gap: spacing[2],
        },
        lg: {
          padding: `${spacing[3]} ${spacing[6]}`,
          fontSize: typography.fontSize.lg,
          gap: spacing[2],
        },
      },
    },
    
    input: {
      variants: {
        default: {
          background: '#ffffff',
          border: colors.gray[300],
          focus: {
            border: colors.primary[500],
            ring: `${colors.primary[500]}20`,
          },
          error: {
            border: colors.error[500],
            ring: `${colors.error[500]}20`,
          },
        },
        filled: {
          background: colors.gray[100],
          border: 'transparent',
          focus: {
            background: '#ffffff',
            ring: `${colors.primary[500]}20`,
          },
          error: {
            background: colors.error[50],
            ring: `${colors.error[500]}20`,
          },
        },
      },
      sizes: {
        sm: {
          padding: `${spacing[2]} ${spacing[3]}`,
          fontSize: typography.fontSize.sm,
        },
        md: {
          padding: `${spacing[2]} ${spacing[4]}`,
          fontSize: typography.fontSize.base,
        },
        lg: {
          padding: `${spacing[3]} ${spacing[4]}`,
          fontSize: typography.fontSize.lg,
        },
      },
    },
    
    card: {
      variants: {
        default: {
          background: '#ffffff',
          border: colors.gray[200],
          shadow: 'none',
        },
        outlined: {
          background: '#ffffff',
          border: colors.gray[300],
          borderWidth: '2px',
          shadow: 'none',
        },
        elevated: {
          background: '#ffffff',
          border: 'transparent',
          shadow: shadows.lg,
        },
      },
      padding: {
        none: '0',
        sm: spacing[4],
        md: spacing[6],
        lg: spacing[8],
      },
    },
    
    badge: {
      variants: {
        default: {
          background: colors.gray[100],
          color: colors.gray[800],
          border: colors.gray[200],
        },
        success: {
          background: colors.success[100],
          color: colors.success[800],
          border: colors.success[200],
        },
        warning: {
          background: colors.warning[100],
          color: colors.warning[800],
          border: colors.warning[200],
        },
        error: {
          background: colors.error[100],
          color: colors.error[800],
          border: colors.error[200],
        },
        info: {
          background: colors.primary[100],
          color: colors.primary[800],
          border: colors.primary[200],
        },
        secondary: {
          background: colors.secondary[100],
          color: colors.secondary[800],
          border: colors.secondary[200],
        },
      },
      sizes: {
        sm: {
          padding: `${spacing[1]} ${spacing[2]}`,
          fontSize: typography.fontSize.xs,
          gap: spacing[1],
        },
        md: {
          padding: `${spacing[1]} ${spacing[2]}`,
          fontSize: typography.fontSize.sm,
          gap: spacing[1],
        },
        lg: {
          padding: `${spacing[2]} ${spacing[3]}`,
          fontSize: typography.fontSize.base,
          gap: spacing[2],
        },
      },
    },
    
    alert: {
      variants: {
        default: {
          background: colors.gray[50],
          border: colors.gray[200],
          color: colors.gray[800],
          icon: colors.gray[500],
        },
        success: {
          background: colors.success[50],
          border: colors.success[200],
          color: colors.success[800],
          icon: colors.success[500],
        },
        warning: {
          background: colors.warning[50],
          border: colors.warning[200],
          color: colors.warning[800],
          icon: colors.warning[500],
        },
        error: {
          background: colors.error[50],
          border: colors.error[200],
          color: colors.error[800],
          icon: colors.error[500],
        },
        info: {
          background: colors.primary[50],
          border: colors.primary[200],
          color: colors.primary[800],
          icon: colors.primary[500],
        },
      },
    },
  },
  
  // Breakpoints responsivos
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};

export type Theme = typeof theme;

// Utilitários para acessar o tema
export const getColor = (path: string) => {
  const keys = path.split('.');
  let value: any = colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value;
};

export const getSpacing = (size: keyof typeof spacing) => spacing[size];

export const getFontSize = (size: keyof typeof typography.fontSize) => typography.fontSize[size];

export const getBorderRadius = (size: keyof typeof borderRadius) => borderRadius[size];

export const getShadow = (size: keyof typeof shadows) => shadows[size];