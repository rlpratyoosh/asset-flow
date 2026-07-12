"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface DashboardData {
  kpis: {
    assets_available: number;
    assets_allocated: number;
    maintenance_today: number;
    active_bookings: number;
    pending_transfers: number;
    upcoming_returns: number;
    overdue_returns: number;
  };
  overdue_allocations: Array<{
    allocation_id: string;
    asset_tag: string;
    asset_name: string;
    assigned_to: string;
    expected_return_date: string;
    days_overdue: number;
  }>;
  activity_logs: Array<{
    log_id: string;
    user_id: string;
    action: string;
    entity: string;
    entity_id: string;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/v1/dashboard');
        
        // Handle mock fallback if backend is not running
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const result = await response.json();
        if (result.status === 'success') {
          setData(result.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.warn("Backend not available, using mock data for dashboard");
        // Fallback to mock data based on the API docs and wireframe
        setData({
          kpis: {
            assets_available: 128,
            assets_allocated: 76,
            maintenance_today: 4,
            active_bookings: 9,
            pending_transfers: 3,
            upcoming_returns: 12,
            overdue_returns: 3
          },
          overdue_allocations: [
            {
              allocation_id: "uuid-1",
              asset_tag: "AF-0114",
              asset_name: "Dell XPS 15",
              assigned_to: "Priya Sharma",
              expected_return_date: "2026-07-10T18:00:00Z",
              days_overdue: 2
            }
          ],
          activity_logs: [
            {
              log_id: "log-1",
              user_id: "user-1",
              action: "Allocated to Priya shah - IT dept",
              entity: "Laptop AF-0114",
              entity_id: "asset-1",
              created_at: "2026-07-11T10:00:00Z"
            },
            {
              log_id: "log-2",
              user_id: "user-2",
              action: "Booking confirmed - 2:00 to 3:00 PM",
              entity: "Room B2",
              entity_id: "asset-2",
              created_at: "2026-07-11T11:00:00Z"
            },
            {
              log_id: "log-3",
              user_id: "user-3",
              action: "Maintenance resolved",
              entity: "Projector AF-0062",
              entity_id: "asset-3",
              created_at: "2026-07-11T12:00:00Z"
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    }

    async function fetchUserRole() {
      try {
        const res = await fetch('/api/v1/me');
        if (res.ok) {
          const userData = await res.json();
          setRole(userData.role);
        }
      } catch (err) {
        console.error("Failed to fetch role");
      }
    }

    fetchUserRole();
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  if (error && !data) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Today's Overview</h1>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Available</div>
          <div className={styles.cardValue}>{data?.kpis.assets_available}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Allocated</div>
          <div className={styles.cardValue}>{data?.kpis.assets_allocated}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Maintenance</div>
          <div className={styles.cardValue}>{data?.kpis.maintenance_today}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Active Bookings</div>
          <div className={styles.cardValue}>{data?.kpis.active_bookings}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Pending Transfers</div>
          <div className={styles.cardValue}>{data?.kpis.pending_transfers}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Upcoming returns</div>
          <div className={styles.cardValue}>{data?.kpis.upcoming_returns}</div>
        </div>
      </div>

      {data?.kpis.overdue_returns && data.kpis.overdue_returns > 0 && (
        <div className={styles.alertBanner}>
          {data.kpis.overdue_returns} assets overdue for return - flagged for follow-up
        </div>
      )}

      <div className={styles.actionButtons}>
        {(role === 'Admin' || role === 'AssetManager') && (
          <button 
            className={`${styles.btnAction} ${styles.primary}`}
            onClick={() => router.push('/assets?register=true')}
          >
            + register asset
          </button>
        )}
        <button className={styles.btnAction} onClick={() => router.push('/booking')}>Book resource</button>
        <button className={styles.btnAction} onClick={() => router.push('/maintenance')}>Raise requests</button>
      </div>

      <section>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        <div className={styles.activityList}>
          {data?.activity_logs && data.activity_logs.length > 0 ? (
            data.activity_logs.map((log) => (
              <div key={log.log_id} className={styles.activityItem}>
                {log.entity} - {log.action.toLowerCase()}
              </div>
            ))
          ) : (
            <div className={styles.activityItem}>No recent activity.</div>
          )}
        </div>
      </section>
    </div>
  );
}
