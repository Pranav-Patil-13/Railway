import React, { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function Container({ children, className, ...props }: ContainerProps) {
    return (
        <div className={cn("container mx-auto px-4 sm:px-6 lg:px-8", className)} {...props}>
            {children}
        </div>
    );
}

export function PageWrapper({ children, className, ...props }: ContainerProps) {
    return (
        <div className={cn("min-h-screen flex flex-col w-full bg-background text-text-primary", className)} {...props}>
            {children}
        </div>
    );
}
