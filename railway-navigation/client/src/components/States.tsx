import { Loader2, AlertCircle, Inbox } from 'lucide-react';
import { cn } from '../utils/cn';
import React, { type ReactNode } from 'react';

// === Loading State ===
export function LoadingSpinner({ className, size = 24 }: { className?: string; size?: number }) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8", className)}>
            <Loader2 className="animate-spin text-primary" size={size} />
            <p className="mt-4 text-sm font-medium text-text-secondary">Loading...</p>
        </div>
    );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-secondary", className)}
            {...props}
        />
    );
}


// === Error State ===
interface ErrorStateProps {
    title?: string;
    message?: string;
    className?: string;
    action?: ReactNode;
}

export function ErrorState({
    title = "Something went wrong",
    message = "Please try again later or contact support.",
    className,
    action
}: ErrorStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8 text-center rounded-xl border border-error/20 bg-error/5", className)}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 mb-4">
                <AlertCircle className="h-6 w-6 text-error" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
            <p className="text-sm text-text-secondary max-w-md mb-6">{message}</p>
            {action && <div>{action}</div>}
        </div>
    );
}


// === Empty State ===
interface EmptyStateProps {
    title?: string;
    description?: string;
    className?: string;
    action?: ReactNode;
}

export function EmptyState({
    title = "No data found",
    description = "Get started by creating or searching for a new record.",
    className,
    action
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-12 text-center rounded-xl border border-border border-dashed bg-surface", className)}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
                <Inbox className="h-6 w-6 text-text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
            <p className="text-sm text-text-secondary max-w-md mb-6">{description}</p>
            {action && <div>{action}</div>}
        </div>
    );
}
