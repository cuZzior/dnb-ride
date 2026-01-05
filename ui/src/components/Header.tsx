'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Plus } from 'lucide-react';

interface HeaderProps {
    onAddEventClick: () => void;
}

export default function Header({ onAddEventClick }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass-aurora" style={{ height: 'var(--header-height)', paddingTop: 'var(--safe-area-top)' }}>
            <div className="h-full flex items-center justify-between px-4 max-w-screen-2xl mx-auto">
                <Link href="/" className="flex items-center">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                        <Image
                            src="/logo.png"
                            alt="DNBRIDE"
                            fill
                            className="object-contain"
                        />
                    </div>
                </Link>

                <nav className="hidden md:flex items-center gap-4">
                    <Link href="/admin" className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors rounded-full hover:bg-white/5">
                        Admin
                    </Link>
                    <button
                        className="flex items-center gap-2 px-5 py-2.5 btn-coral text-sm"
                        onClick={onAddEventClick}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Ride</span>
                    </button>
                </nav>

                <button
                    className="md:hidden p-2 text-[var(--color-text)] hover:bg-white/5 rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden glass-aurora border-t border-white/5 animate-slide-up">
                    <nav className="flex flex-col p-4 gap-2">
                        <Link
                            href="/admin"
                            className="px-4 py-3 rounded-2xl hover:bg-white/5 text-[var(--color-text)] font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Admin
                        </Link>
                        <button
                            className="flex items-center justify-center gap-2 px-4 py-3 btn-coral text-white font-medium mt-2"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                onAddEventClick();
                            }}
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Ride</span>
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
}
