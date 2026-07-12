"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Department {
  ID: string;
  Name: string;
  DepartmentHeadID: string | null;
  ParentDepartmentID: string | null;
  Status: string;
}

interface Category {
  ID: string;
  Name: string;
  Description: string;
  CustomFields: string;
}

interface User {
  ID: string;
  FullName: string;
  Username: string;
  DepartmentID: string | null;
  Role: string;
  Status: string;
}

export default function OrganizationSetupPage() {
  const [activeTab, setActiveTab] = useState('Departments');
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [addingItem, setAddingItem] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'Departments') {
        const res = await fetch('/api/v1/departments');
        if (res.ok) setDepartments(await res.json());
      } else if (activeTab === 'Categories') {
        const res = await fetch('/api/v1/categories');
        if (res.ok) setCategories(await res.json());
      } else if (activeTab === 'Employee') {
        const res = await fetch('/api/v1/users');
        if (res.ok) setUsers(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCsrfToken = async () => {
    const res = await fetch("/api/v1/csrf-token");
    if (!res.ok) throw new Error("Failed to fetch CSRF token");
    const { csrf_token } = await res.json();
    return csrf_token;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    let endpoint = '';
    if (activeTab === 'Departments') endpoint = `/api/v1/departments/${id}`;
    if (activeTab === 'Categories') endpoint = `/api/v1/categories/${id}`;
    if (activeTab === 'Employee') endpoint = `/api/v1/users/${id}`;

    try {
      const csrf_token = await getCsrfToken();
      const res = await fetch(endpoint, { 
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf_token }
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let endpoint = '';
    
    if (activeTab === 'Departments') endpoint = `/api/v1/departments/${editingItem.ID}`;
    if (activeTab === 'Categories') endpoint = `/api/v1/categories/${editingItem.ID}`;
    if (activeTab === 'Employee') endpoint = `/api/v1/users/${editingItem.ID}/role`; 

    const body = { ...editingItem };

    try {
      const csrf_token = await getCsrfToken();
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf_token
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setEditingItem(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let endpoint = '';
    
    if (activeTab === 'Departments') endpoint = `/api/v1/departments`;
    if (activeTab === 'Categories') endpoint = `/api/v1/categories`;
    if (activeTab === 'Employee') endpoint = `/api/v1/register`;

    const body = { ...addingItem };

    try {
      const csrf_token = await getCsrfToken();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf_token
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setAddingItem(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'Departments' ? styles.active : ''}`}
            onClick={() => setActiveTab('Departments')}
          >
            Departments
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'Categories' ? styles.active : ''}`}
            onClick={() => setActiveTab('Categories')}
          >
            Categories
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'Employee' ? styles.active : ''}`}
            onClick={() => setActiveTab('Employee')}
          >
            Employee Directory
          </button>
        </div>
        <button 
          className={styles.addBtn}
          onClick={() => {
            if (activeTab === 'Departments') setAddingItem({ name: '', status: 'Active' });
            if (activeTab === 'Categories') setAddingItem({ name: '', description: '' });
            if (activeTab === 'Employee') setAddingItem({ full_name: '', username: '', password: '', role: 'Employee', status: 'Active' });
          }}
        >
          + Add
        </button>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>Loading {activeTab}...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              {activeTab === 'Departments' && (
                <tr>
                  <th className={styles.th}>Department Name</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              )}
              {activeTab === 'Categories' && (
                <tr>
                  <th className={styles.th}>Category Name</th>
                  <th className={styles.th}>Description</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              )}
              {activeTab === 'Employee' && (
                <tr>
                  <th className={styles.th}>Full Name</th>
                  <th className={styles.th}>Username</th>
                  <th className={styles.th}>Role</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === 'Departments' && departments.map((dept) => (
                <tr key={dept.ID} className={styles.tr}>
                  <td className={styles.td}>{dept.Name}</td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${dept.Status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                      {dept.Status}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <button className={styles.editBtn} onClick={() => setEditingItem({...dept, name: dept.Name, status: dept.Status})}>Edit</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(dept.ID)}>Delete</button>
                  </td>
                </tr>
              ))}

              {activeTab === 'Categories' && categories.map((cat) => (
                <tr key={cat.ID} className={styles.tr}>
                  <td className={styles.td}>{cat.Name}</td>
                  <td className={styles.td}>{cat.Description || '--'}</td>
                  <td className={styles.td}>
                    <button className={styles.editBtn} onClick={() => setEditingItem({...cat, name: cat.Name, description: cat.Description})}>Edit</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(cat.ID)}>Delete</button>
                  </td>
                </tr>
              ))}

              {activeTab === 'Employee' && users.map((user) => (
                <tr key={user.ID} className={styles.tr}>
                  <td className={styles.td}>{user.FullName}</td>
                  <td className={styles.td}>{user.Username}</td>
                  <td className={styles.td}>{user.Role}</td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${user.Status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                      {user.Status || 'Active'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <button className={styles.editBtn} onClick={() => setEditingItem({
                      ID: user.ID, 
                      role: user.Role, 
                      department_id: user.DepartmentID, 
                      status: user.Status || 'Active'
                    })}>Edit Role/Status</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(user.ID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingItem && (
        <div className={styles.modalOverlay} onClick={() => setEditingItem(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>Edit {activeTab.slice(0, -1)}</h2>
            <form onSubmit={handleEditSubmit} className={styles.form}>
              
              {activeTab === 'Departments' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Name</label>
                    <input type="text" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Status</label>
                    <select value={editingItem.status} onChange={e => setEditingItem({...editingItem, status: e.target.value})}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'Categories' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Name</label>
                    <input type="text" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Description</label>
                    <input type="text" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                  </div>
                </>
              )}

              {activeTab === 'Employee' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Role</label>
                    <select value={editingItem.role} onChange={e => setEditingItem({...editingItem, role: e.target.value})}>
                      <option value="Admin">Admin</option>
                      <option value="AssetManager">AssetManager</option>
                      <option value="DepartmentHead">DepartmentHead</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Status</label>
                    <select value={editingItem.status} onChange={e => setEditingItem({...editingItem, status: e.target.value})}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}

              <div className={styles.formActions}>
                <button type="button" onClick={() => setEditingItem(null)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addingItem && (
        <div className={styles.modalOverlay} onClick={() => setAddingItem(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>Add {activeTab.slice(0, activeTab === 'Categories' ? -3 : activeTab === 'Employee' ? 0 : -1)}</h2>
            <form onSubmit={handleAddSubmit} className={styles.form}>
              
              {activeTab === 'Departments' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Name</label>
                    <input required type="text" value={addingItem.name} onChange={e => setAddingItem({...addingItem, name: e.target.value})} />
                  </div>
                </>
              )}

              {activeTab === 'Categories' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Name</label>
                    <input required type="text" value={addingItem.name} onChange={e => setAddingItem({...addingItem, name: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Description</label>
                    <input required type="text" value={addingItem.description} onChange={e => setAddingItem({...addingItem, description: e.target.value})} />
                  </div>
                </>
              )}

              {activeTab === 'Employee' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input required type="text" value={addingItem.full_name} onChange={e => setAddingItem({...addingItem, full_name: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Username</label>
                    <input required type="text" value={addingItem.username} onChange={e => setAddingItem({...addingItem, username: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Password</label>
                    <input required type="password" value={addingItem.password} onChange={e => setAddingItem({...addingItem, password: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Role</label>
                    <select value={addingItem.role} onChange={e => setAddingItem({...addingItem, role: e.target.value})}>
                      <option value="Admin">Admin</option>
                      <option value="AssetManager">AssetManager</option>
                      <option value="DepartmentHead">DepartmentHead</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>
                </>
              )}

              <div className={styles.formActions}>
                <button type="button" onClick={() => setAddingItem(null)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
