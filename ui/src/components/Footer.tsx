'use client';

import { Heart, Github } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="absolute bottom-0 left-0 right-0 z-30 p-3 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-background)]/80 backdrop-blur border-t border-white/5"
            style={{ paddingBottom: 'calc(0.75rem + var(--safe-area-bottom))' }}
        >
            <div className="flex flex-wrap items-center justify-center gap-4">
                <span>© {new Date().getFullYear()} DNB On The Bike</span>
                <a
                    href="https://ko-fi.com/dnbonbike"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
                >
                    <Heart className="w-3 h-3" />
                    <span>Support</span>
                </a>
                <a
                    href="https://github.com/dnbonbike"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[var(--color-text)] transition-colors"
                >
                    <Github className="w-3 h-3" />
                    <span>GitHub</span>
                </a>
            </div>
        </footer>
    );
}
