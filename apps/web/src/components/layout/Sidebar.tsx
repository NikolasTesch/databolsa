'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/components/ui/cn';
import { LogoutButton } from './LogoutButton';
import { BrandLogo } from './BrandLogo';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/portfolio', label: 'Portfólio', icon: 'pie_chart' },
  { href: '/portfolio/groups', label: 'Grupos', icon: 'groups' },
  { href: '/assets', label: 'Ativos', icon: 'account_balance' },
  { href: '/wishlist', label: 'Watchlist', icon: 'star' },
];

interface SidebarContentProps {
  onNavClick?: () => void;
}

function SidebarContent({ onNavClick }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <BrandLogo textClassName="font-mono text-headline-md font-bold" />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navegação principal">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-on-surface-variant hover:bg-surface-muted hover:text-on-surface',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-4">
        <LogoutButton />
      </div>
    </div>
  );
}

// Desktop sidebar (sempre visível)
export function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-surface">
      <SidebarContent />
    </aside>
  );
}

// Mobile sidebar (slide in/out)
interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-surface lg:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            aria-label="Menu de navegação"
          >
            <SidebarContent onNavClick={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
