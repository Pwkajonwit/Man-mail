'use client'
import { useState, useEffect } from 'react'
import styles from './page.module.css'
import Link from 'next/link'

interface HistoryRecord {
  Date: string;
  To: string;
  Subject: string;
  Attachment_URL: string;
  Status: string;
}

export default function Dashboard() {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_GAS_URL
        if (!url) return setLoading(false)

        const res = await fetch(`${url}?action=getHistory`)
        const json = await res.json()
        if (json.status === 'success') {
          setHistory(json.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  return (
    <div className={`animate-fade-in ${styles.dashboard}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, Admin 👋</h1>
          <p className={styles.subtitle}>Here is your email dispatch history.</p>
        </div>
        <Link href="/compose" className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Email
        </Link>
      </header>
      
      <section className={styles.statsGrid}>
        <div className="card">
          <div className={styles.statIcon} style={{ background: '#e0e7ff', color: '#4f46e5' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className={styles.statValue}>{history.length}</h3>
          <p className={styles.statLabel}>Total Emails Sent</p>
        </div>
      </section>

      <section className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Email History</h2>
          <button className={styles.viewAll}>View 'History' Sheet</button>
        </div>
        
        <div className={`card ${styles.tableCard}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Attachment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>Loading history...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>No logs found in 'History' sheet.</td>
                </tr>
              ) : history.map((log, i) => (
                <tr key={i}>
                  <td>
                    <div className={styles.userRef}>
                      <div className={styles.avatarRef} style={{ background: 'var(--primary)' }}>
                        {String(log.To || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.email}>{log.To}</div>
                    </div>
                  </td>
                  <td className={styles.subject}>{log.Subject}</td>
                  <td className={styles.date}>{log.Date ? new Date(log.Date).toLocaleString() : ''}</td>
                  <td>
                     {log.Attachment_URL && log.Attachment_URL !== '' ? (
                       <a href={log.Attachment_URL} target="_blank" rel="noreferrer" style={{color: 'var(--primary)', textDecoration: 'underline'}}>View File</a>
                     ) : '-'}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${log.Status === 'Success' ? styles.badgeSuccess : styles.badgePending}`}>
                      {log.Status || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
