import { Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Link>;

export default function TextLink({
    className = '',
    children,
    ...props
}: Props) {
    return (
        <Link
            className={cn(
                'font-bold text-[var(--karsa-primary)] underline decoration-[var(--karsa-sky)] underline-offset-4 transition-colors duration-200 hover:text-[var(--karsa-primary-dark)]',
                className,
            )}
            {...props}
        >
            {children}
        </Link>
    );
}
