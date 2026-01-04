import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={twMerge(
                    "flex h-10 w-full rounded-md border border-zinc-800 bg-obsidian px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-safety_gold focus:border-safety_gold disabled:cursor-not-allowed disabled:opacity-50 font-mono shadow-bento-inner",
                    className
                )}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";
