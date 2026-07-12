"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './MainLayout.module.css';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setRole(data.role);
      })
      .catch(console.error);
  }, []);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.logo}>AssetFlow</div>
      </header>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <Link 
              href="/dashboard" 
              className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}
            >
              Dashboard
            </Link>
            {role === 'Admin' && (
              <Link 
                href="/organization-setup" 
                className={`${styles.navItem} ${pathname.startsWith('/organization-setup') ? styles.active : ''}`}
              >
                Organization setup
              </Link>
            )}
            {role !== 'Employee' && (
              <Link 
                href="/assets" 
                className={`${styles.navItem} ${pathname.startsWith('/assets') ? styles.active : ''}`}
              >
                Assets
              </Link>
            )}
            {role !== 'Employee' && (
              <Link 
                href="/allocation" 
                className={`${styles.navItem} ${pathname.startsWith('/allocation') ? styles.active : ''}`}
              >
                Allocation & Transfer
              </Link>
            )}
            <Link 
              href="/booking" 
              className={`${styles.navItem} ${pathname.startsWith('/booking') ? styles.active : ''}`}
            >
              Resource Booking
            </Link>
            <Link 
              href="/maintenance" 
              className={`${styles.navItem} ${pathname.startsWith('/maintenance') ? styles.active : ''}`}
            >
              Maintenance Requests
            </Link>
            <Link href="#" className={styles.navItem}>
              Audit
            </Link>
            <Link href="#" className={styles.navItem}>
              Reports
            </Link>
            <Link href="#" className={styles.navItem}>
              Notifications
            </Link>
          </nav>
        </aside>
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
