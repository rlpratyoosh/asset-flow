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

interface User {
  ID: string;
  FullName: string;
  DepartmentID: string;
}

interface Department {
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

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allocateModalAsset, setAllocateModalAsset] = useState<Asset | null>(null);
  const [returnModalAsset, setReturnModalAsset] = useState<Asset | null>(null);
  const [allocateForm, setAllocateForm] = useState({ assigned_to_user_id: '', assigned_to_dept_id: '', expected_return_date: '' });
  const [returnNotes, setReturnNotes] = useState('');

  useEffect(() => {
    fetch('/api/v1/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setRole(data.role);
          if (['Admin', 'AssetManager', 'DepartmentHead'].includes(data.role)) {
            fetchDepsAndUsers();
          }
        }
      })
      .catch(console.error);

    fetchCategories();
    fetchAssets('');

    if (searchParams.get('register') === 'true') {
      setShowModal(true);
    }
  }, [searchParams]);

  const fetchDepsAndUsers = async () => {
    try {
      const [depRes, userRes] = await Promise.all([
        fetch('/api/v1/departments'),
        fetch('/api/v1/users')
      ]);
      if (depRes.ok) setDepartments(await depRes.json());
      if (userRes.ok) setUsers(await userRes.json());
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateModalAsset) return;
    try {
      const csrfRes = await fetch("/api/v1/csrf-token");
      if (!csrfRes.ok) throw new Error("Failed to get CSRF token");
      const { csrf_token } = await csrfRes.json();

      const payload: any = {};
      if (allocateForm.assigned_to_user_id) payload.assigned_to_user_id = allocateForm.assigned_to_user_id;
      if (allocateForm.assigned_to_dept_id) payload.assigned_to_dept_id = allocateForm.assigned_to_dept_id;
      if (allocateForm.expected_return_date) payload.expected_return_date = new Date(allocateForm.expected_return_date).toISOString();

      const res = await fetch(`/api/v1/assets/${allocateModalAsset.ID}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf_token },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAllocateModalAsset(null);
        fetchAssets(search);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to allocate asset');
      }
    } catch (err) { console.error(err); }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalAsset) return;
    try {
      const csrfRes = await fetch("/api/v1/csrf-token");
      if (!csrfRes.ok) throw new Error("Failed to get CSRF token");
      const { csrf_token } = await csrfRes.json();

      const res = await fetch(`/api/v1/assets/${returnModalAsset.ID}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf_token },
        body: JSON.stringify({ return_notes: returnNotes })
      });
      if (res.ok) {
        setReturnModalAsset(null);
        fetchAssets(search);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to return asset');
      }
    } catch (err) { console.error(err); }
  };

  const handleRequestTransfer = async (assetID: string) => {
    if (!confirm("Are you sure you want to request a transfer for this asset?")) return;
    try {
      const csrfRes = await fetch("/api/v1/csrf-token");
      if (!csrfRes.ok) throw new Error("Failed to get CSRF token");
      const { csrf_token } = await csrfRes.json();

      const res = await fetch(`/api/v1/assets/${assetID}/transfer`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrf_token }
      });
      if (res.ok) {
        alert("Transfer request submitted successfully.");
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to request transfer');
      }
    } catch (err) { console.error(err); }
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
                <th>Actions</th>
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
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      {asset.State === 'Available' && canRegisterAsset && (
                        <button className={styles.actionButton} onClick={() => { setAllocateForm({ assigned_to_user_id: '', assigned_to_dept_id: '', expected_return_date: '' }); setAllocateModalAsset(asset); }}>Allocate</button>
                      )}
                      {asset.State === 'Allocated' && canRegisterAsset && (
                        <button className={styles.secondaryButton} onClick={() => { setReturnNotes(''); setReturnModalAsset(asset); }}>Return</button>
                      )}
                      {asset.State === 'Allocated' && (
                        <button className={styles.secondaryButton} onClick={() => handleRequestTransfer(asset.ID)}>Request Transfer</button>
                      )}
                    </td>
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

      {allocateModalAsset && (
        <div className={styles.modalOverlay} onClick={() => setAllocateModalAsset(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>Allocate Asset: {allocateModalAsset.Name}</h2>
            <form onSubmit={handleAllocate} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Assign To User (Optional)</label>
                <select value={allocateForm.assigned_to_user_id} onChange={e => setAllocateForm({...allocateForm, assigned_to_user_id: e.target.value, assigned_to_dept_id: ''})}>
                  <option value="">None</option>
                  {users.map(u => <option key={u.ID} value={u.ID}>{u.FullName}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Assign To Department (Optional)</label>
                <select value={allocateForm.assigned_to_dept_id} onChange={e => setAllocateForm({...allocateForm, assigned_to_dept_id: e.target.value, assigned_to_user_id: ''})}>
                  <option value="">None</option>
                  {departments.map(d => <option key={d.ID} value={d.ID}>{d.Name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Expected Return Date (Optional)</label>
                <input type="datetime-local" value={allocateForm.expected_return_date} onChange={e => setAllocateForm({...allocateForm, expected_return_date: e.target.value})} />
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => setAllocateModalAsset(null)} className={styles.cancelButton}>Cancel</button>
                <button type="submit" className={styles.submitButton} disabled={!allocateForm.assigned_to_user_id && !allocateForm.assigned_to_dept_id}>Allocate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {returnModalAsset && (
        <div className={styles.modalOverlay} onClick={() => setReturnModalAsset(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>Return Asset: {returnModalAsset.Name}</h2>
            <form onSubmit={handleReturn} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Return Notes</label>
                <textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)} rows={3} required />
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => setReturnModalAsset(null)} className={styles.cancelButton}>Cancel</button>
                <button type="submit" className={styles.submitButton}>Confirm Return</button>
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
