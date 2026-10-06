import karsaNusaLogo from '@/assets/karsanusa-logo.png';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

type KarsaLogoProps = {
    className?: string;
    imageClassName?: string;
    light?: boolean;
    href?: string;
};

export function KarsaLogo({
    className,
    imageClassName,
    light = false,
    href = '/',
}: KarsaLogoProps) {
    return (
        <Link
            href={href}
            className={cn(
                'inline-flex items-center rounded-[10px]',
                light && 'bg-white/95 px-3 py-1.5',
                className,
            )}
            aria-label="KarsaNusa, kembali ke beranda"
        >
            <img
                src={karsaNusaLogo}
                alt="KarsaNusa"
                className={cn('h-auto w-[82px] object-contain', imageClassName)}
            />
        </Link>
    );
}
