import React from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = "text", label, error, id, ...props }, ref) => {

        // Generate a unique ID if a label is present but no explicit id was provided
        const inputId = id || (label ? `input-${Math.random().toString(36).substring(2, 9)}` : undefined);

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-1.5">
                        {label}
                    </label>
                )}
                <input
                    id={inputId}
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors",
                        "focus:border-primary focus:ring-1 focus:ring-primary",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-error focus:border-error focus:ring-error",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-error">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
