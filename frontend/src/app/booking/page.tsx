"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Booking {
  ID: string;
  AssetID: string;
  BookedByID: string;
  StartTime: string;
  EndTime: string;
  Status: string;
}

interface Asset {
  ID: string;
  Name: string;
  AssetTag: string;
  IsShared: boolean;
}

export default function BookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [meRes, assetsRes, bookingsRes] = await Promise.all([
          fetch('/api/v1/me'),
          fetch('/api/v1/assets'),
          fetch('/api/v1/bookings')
        ]);

        if (meRes.ok) {
          const me = await meRes.json();
          setUserId(me.user_id);
          setUserRole(me.role);
        }

        if (assetsRes.ok) {
          const allAssets = await assetsRes.json();
          setAssets(allAssets.filter((a: Asset) => a.IsShared));
        }

        if (bookingsRes.ok) {
          setBookings(await bookingsRes.json());
        }
      } catch (err) {
        console.error('Failed to initialize booking page', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleBook = async () => {
    setError('');
    if (!selectedAsset || !startTime || !endTime) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: selectedAsset,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString()
        })
      });

      if (res.ok) {
        // Refresh bookings
        const bRes = await fetch('/api/v1/bookings');
        setBookings(await bRes.json());
        setStartTime('');
        setEndTime('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to book resource');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
        method: 'PUT'
      });
      if (res.ok) {
        // Refresh bookings
        const bRes = await fetch('/api/v1/bookings');
        setBookings(await bRes.json());
      } else {
        alert("Failed to cancel booking.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Upcoming': return styles.statusUpcoming;
      case 'Ongoing': return styles.statusOngoing;
      case 'Completed': return styles.statusCompleted;
      case 'Cancelled': return styles.statusCancelled;
      default: return '';
    }
  };

  const getAssetName = (id: string) => {
    const asset = assets.find(a => a.ID === id);
    return asset ? `${asset.Name} (${asset.AssetTag})` : id;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Resource Booking</h1>
      </header>

      <div className={styles.content}>
        <h2>Book a Shared Resource</h2>
        <div className={styles.controls}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Resource</label>
            <select 
              className={styles.input}
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
            >
              <option value="">Select a resource...</option>
              {assets.map(a => (
                <option key={a.ID} value={a.ID}>{a.Name} ({a.AssetTag})</option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Start Time</label>
            <input 
              type="datetime-local" 
              className={styles.input}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>End Time</label>
            <input 
              type="datetime-local" 
              className={styles.input}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <button className={styles.btnPrimary} onClick={handleBook}>
            Book Slot
          </button>
        </div>
        {error && <div className={styles.errorText}>{error}</div>}
      </div>

      <div className={styles.content}>
        <h2>Schedule Overview</h2>
        {loading ? (
          <div className={styles.emptyState}>Loading schedule...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Resource</th>
                <th className={styles.th}>Start Time</th>
                <th className={styles.th}>End Time</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>No bookings found.</td>
                </tr>
              )}
              {bookings.map(b => (
                <tr key={b.ID}>
                  <td className={styles.td}>{getAssetName(b.AssetID)}</td>
                  <td className={styles.td}>{new Date(b.StartTime).toLocaleString()}</td>
                  <td className={styles.td}>{new Date(b.EndTime).toLocaleString()}</td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${getStatusClass(b.Status)}`}>
                      {b.Status}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {b.Status === 'Upcoming' && (b.BookedByID === userId || userRole === 'Admin' || userRole === 'AssetManager') && (
                      <button className={styles.btnDanger} onClick={() => handleCancel(b.ID)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
