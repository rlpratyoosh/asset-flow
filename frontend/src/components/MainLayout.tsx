"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './MainLayout.module.css';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{username: string, profile_pic: string, role: string} | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/v1/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setUser(data);
      })
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    try {
      const csrfRes = await fetch("/api/v1/csrf-token");
      if (!csrfRes.ok) throw new Error("Failed to fetch CSRF token");
      const { csrf_token } = await csrfRes.json();

      await fetch('/api/v1/logout', { 
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrf_token
        }
      });
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.logo}>AssetFlow</div>
        <button 
          className={styles.menuBtn} 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>
      <div className={styles.container}>
        <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
          <nav className={styles.nav}>
            <Link 
              href="/dashboard" 
              className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}
            >
              Dashboard
            </Link>
            {user?.role === 'Admin' && (
              <Link 
                href="/organization-setup" 
                className={`${styles.navItem} ${pathname.startsWith('/organization-setup') ? styles.active : ''}`}
              >
                Organization setup
              </Link>
            )}
            {user?.role !== 'Employee' && (
              <Link 
                href="/assets" 
                className={`${styles.navItem} ${pathname.startsWith('/assets') ? styles.active : ''}`}
              >
                Assets
              </Link>
            )}
            {user?.role !== 'Employee' && (
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
            <Link 
              href="/audit" 
              className={`${styles.navItem} ${pathname.startsWith('/audit') ? styles.active : ''}`}
            >
              Audit
            </Link>
            <Link 
              href="/reports" 
              className={`${styles.navItem} ${pathname.startsWith('/reports') ? styles.active : ''}`}
            >
              Reports
            </Link>
            <Link 
              href="/logs" 
              className={`${styles.navItem} ${pathname.startsWith('/logs') ? styles.active : ''}`}
            >
              Logs & Notifications
            </Link>
          </nav>
          
          {user && (
            <div className={styles.profileSection} onClick={() => setShowLogout(!showLogout)}>
              <div className={styles.profileIcon}>
                {user.profile_pic ? (
                  <img src={user.profile_pic} alt="Profile" className={styles.profileImg} />
                ) : (
                  <span className={styles.profileInitials}>{user.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{user.username}</span>
                <span className={styles.profileRole}>{user.role}</span>
              </div>
              {showLogout && (
                <button className={styles.logoutBtn} onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}>
                  Logout
                </button>
              )}
            </div>
          )}
        </aside>
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
