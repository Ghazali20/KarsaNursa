import { Link, usePage } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    ClipboardCheck,
    ClipboardList,
    ClipboardPlus,
    FileText,
    Heart,
    History,
    House,
    LayoutGrid,
    ListTodo,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { KarsaLogo } from '@/components/karsa/karsa-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

import { dashboard, home } from '@/routes';
import type { NavItem } from '@/types';

// ========================================
// MENU KHUSUS ADMIN SESUAI FIGMA
// ========================================

const adminItems = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutGrid,
    },
    {
        title: 'Manajemen Akun',
        href: '/admin/users',
        icon: ShieldCheck,
    },
    {
        title: 'Manajemen Tugas',
        href: '/admin/tasks',
        icon: BriefcaseBusiness,
    },
    {
        title: 'Sengketa & Laporan',
        href: '/admin/reports',
        icon: FileText,
    },
    {
        title: 'Log Aktivitas',
        href: '/admin/logs',
        icon: History,
    },
];

// ========================================
// APP SIDEBAR
// ========================================

export function AppSidebar() {
    const { auth } = usePage().props;
    const { url } = usePage();

    const role = auth?.user?.role;
    const isAdmin = role === 'admin';

    const currentPath = url.split('?')[0];

    // ========================================
    // MENU PEMILIK UMKM
    // ========================================

    const employerNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/employer/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Kelola Tugas',
            href: '/employer/tasks',
            icon: ListTodo,
        },
        {
            title: 'Buat Tugas',
            href: '/employer/tasks/create',
            icon: ClipboardPlus,
        },
        {
            title: 'Menerima Pelamar',
            href: '/employer/applications',
            icon: Users,
        },
    ];

    // ========================================
    // MENU PENCARI KERJA
    // ========================================

    const workerNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/worker/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Cari Tugas',
            href: '/worker/tasks',
            icon: Search,
        },
        {
            title: 'Lamaran Saya',
            href: '/worker/applications',
            icon: ClipboardList,
        },
    ];

    let mainNavItems: NavItem[];

    if (role === 'employer') {
        mainNavItems = employerNavItems;
    } else if (role === 'worker') {
        mainNavItems = workerNavItems;
    } else {
        mainNavItems = [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ];
    }

    // ========================================
    // SIDEBAR KHUSUS ADMIN
    // ========================================

    if (isAdmin) {
        return (
            <Sidebar
                collapsible="offcanvas"
                variant="sidebar"
                className="border-r border-[#e2e9ef] [--sidebar-width:238px]"
            >
                {/* LOGO ADMIN */}

                <SidebarHeader className="bg-white px-4 pb-3 pt-6">
                    <Link
                        href={home()}
                        className="mb-4 inline-flex w-fit items-center"
                    >
                        <KarsaLogo
                            imageClassName="w-[100px]"
                        />
                    </Link>

                    <p className="px-3 text-[10px] font-extrabold tracking-[0.12em] text-slate-950">
                        ADMIN CONSOLE
                    </p>
                </SidebarHeader>

                {/* MENU ADMIN */}

                <SidebarContent className="bg-white px-3">
                    <SidebarMenu className="gap-1.5">
                        {adminItems.map((item) => {
                            const Icon = item.icon;

                            const isActive =
                                item.href === '/admin'
                                    ? currentPath === '/admin'
                                    : currentPath === item.href ||
                                    currentPath.startsWith(
                                        `${item.href}/`,
                                    ) ||
                                    (item.href === '/admin/users' &&
                                        currentPath.startsWith(
                                            '/admin/documents',
                                        ));

                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={item.title}
                                        className={[
                                            'h-11 rounded-xl px-3',
                                            'text-[13px] font-semibold',
                                            'transition-colors duration-200',
                                            'data-[active=true]:bg-[#21477F]',
                                            'data-[active=true]:text-white',
                                            'data-[active=true]:hover:bg-[#21477F]',
                                            'data-[active=true]:hover:text-white',
                                            isActive
                                                ? 'bg-[#21477F] text-white'
                                                : 'text-slate-900 hover:bg-slate-100',
                                        ].join(' ')}
                                    >
                                        <Link href={item.href}>
                                            <Icon
                                                size={19}
                                                className="shrink-0"
                                            />

                                            <span>
                                                {item.title}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarContent>

                {/* FOOTER SIDEBAR */}

                <SidebarFooter className="gap-3 bg-white px-3 pb-5">

                    {/* KEMBALI KE BERANDA */}

                    <Link
                        href={home()}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 transition-colors hover:bg-slate-100"
                    >
                        <House size={18} />
                        Kembali ke Beranda
                    </Link>
                </SidebarFooter>
            </Sidebar>
        );
    }

    // ========================================
    // SIDEBAR WORKER DAN UMKM
    // DIPERTAHANKAN SEPERTI SEBELUMNYA
    // ========================================

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
