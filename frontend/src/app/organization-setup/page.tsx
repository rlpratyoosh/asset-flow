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

  useEffect(() => {
    async function fetchData() {
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
    }

    fetchData();
  }, [activeTab]);

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
        <button className={styles.addBtn}>+ Add</button>
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
                  <th className={styles.th}>Head ID</th>
                  <th className={styles.th}>Parent Dept ID</th>
                  <th className={styles.th}>Status</th>
                </tr>
              )}
              {activeTab === 'Categories' && (
                <tr>
                  <th className={styles.th}>Category Name</th>
                  <th className={styles.th}>Description</th>
                  <th className={styles.th}>Custom Fields</th>
                </tr>
              )}
              {activeTab === 'Employee' && (
                <tr>
                  <th className={styles.th}>Full Name</th>
                  <th className={styles.th}>Username</th>
                  <th className={styles.th}>Role</th>
                  <th className={styles.th}>Dept ID</th>
                  <th className={styles.th}>Status</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === 'Departments' && departments.length === 0 && (
                <tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>No departments found</td></tr>
              )}
              {activeTab === 'Departments' && departments.map((dept) => (
                <tr key={dept.ID} className={styles.tr}>
                  <td className={styles.td}>{dept.Name}</td>
                  <td className={styles.td}>{dept.DepartmentHeadID || '--'}</td>
                  <td className={styles.td}>{dept.ParentDepartmentID || '--'}</td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${dept.Status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                      {dept.Status}
                    </span>
                  </td>
                </tr>
              ))}

              {activeTab === 'Categories' && categories.length === 0 && (
                <tr><td colSpan={3} style={{textAlign: 'center', padding: '2rem'}}>No categories found</td></tr>
              )}
              {activeTab === 'Categories' && categories.map((cat) => (
                <tr key={cat.ID} className={styles.tr}>
                  <td className={styles.td}>{cat.Name}</td>
                  <td className={styles.td}>{cat.Description || '--'}</td>
                  <td className={styles.td}>{cat.CustomFields || '--'}</td>
                </tr>
              ))}

              {activeTab === 'Employee' && users.length === 0 && (
                <tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>No employees found</td></tr>
              )}
              {activeTab === 'Employee' && users.map((user) => (
                <tr key={user.ID} className={styles.tr}>
                  <td className={styles.td}>{user.FullName}</td>
                  <td className={styles.td}>{user.Username}</td>
                  <td className={styles.td}>{user.Role}</td>
                  <td className={styles.td}>{user.DepartmentID || '--'}</td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${user.Status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                      {user.Status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.footerNote}>
        Managing {activeTab.toLowerCase()} drives the picklist in other screens
      </div>
    </div>
  );
}
