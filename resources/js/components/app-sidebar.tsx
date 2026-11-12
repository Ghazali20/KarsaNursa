import { Link, usePage } from '@inertiajs/react';
import {
    ClipboardCheck,
    ClipboardList,
    ClipboardPlus,
    LayoutGrid,
    ListTodo,
    Search,
    Users,
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
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

import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

// ========================================
// APP SIDEBAR
// Navigasi berdasarkan role pengguna.
// ========================================

export function AppSidebar() {
    // Mengambil data pengguna yang sedang login.
    const { auth } = usePage().props;

    // Mengambil role pengguna.
    const role = auth?.user?.role;

    // ========================================
    // MAIN NAVIGATION
    // ========================================

    const mainNavItems: NavItem[] =
        role === 'employer'
            ? [
                  // SIDEBAR PEMILIK UMKM
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
              ]
            : role === 'worker'
              ? [
                    // SIDEBAR PENCARI KERJA
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
                ]
              : role === 'admin'
                ? [
                      // SIDEBAR ADMIN
                      {
                          title: 'Dashboard',
                          href: '/admin',
                          icon: LayoutGrid,
                      },
                      {
                          title: 'Persetujuan Tugas',
                          href: '/admin/tasks',
                          icon: ClipboardCheck,
                      },
                  ]
                : [
                      // FALLBACK NAVIGATION
                      {
                          title: 'Dashboard',
                          href: dashboard(),
                          icon: LayoutGrid,
                      },
                  ];

    // ========================================
    // SIDEBAR LAYOUT
    // ========================================

    return (
        <Sidebar collapsible="icon" variant="inset">
            {/* SIDEBAR HEADER */}
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

            {/* SIDEBAR CONTENT */}
            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            {/* SIDEBAR FOOTER */}
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
