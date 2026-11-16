import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { AppLayoutProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    ChevronDown,
    LogOut,
    UserRound,
} from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ========================================
// LAYOUT APLIKASI KARSA NURSA
// ========================================

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage().props;

    const user = auth?.user;
    const isAdmin = user?.role === 'admin';

    const userName = user?.name || 'Admin';

    const initials = userName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase();

    return (
        <AppShell variant="sidebar">
            {/* =====================================
                SIDEBAR SESUAI ROLE
            ===================================== */}

            <AppSidebar />

            {/* =====================================
                AREA UTAMA APLIKASI
            ===================================== */}

            <AppContent
                variant="sidebar"
                className={
                    isAdmin
                        ? 'min-w-0 overflow-x-clip bg-[#21477F]'
                        : 'min-w-0 overflow-x-clip'
                }
            >
                {isAdmin ? (
                    <>
                        {/* =========================
                            HEADER KHUSUS ADMIN
                        ========================= */}

                        <header className="sticky top-0 z-30 flex h-[70px] shrink-0 items-center justify-between gap-3 border-b border-[#e3eaf1] bg-white px-4 sm:px-6 lg:px-8">
                            {/* HEADER KIRI */}

                            <div className="flex min-w-0 items-center gap-3">
                                {/* TOGGLE SIDEBAR MOBILE */}

                                <SidebarTrigger className="shrink-0 text-slate-700 md:hidden" />

                                <div className="min-w-0">
                                    <p className="text-[10px] font-medium text-slate-500">
                                        Admin Console
                                    </p>

                                    <h2 className="truncate text-xs font-bold text-slate-950 sm:text-sm">
                                        Pusat Kendali Platform
                                    </h2>
                                </div>
                            </div>

                            {/* HEADER KANAN */}

                            <div className="flex items-center gap-3 sm:gap-5">
                                {/* NOTIFIKASI VISUAL */}

                                <span
                                    className="relative flex h-10 w-10 items-center justify-center text-slate-950"
                                    title="Notifikasi belum tersedia"
                                    aria-label="Notifikasi belum tersedia"
                                >
                                    <Bell size={20} />
                                </span>

                                {/* PEMISAH */}

                                <div className="h-9 w-px bg-slate-200" />


                                {/* =====================================
    DROPDOWN AKUN ADMIN
===================================== */}

                                <DropdownMenu>
                                    {/* TOMBOL DROPDOWN */}
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex min-w-0 items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#21477F]"
                                        >
                                            {/* AVATAR ADMIN */}
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d5f2f8] text-xs font-bold text-slate-900">
                                                {initials}
                                            </div>

                                            {/* NAMA ADMIN */}
                                            <div className="hidden min-w-0 text-left sm:block">
                                                <p className="max-w-[150px] truncate text-xs font-bold text-slate-950">
                                                    {userName}
                                                </p>

                                                <p className="mt-0.5 text-[10px] text-slate-500">
                                                    Administrator
                                                </p>
                                            </div>

                                            {/* ICON DROPDOWN */}
                                            <ChevronDown
                                                size={15}
                                                className="hidden text-slate-700 sm:block"
                                            />
                                        </button>
                                    </DropdownMenuTrigger>

                                    {/* ISI DROPDOWN */}
                                    <DropdownMenuContent
                                        align="end"
                                        sideOffset={8}
                                        className="w-52 border border-slate-200 bg-white p-1.5 shadow-lg"
                                    >
                                        {/* EDIT PROFILE */}
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href="/settings/profile"
                                                className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700"
                                            >
                                                <UserRound size={17} />
                                                Edit Profile
                                            </Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        {/* LOGOUT */}
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href="/logout"
                                                method="post"
                                                as="button"
                                                className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600"
                                            >
                                                <LogOut size={17} />
                                                Logout
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                            </div>
                        </header>

                        {/* =========================
                            KONTEN ADMIN
                        ========================= */}

                        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#21477F]">
                            {children}
                        </div>
                    </>
                ) : (
                    <>
                        {/* =========================
                            LAYOUT WORKER DAN UMKM
                            TIDAK DIUBAH
                        ========================= */}

                        <AppSidebarHeader
                            breadcrumbs={breadcrumbs}
                        />

                        {children}
                    </>
                )}
            </AppContent>
        </AppShell>
    );
}
