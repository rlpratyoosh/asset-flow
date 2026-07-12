"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface User {
  ID: string;
  FullName: string;
}

interface AuditCycle {
  ID: string;
  StartDate: string;
  EndDate: string;
  Status: string;
  Auditors: User[];
}

interface AuditItem {
  asset_id: string;
  asset_tag: string;
  name: string;
  status: string;
}

interface Asset {
  ID: string;
  Name: string;
  AssetTag: string;
}

export default function AuditPage() {
  const [audits, setAudits] = useState<AuditCycle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  // Create state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');

  // Modal state
  const [activeModalAudit, setActiveModalAudit] = useState<AuditCycle | null>(null);
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [logAssetId, setLogAssetId] = useState('');
  const [logStatus, setLogStatus] = useState('Verified');

  useEffect(() => {
    async function init() {
      try {
        const [meRes, auditsRes, usersRes, assetsRes] = await Promise.all([
          fetch('/api/v1/me'),
          fetch('/api/v1/audits'),
          fetch('/api/v1/users'),
          fetch('/api/v1/assets')
        ]);

        if (meRes.ok) {
          const me = await meRes.json();
          setUserRole(me.role);
          setUserId(me.user_id);
        }
        if (auditsRes.ok) setAudits(await auditsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
        if (assetsRes.ok) setAssets(await assetsRes.json());
      } catch (err) {
        console.error('Failed to init audit', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleCreateAudit = async () => {
    setError('');
    if (!startDate || !endDate || selectedAuditors.length === 0) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const res = await fetch('/api/v1/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          auditor_ids: selectedAuditors
        })
      });

      if (res.ok) {
        const aRes = await fetch('/api/v1/audits');
        setAudits(await aRes.json());
        setStartDate('');
        setEndDate('');
        setSelectedAuditors([]);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create audit cycle');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const openAuditModal = async (audit: AuditCycle) => {
    setActiveModalAudit(audit);
    try {
      const res = await fetch(`/api/v1/audits/${audit.ID}/items`);
      if (res.ok) {
        setAuditItems(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogItem = async () => {
    if (!activeModalAudit || !logAssetId) return;

    try {
      const res = await fetch(`/api/v1/audits/${activeModalAudit.ID}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: logAssetId,
          status: logStatus
        })
      });

      if (res.ok) {
        // Refresh items
        const itemsRes = await fetch(`/api/v1/audits/${activeModalAudit.ID}/items`);
        setAuditItems(await itemsRes.json());
        setLogAssetId('');
        setLogStatus('Verified');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to log item');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseAudit = async (id: string) => {
    if (!confirm("Closing this audit will lock it and update missing/damaged asset statuses. Proceed?")) return;
    
    try {
      const res = await fetch(`/api/v1/audits/${id}/close`, { method: 'PUT' });
      if (res.ok) {
        const aRes = await fetch('/api/v1/audits');
        setAudits(await aRes.json());
        if (activeModalAudit?.ID === id) setActiveModalAudit(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to close audit");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Active': return styles.statusActive;
      case 'Closed': return styles.statusClosed;
      case 'Verified': return styles.statusVerified;
      case 'Missing': return styles.statusMissing;
      case 'Damaged': return styles.statusDamaged;
      default: return '';
    }
  };

  const canEdit = userRole === 'Admin' || userRole === 'AssetManager';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Asset Audit Cycles</h1>
      </header>

      {canEdit && (
        <div className={styles.content}>
          <h2>Create New Audit Cycle</h2>
          <div className={styles.controls}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Start Date</label>
              <input 
                type="datetime-local" 
                className={styles.input}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>End Date</label>
              <input 
                type="datetime-local" 
                className={styles.input}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Assign Auditors</label>
              <select 
                multiple
                className={`${styles.input} ${styles.selectMultiple}`}
                value={selectedAuditors}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedAuditors(values);
                }}
              >
                {users.map(u => (
                  <option key={u.ID} value={u.ID}>{u.FullName}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button className={styles.btnPrimary} onClick={handleCreateAudit}>
              Start Audit
            </button>
          </div>
          {error && <div className={styles.errorText}>{error}</div>}
        </div>
      )}

      <div className={styles.content}>
        <h2>Audit History</h2>
        {loading ? (
          <div className={styles.emptyState}>Loading audits...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Cycle ID</th>
                <th className={styles.th}>Start Date</th>
                <th className={styles.th}>End Date</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Auditors</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>No audit cycles found.</td>
                </tr>
              )}
              {audits.map(a => (
                <tr key={a.ID}>
                  <td className={styles.td}>{a.ID.split('-')[0]}...</td>
                  <td className={styles.td}>{new Date(a.StartDate).toLocaleDateString()}</td>
                  <td className={styles.td}>{new Date(a.EndDate).toLocaleDateString()}</td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${getStatusClass(a.Status)}`}>
                      {a.Status}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {a.Auditors ? a.Auditors.map(aud => aud.FullName).join(', ') : '--'}
                  </td>
                  <td className={styles.td} style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className={styles.btnSecondary} onClick={() => openAuditModal(a)}>
                      View & Log Items
                    </button>
                    {a.Status === 'Active' && canEdit && (
                      <button className={styles.btnPrimary} onClick={() => handleCloseAudit(a.ID)}>
                        Close Cycle
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {activeModalAudit && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Audit Discrepancy Report</h2>
              <button className={styles.closeBtn} onClick={() => setActiveModalAudit(null)}>&times;</button>
            </div>

            {activeModalAudit.Status === 'Active' && (activeModalAudit.Auditors.some(a => a.ID === userId) || canEdit) && (
              <div className={styles.controls} style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Log Asset</label>
                  <select 
                    className={styles.input}
                    value={logAssetId}
                    onChange={(e) => setLogAssetId(e.target.value)}
                  >
                    <option value="">Select asset to log...</option>
                    {assets.map(a => (
                      <option key={a.ID} value={a.ID}>{a.Name} ({a.AssetTag})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Condition</label>
                  <select 
                    className={styles.input}
                    value={logStatus}
                    onChange={(e) => setLogStatus(e.target.value)}
                  >
                    <option value="Verified">Verified</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Missing">Missing</option>
                  </select>
                </div>
                <button className={styles.btnPrimary} onClick={handleLogItem}>
                  Log Item
                </button>
              </div>
            )}

            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Asset Tag</th>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className={styles.emptyState}>No items logged yet.</td>
                  </tr>
                )}
                {auditItems.map(item => (
                  <tr key={item.asset_id}>
                    <td className={styles.td}>{item.asset_tag}</td>
                    <td className={styles.td}>{item.name}</td>
                    <td className={styles.td}>
                      <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
