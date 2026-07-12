"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface ActivityLog {
  id: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
}

interface Notification {
  ID: string;
  Message: string;
  Type: string;
  IsRead: boolean;
  CreatedAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters for logs
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch('/api/v1/me');
        if (meRes.ok) {
          const me = await meRes.json();
          setUserRole(me.role);
          
          const p = [fetch('/api/v1/notifications')];
          if (me.role === 'Admin' || me.role === 'AssetManager') {
            p.push(fetch('/api/v1/logs'));
          }

          const res = await Promise.all(p);
          if (res[0].ok) setNotifications(await res[0].json());
          if (res.length > 1 && res[1].ok) setLogs(await res[1].json());
        }
      } catch (err) {
        console.error('Failed to init logs page', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleFilterLogs = async () => {
    try {
      const q = actionFilter ? `?action=${actionFilter}` : '';
      const res = await fetch(`/api/v1/logs${q}`);
      if (res.ok) setLogs(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id: string) => {
    try {
      const csrfRes = await fetch("/api/v1/csrf-token");
      if (!csrfRes.ok) throw new Error("Failed to fetch CSRF token");
      const { csrf_token } = await csrfRes.json();

      await fetch(`/api/v1/notifications/${id}/read`, { 
        method: 'PUT',
        headers: { 'X-CSRF-Token': csrf_token }
      });
      setNotifications(prev => prev.map(n => n.ID === id ? { ...n, IsRead: true } : n));
    } catch(err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.IsRead).length;

  if (loading) {
    return <div className={styles.container}><div className={styles.emptyState}>Loading...</div></div>;
  }

  const isAdminOrManager = userRole === 'Admin' || userRole === 'AssetManager';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Activity Logs & Notifications</h1>
      </header>

      <div className={styles.grid}>
        {isAdminOrManager && (
          <div className={styles.card} style={{ gridColumn: '1 / span 1' }}>
            <h2>System Audit Trail</h2>
            <div className={styles.filterBar}>
              <input 
                type="text" 
                placeholder="Filter by Action (e.g. AssetCreated)" 
                className={styles.input}
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              />
              <button className={styles.btnSecondary} onClick={handleFilterLogs}>Filter</button>
            </div>
            
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>User</th>
                  <th className={styles.th}>Action</th>
                  <th className={styles.th}>Entity</th>
                  <th className={styles.th}>Entity ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyState}>No activity logs found.</td>
                  </tr>
                )}
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className={styles.td}>{new Date(log.created_at).toLocaleString()}</td>
                    <td className={styles.td}>{log.user_name}</td>
                    <td className={styles.td}>{log.action}</td>
                    <td className={styles.td}>{log.entity}</td>
                    <td className={styles.td} style={{ fontFamily: 'monospace' }}>
                      {log.entity_id.split('-')[0]}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.card} style={!isAdminOrManager ? { gridColumn: '1 / -1' } : {}}>
          <h2>
            My Notifications
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount} New</span>}
          </h2>
          
          <div className={styles.notificationList}>
            {notifications.length === 0 && (
              <div className={styles.emptyState}>You're all caught up!</div>
            )}
            {notifications.map(n => (
              <div key={n.ID} className={`${styles.notificationItem} ${!n.IsRead ? styles.unread : ''}`}>
                <div className={styles.notifContent}>
                  <span className={styles.notifMessage}>{n.Message}</span>
                  <span className={styles.notifTime}>{new Date(n.CreatedAt).toLocaleString()} • {n.Type}</span>
                </div>
                {!n.IsRead && (
                  <button className={styles.btnSecondary} onClick={() => markRead(n.ID)}>
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
