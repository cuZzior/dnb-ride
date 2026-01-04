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
        <header className="fixed top-0 left-0 right-0 z-50 glass" style={{ height: 'var(--header-height)', paddingTop: 'var(--safe-area-top)' }}>
            <div className="h-full flex items-center justify-between px-4 max-w-screen-2xl mx-auto">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden">
                        <Image
                            src="/logo.png"
                            alt="DnB On The Bike"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <span className="text-lg font-bold">
                        <span className="text-[var(--color-text)]">DnB </span>
                        <span className="gradient-text">On The Bike</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-4">
                    <Link href="/admin" className="px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                        Admin
                    </Link>
                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-lg btn-gradient text-sm"
                        onClick={onAddEventClick}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Ride</span>
                    </button>
                </nav>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-[var(--color-text)] hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden glass border-t border-white/5 animate-slide-up">
                    <nav className="flex flex-col p-4 gap-2">
                        <Link
                            href="/admin"
                            className="px-4 py-3 rounded-lg hover:bg-white/5 text-[var(--color-text)] font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Admin
                        </Link>
                        <button
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg btn-gradient text-white font-medium mt-2"
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
