"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface DepreciationEntry {
  asset_id: string;
  asset_tag: string;
  name: string;
  category_name: string;
  acquisition_cost: number;
  current_value: number;
  age_in_years: number;
}

interface ConditionSummary {
  condition: string;
  count: number;
}

interface AllocationSummary {
  department_name: string;
  asset_count: number;
}

export default function ReportsPage() {
  const [depreciation, setDepreciation] = useState<DepreciationEntry[]>([]);
  const [condition, setCondition] = useState<ConditionSummary[]>([]);
  const [allocation, setAllocation] = useState<AllocationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const [depRes, condRes, allocRes] = await Promise.all([
          fetch('/api/v1/reports/depreciation'),
          fetch('/api/v1/reports/condition'),
          fetch('/api/v1/reports/allocation')
        ]);

        if (depRes.ok) setDepreciation(await depRes.json() || []);
        if (condRes.ok) setCondition(await condRes.json() || []);
        if (allocRes.ok) setAllocation(await allocRes.json() || []);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/v1/reports/export?format=csv', '_blank');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.emptyState}>Loading analytics...</div></div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reports & Analytics</h1>
        <button className={styles.btnPrimary} onClick={handleExportCSV}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export CSV
        </button>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Condition Summary</h2>
          {condition.length === 0 ? <p className={styles.statLabel}>No data available</p> : null}
          {condition.map(c => (
            <div key={c.condition} className={styles.statRow}>
              <span className={styles.statLabel}>{c.condition}</span>
              <span className={styles.statValue}>{c.count} Assets</span>
            </div>
          ))}
        </div>

        <div className={styles.card}>
          <h2>Allocation by Department</h2>
          {allocation.length === 0 ? <p className={styles.statLabel}>No data available</p> : null}
          {allocation.map(a => (
            <div key={a.department_name} className={styles.statRow}>
              <span className={styles.statLabel}>{a.department_name}</span>
              <span className={styles.statValue}>{a.asset_count} Allocated</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: '1rem' }}>
        <h2>Depreciation Tracking (Straight-Line, 5yr)</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Asset Tag</th>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Age (Yrs)</th>
              <th className={styles.th}>Acquisition Cost</th>
              <th className={styles.th}>Current Value</th>
            </tr>
          </thead>
          <tbody>
            {depreciation.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyState}>No depreciation data found.</td>
              </tr>
            )}
            {depreciation.map(d => (
              <tr key={d.asset_id}>
                <td className={styles.td}>{d.asset_tag}</td>
                <td className={styles.td}>{d.name}</td>
                <td className={styles.td}>{d.category_name}</td>
                <td className={styles.td}>{d.age_in_years.toFixed(1)}</td>
                <td className={styles.td}>{formatCurrency(d.acquisition_cost)}</td>
                <td className={styles.td} style={{ color: d.current_value === 0 ? '#fca5a5' : '#34d399' }}>
                  {formatCurrency(d.current_value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
