"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface TransferRequest {
  ID: string;
  AssetID: string;
  RequestedByID: string;
  ApprovedByID: string | null;
  Status: string;
  CreatedAt: string;
}

export default function AllocationPage() {
  const [activeTab, setActiveTab] = useState('Transfers');
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    async function fetchTransfers() {
      setLoading(true);
      try {
        const res = await fetch('/api/v1/assets/transfers');
        if (res.ok) {
          setTransfers(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch transfers:', err);
      } finally {
        setLoading(false);
      }
    }

    if (activeTab === 'Transfers') {
      fetchTransfers();
    }
  }, [activeTab]);

  const handleApprove = async (requestID: string, approve: boolean) => {
    try {
      const csrfRes = await fetch("/api/v1/csrf-token");
      if (!csrfRes.ok) throw new Error("Failed to fetch CSRF token");
      const { csrf_token } = await csrfRes.json();

      const res = await fetch(`/api/v1/assets/transfers/${requestID}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf_token
        },
        body: JSON.stringify({ approved: approve, comments: approve ? 'Approved by admin' : 'Rejected by admin' })
      });
      if (res.ok) {
        setTransfers(prev => prev.filter(t => t.ID !== requestID));
      } else {
        alert("Failed to approve transfer.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Allocation & Transfer</h1>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'Transfers' ? styles.active : ''}`}
          onClick={() => setActiveTab('Transfers')}
        >
          Transfer Requests
        </button>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.emptyState}>Loading transfers...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Asset ID</th>
                <th className={styles.th}>Requested By</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Date</th>
                {(role === 'Admin' || role === 'AssetManager' || role === 'DepartmentHead') && (
                  <th className={styles.th}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>No pending transfer requests.</td>
                </tr>
              )}
              {transfers.map((req) => (
                <tr key={req.ID}>
                  <td className={styles.td}>{req.AssetID}</td>
                  <td className={styles.td}>{req.RequestedByID}</td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${req.Status === 'Approved' ? styles.statusApproved : styles.statusPending}`}>
                      {req.Status}
                    </span>
                  </td>
                  <td className={styles.td}>{new Date(req.CreatedAt).toLocaleDateString()}</td>
                  {(role === 'Admin' || role === 'AssetManager' || role === 'DepartmentHead') && (
                    <td className={styles.td}>
                      {req.Status === 'Pending' && (
                        <button className={styles.actionBtn} onClick={() => handleApprove(req.ID, true)}>
                          Approve
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
