"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MainLayout.module.css';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
            <Link 
              href="/organization-setup" 
              className={`${styles.navItem} ${pathname.startsWith('/organization-setup') ? styles.active : ''}`}
            >
              Organization setup
            </Link>
            <Link href="#" className={styles.navItem}>
              Assets
            </Link>
            <Link href="#" className={styles.navItem}>
              Allocation & Transfer
            </Link>
            <Link href="#" className={styles.navItem}>
              Resource Booking
            </Link>
            <Link href="#" className={styles.navItem}>
              Maintenance
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
