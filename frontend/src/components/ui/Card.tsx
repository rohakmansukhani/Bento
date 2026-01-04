import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={twMerge(
                    "rounded-xl bg-zinc_dark border border-white/5 p-6 shadow-xl",
                    className
                )}
                {...props}
            />
        );
    }
);
Card.displayName = "Card";
