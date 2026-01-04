/**
 * Centralized Theme Configuration
 * All theme colors, typography, and design tokens in one place
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const Colors = {
    // Brand Colors
    primary: '#f59e0b', // amber-500
    primaryDark: '#d97706', // amber-600
    primaryLight: '#fbbf24', // amber-400

    // Semantic Colors
    success: '#10b981', // emerald-500
    warning: '#fbbf24', // amber-400
    error: '#ef4444', // red-500
    info: '#3b82f6', // blue-500

    // Neutrals
    obsidian: '#0a0a0a',
    zincDark: '#18181b',
    zincMid: '#27272a',
    zincLight: '#3f3f46',

    // Special
    safetyGold: '#fbbf24',
    amberNeon: '#fbbf24',

    // Text
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textTertiary: '#71717a',
    textMuted: '#52525b',
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Typography = {
    fontFamily: {
        sans: 'Inter, system-ui, sans-serif',
        mono: '"Fira Code", "Courier New", monospace',
    },

    fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem',// 30px
        '4xl': '2.25rem', // 36px
    },

    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },

    lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
    },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const Spacing = {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const Shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    glow: '0 0 20px rgba(251, 191, 36, 0.3)',
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const Transitions = {
    duration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
        slower: '500ms',
    },

    timing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
    },
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const Breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
} as const;

// ============================================================================
// THEME OBJECT
// ============================================================================

export const theme = {
    colors: Colors,
    typography: Typography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadows: Shadows,
    transitions: Transitions,
    breakpoints: Breakpoints,
} as const;

export type Theme = typeof theme;

// ============================================================================
// CSS VARIABLES (for use in globals.css)
// ============================================================================

export const cssVariables = `
:root {
  /* Colors */
  --color-primary: ${Colors.primary};
  --color-primary-dark: ${Colors.primaryDark};
  --color-primary-light: ${Colors.primaryLight};
  
  --color-success: ${Colors.success};
  --color-warning: ${Colors.warning};
  --color-error: ${Colors.error};
  --color-info: ${Colors.info};
  
  --color-obsidian: ${Colors.obsidian};
  --color-zinc-dark: ${Colors.zincDark};
  --color-zinc-mid: ${Colors.zincMid};
  --color-zinc-light: ${Colors.zincLight};
  
  /* Typography */
  --font-sans: ${Typography.fontFamily.sans};
  --font-mono: ${Typography.fontFamily.mono};
  
  /* Spacing */
  --spacing-unit: 0.25rem;
  
  /* Transitions */
  --transition-fast: ${Transitions.duration.fast};
  --transition-base: ${Transitions.duration.base};
  --transition-slow: ${Transitions.duration.slow};
}
`;
