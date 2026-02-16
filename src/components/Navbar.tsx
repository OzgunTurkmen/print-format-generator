"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "Convert" },
        { href: "/about", label: "About" },
    ];

    return (
        <nav
            style={{
                background: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-color)",
            }}
        >
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-2 font-semibold text-lg"
                    style={{ color: "var(--text-primary)" }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Print Format Generator
                </Link>
                <div className="flex items-center gap-1">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                            style={{
                                color:
                                    pathname === link.href
                                        ? "var(--accent-hover)"
                                        : "var(--text-secondary)",
                                background:
                                    pathname === link.href
                                        ? "var(--accent-glow)"
                                        : "transparent",
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
