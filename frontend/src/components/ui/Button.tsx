import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-lg font-mono font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-safety_gold/50";

        const variants = {
            primary: "bg-safety_gold text-obsidian hover:bg-amber_neon shadow-bento-glow",
            secondary: "bg-zinc_dark text-zinc_text hover:bg-zinc-800 ring-1 ring-white/10",
            danger: "bg-red-900/20 text-red-500 ring-1 ring-red-500/20 hover:bg-red-900/40",
            ghost: "bg-transparent text-zinc-500 hover:text-safety_gold hover:bg-white/5",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 text-sm",
            lg: "h-12 px-6 text-base",
        };

        return (
            <button
                ref={ref}
                className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";
