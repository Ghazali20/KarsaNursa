import type { LucideIcon } from 'lucide-react';

type DashboardStatCardProps = {
    label: string;
    value: string | number;
    description: string;
    icon: LucideIcon;
    tone?: 'blue' | 'green' | 'amber' | 'violet';
};

const toneClasses = {
    blue: {
        icon: 'bg-blue-50 text-blue-700',
        accent: 'bg-blue-500',
    },
    green: {
        icon: 'bg-emerald-50 text-emerald-700',
        accent: 'bg-emerald-500',
    },
    amber: {
        icon: 'bg-amber-50 text-amber-700',
        accent: 'bg-amber-500',
    },
    violet: {
        icon: 'bg-violet-50 text-violet-700',
        accent: 'bg-violet-500',
    },
};

export function DashboardStatCard({
    label,
    value,
    description,
    icon: Icon,
    tone = 'blue',
}: DashboardStatCardProps) {
    const colors = toneClasses[tone];

    return (
        <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-1 ${colors.accent}`}
            />

            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {label}
                    </p>

                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}
                >
                    <Icon className="size-5" aria-hidden="true" />
                </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
                {description}
            </p>
        </article>
    );
}
