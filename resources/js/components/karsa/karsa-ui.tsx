import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type KarsaVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type KarsaTone = 'primary' | 'blue' | 'amber' | 'slate' | 'danger';

type KarsaButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: KarsaVariant;
    icon?: ReactNode;
};

type KarsaLinkButtonProps = {
    href: string;
    children: ReactNode;
    className?: string;
    variant?: KarsaVariant;
    icon?: ReactNode;
};

type KarsaBadgeProps = {
    children: ReactNode;
    className?: string;
    tone?: KarsaTone;
};

export function KarsaButton({
    children,
    className,
    variant = 'primary',
    icon,
    type = 'button',
    ...props
}: KarsaButtonProps) {
    return (
        <button
            type={type}
            className={cn('karsa-btn', `karsa-btn-${variant}`, className)}
            {...props}
        >
            {children}
            {icon}
        </button>
    );
}

export function KarsaLinkButton({
    href,
    children,
    className,
    variant = 'primary',
    icon,
}: KarsaLinkButtonProps) {
    return (
        <Link
            href={href}
            className={cn('karsa-btn', `karsa-btn-${variant}`, className)}
        >
            {children}
            {icon}
        </Link>
    );
}

export function KarsaBadge({
    children,
    className,
    tone = 'primary',
}: KarsaBadgeProps) {
    return (
        <span className={cn('karsa-badge', `karsa-badge-${tone}`, className)}>
            {children}
        </span>
    );
}
