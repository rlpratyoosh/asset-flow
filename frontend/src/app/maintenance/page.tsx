"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface MaintenanceRequest {
  ID: string;
  AssetID: string;
  RaisedByID: string;
  IssueDesc: string;
  Priority: string;
  Status: string;
  TechnicianName: string;
  CreatedAt: string;
  Asset: {
    Name: string;
    AssetTag: string;
  };
}

interface Asset {
  ID: string;
  Name: string;
  AssetTag: string;
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  const [selectedAsset, setSelectedAsset] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [priority, setPriority] = useState('Medium');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [meRes, assetsRes, maintRes] = await Promise.all([
          fetch('/api/v1/me'),
          fetch('/api/v1/assets'),
          fetch('/api/v1/maintenance')
        ]);

        if (meRes.ok) {
          const me = await meRes.json();
          setUserRole(me.role);
        }

        if (assetsRes.ok) {
          setAssets(await assetsRes.json());
        }

        if (maintRes.ok) {
          setRequests(await maintRes.json());
        }
      } catch (err) {
        console.error('Failed to initialize maintenance page', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleRaiseRequest = async () => {
    setError('');
    if (!selectedAsset || !issueDesc || !priority) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const csrfRes = await fetch("/api/v1/csrf-token");
      if (!csrfRes.ok) throw new Error("Failed to fetch CSRF token");
      const { csrf_token } = await csrfRes.json();

      const res = await fetch('/api/v1/maintenance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf_token
        },
        body: JSON.stringify({
          asset_id: selectedAsset,
          issue_desc: issueDesc,
          priority: priority
        })
      });

      if (res.ok) {
        const mRes = await fetch('/api/v1/maintenance');
        setRequests(await mRes.json());
        setIssueDesc('');
        setSelectedAsset('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to raise request');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      // Prompt for technician name if approving
      let technician = '';
      if (newStatus === 'Approved') {
        const name = prompt("Enter assigned technician's name (optional):");
        if (name !== null) technician = name;
      }

      const csrfRes = await fetch("/api/v1/csrf-token");
      if (!csrfRes.ok) throw new Error("Failed to fetch CSRF token");
      const { csrf_token } = await csrfRes.json();

      const res = await fetch(`/api/v1/maintenance/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf_token
        },
        body: JSON.stringify({
          status: newStatus,
          technician_name: technician
        })
      });

      if (res.ok) {
        const mRes = await fetch('/api/v1/maintenance');
        setRequests(await mRes.json());
      } else {
        const data = await res.json();
        alert(`Failed to update status: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Pending': return styles.statusPending;
      case 'Approved': return styles.statusApproved;
      case 'In Progress': return styles.statusInProgress;
      case 'Resolved': return styles.statusResolved;
      case 'Rejected': return styles.statusRejected;
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Maintenance Management</h1>
      </header>

      <div className={styles.content}>
        <h2>Raise a Request</h2>
        <div className={styles.controls}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Asset</label>
            <select 
              className={styles.input}
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
            >
              <option value="">Select an asset...</option>
              {assets.map(a => (
                <option key={a.ID} value={a.ID}>{a.Name} ({a.AssetTag})</option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Priority</label>
            <select 
              className={styles.input}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
        <div className={styles.inputGroup} style={{ marginTop: '1rem' }}>
          <label className={styles.label}>Issue Description</label>
          <textarea 
            className={`${styles.input} ${styles.textarea}`}
            value={issueDesc}
            onChange={(e) => setIssueDesc(e.target.value)}
            placeholder="Describe the issue..."
          />
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button className={styles.btnPrimary} onClick={handleRaiseRequest}>
            Submit Request
          </button>
        </div>
        {error && <div className={styles.errorText}>{error}</div>}
      </div>

      <div className={styles.content}>
        <h2>Request Directory</h2>
        {loading ? (
          <div className={styles.emptyState}>Loading requests...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Asset</th>
                <th className={styles.th}>Issue</th>
                <th className={styles.th}>Priority</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Technician</th>
                <th className={styles.th}>Date</th>
                {(userRole === 'Admin' || userRole === 'AssetManager') && (
                  <th className={styles.th}>Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>No maintenance requests found.</td>
                </tr>
              )}
              {requests.map(req => (
                <tr key={req.ID}>
                  <td className={styles.td}>
                    {req.Asset ? `${req.Asset.Name} (${req.Asset.AssetTag})` : 'Unknown'}
                  </td>
                  <td className={styles.td}>{req.IssueDesc}</td>
                  <td className={styles.td}>{req.Priority}</td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${getStatusClass(req.Status)}`}>
                      {req.Status}
                    </span>
                  </td>
                  <td className={styles.td}>{req.TechnicianName || '--'}</td>
                  <td className={styles.td}>{new Date(req.CreatedAt).toLocaleDateString()}</td>
                  {(userRole === 'Admin' || userRole === 'AssetManager') && (
                    <td className={styles.td}>
                      <select 
                        className={styles.actionSelect}
                        value={req.Status}
                        onChange={(e) => handleStatusUpdate(req.ID, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approve</option>
                        <option value="Rejected">Reject</option>
                        <option value="In Progress">Mark In Progress</option>
                        <option value="Resolved">Resolve</option>
                      </select>
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
