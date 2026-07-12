import React from 'react';
import styles from './page.module.css';
import { cookies } from 'next/headers';

async function fetchUserRole() {
  const cookieStore = cookies();
  const token = cookieStore.get('access_token');
  
  if (!token) return null;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/me`, {
      headers: {
        Cookie: `access_token=${token.value}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      return data.role;
    }
  } catch (error) {
    console.error('Failed to fetch user role:', error);
  }
  return null;
}

export default async function AssetsPage() {
  const role = await fetchUserRole();
  const canRegisterAsset = role === 'Admin' || role === 'AssetManager';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Asset Directory</h1>
        {canRegisterAsset && (
          <button className={styles.primaryButton}>+ Register Asset</button>
        )}
      </header>
      
      <main className={styles.content}>
        <div className={styles.searchBar}>
          <input type="text" placeholder="Search assets by tag, name, or serial number..." className={styles.searchInput} />
          <button className={styles.searchButton}>Search</button>
        </div>
        
        <table className={styles.assetTable}>
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className={styles.emptyState}>No assets found.</td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  );
}
