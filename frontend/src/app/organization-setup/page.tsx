"use client";

import { useState } from 'react';
import styles from './page.module.css';

// Mock data based on the wireframe since specific API endpoints 
// for organization setup were not provided in the docs.
const mockDepartments = [
  {
    id: 'dept-1',
    name: 'Engineering',
    head: 'aditi rao',
    parent: '--',
    status: 'Active'
  },
  {
    id: 'dept-2',
    name: 'Facilities',
    head: 'rohan mehta',
    parent: '--',
    status: 'Active'
  },
  {
    id: 'dept-3',
    name: 'Field ops (east)',
    head: 'sana iqbal',
    parent: 'Field Ops',
    status: 'Inactive'
  }
];

export default function OrganizationSetupPage() {
  const [activeTab, setActiveTab] = useState('Departments');

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
            Employee
          </button>
        </div>
        <button className={styles.addBtn}>+ Add</button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Department</th>
              <th className={styles.th}>Head</th>
              <th className={styles.th}>Parent Dept</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockDepartments.map((dept) => (
              <tr key={dept.id} className={styles.tr}>
                <td className={styles.td}>{dept.name}</td>
                <td className={styles.td}>{dept.head}</td>
                <td className={styles.td}>{dept.parent}</td>
                <td className={styles.td}>
                  <span className={`${styles.statusBadge} ${dept.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                    {dept.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footerNote}>
        Editing a department here also drives the picklist in Screen 4 & 5
      </div>
    </div>
  );
}
