import { TextareaHTMLAttributes, forwardRef, useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    autoResize?: boolean;
    maxHeight?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, autoResize = true, maxHeight = 300, onChange, style, ...props }, ref) => {
        const innerRef = useRef<HTMLTextAreaElement>(null);

        // Merge refs to ensure we can both use our internal ref and forward one
        const setRefs = (element: HTMLTextAreaElement | null) => {
            innerRef.current = element;
            if (typeof ref === 'function') ref(element);
            else if (ref) (ref as any).current = element;
        };

        const adjustHeight = () => {
            const el = innerRef.current;
            if (el && autoResize) {
                // Reset height to auto to correctly calculate scrollHeight for shrinking content
                el.style.height = 'auto';
                const newHeight = Math.min(el.scrollHeight, maxHeight);
                el.style.height = `${newHeight}px`;

                // Show scrollbar if content exceeds maxHeight
                if (el.scrollHeight > maxHeight) {
                    el.style.overflowY = 'auto';
                } else {
                    el.style.overflowY = 'hidden';
                }
            }
        };

        useEffect(() => {
            adjustHeight();
        }, [props.value]);

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            adjustHeight();
            onChange?.(e);
        };

        return (
            <textarea
                ref={setRefs}
                onChange={handleChange}
                rows={1}
                className={twMerge(
                    "flex w-full rounded-md border border-zinc-800 bg-obsidian px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-safety_gold focus:border-safety_gold disabled:cursor-not-allowed disabled:opacity-50 font-mono shadow-bento-inner resize-y",
                    className
                )}
                style={{ ...style }}
                {...props}
            />
        );
    }
);

Textarea.displayName = "Textarea";
