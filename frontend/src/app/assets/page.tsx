"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

interface Asset {
  ID: string;
  AssetTag: string;
  Name: string;
  CategoryID: string;
  SerialNumber: string;
  AcquisitionDate: string;
  AcquisitionCost: number;
  Condition: string;
  Location: string;
  IsShared: boolean;
  State: string;
  Category?: {
    ID: string;
    Name: string;
  };
}

interface Category {
  ID: string;
  Name: string;
}

function AssetsPageContent() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    serial_number: '',
    acquisition_date: '',
    acquisition_cost: 0,
    condition: 'Good',
    location: '',
    photo_url: '',
    is_shared: false
  });

  useEffect(() => {
    fetch('/api/v1/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setRole(data.role);
      })
      .catch(console.error);

    fetchCategories();
    fetchAssets('');

    if (searchParams.get('register') === 'true') {
      setShowModal(true);
    }
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/v1/categories');
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssets = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/assets?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        setAssets(await res.json() || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssets(search);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const csrfRes = await fetch("/api/v1/csrf-token");
      if (!csrfRes.ok) throw new Error("Failed to get CSRF token");
      const { csrf_token } = await csrfRes.json();

      const formattedData = {
        ...formData,
        acquisition_cost: Number(formData.acquisition_cost),
        acquisition_date: formData.acquisition_date ? new Date(formData.acquisition_date).toISOString() : new Date().toISOString()
      };
      const res = await fetch('/api/v1/assets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf_token
        },
        body: JSON.stringify(formattedData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchAssets(search);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register asset');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const canRegisterAsset = role === 'Admin' || role === 'AssetManager';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Asset Directory</h1>
        {canRegisterAsset && (
          <button className={styles.primaryButton} onClick={() => setShowModal(true)}>+ Register Asset</button>
        )}
      </header>
      
      <main className={styles.content}>
        <form className={styles.searchBar} onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Search assets by tag, name, or serial number..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className={styles.searchButton}>Search</button>
        </form>
        
        {loading ? (
          <div className={styles.emptyState}>Loading assets...</div>
        ) : (
          <table className={styles.assetTable}>
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Condition</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>No assets found.</td>
                </tr>
              ) : (
                assets.map(asset => (
                  <tr key={asset.ID}>
                    <td>{asset.AssetTag}</td>
                    <td>{asset.Name}</td>
                    <td>{asset.Category?.Name || 'Unknown'}</td>
                    <td>
                      <span className={`${styles.badge} ${
                        asset.State === 'Available' ? styles.badgeAvailable :
                        asset.State === 'Allocated' ? styles.badgeAllocated :
                        styles.badgeMaintenance
                      }`}>
                        {asset.State}
                      </span>
                    </td>
                    <td>{asset.Condition}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </main>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>Register New Asset</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Asset Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Category</label>
                <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.ID} value={c.ID}>{c.Name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Serial Number</label>
                <input type="text" value={formData.serial_number} onChange={e => setFormData({...formData, serial_number: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Acquisition Date</label>
                <input type="date" value={formData.acquisition_date} onChange={e => setFormData({...formData, acquisition_date: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Acquisition Cost</label>
                <input type="number" step="0.01" value={formData.acquisition_cost} onChange={e => setFormData({...formData, acquisition_cost: parseFloat(e.target.value)})} />
              </div>
              <div className={styles.formGroup}>
                <label>Condition</label>
                <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Location</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>
                  <input type="checkbox" checked={formData.is_shared} onChange={e => setFormData({...formData, is_shared: e.target.checked})} />
                  {' '}Is Shared Resource?
                </label>
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelButton}>Cancel</button>
                <button type="submit" className={styles.submitButton}>Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssetsPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <AssetsPageContent />
    </React.Suspense>
  );
}
