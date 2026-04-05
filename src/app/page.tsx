'use client'
import { useEffect, useMemo, useState } from 'react'
import styles from './page.module.css'
import Link from 'next/link'
import { fetchGasJson } from '@/lib/gas-client'

interface HistoryRecord {
  Date: string;
  To: string;
  Subject: string;
  Attachment_URL: string;
  Status: string;
  CC?: string;
  Body_HTML?: string;
}

function getAttachmentLinks(rawValue: string) {
  return rawValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function Dashboard() {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<HistoryRecord | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterRange, setFilterRange] = useState<'all' | 'month' | 'week'>('all')
  const [searchTo, setSearchTo] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const itemsPerPage = 20

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const json = await fetchGasJson<HistoryRecord[]>('/api/gas?action=getHistory')
        if (json.status === 'success') {
          setHistory(json.data ?? [])
        } else {
          setError(json.message || 'Failed to load email history')
        }
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Error connecting to Google Sheets')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const filteredCount = useMemo(() => {
    if (filterRange === 'all') return history.length
    
    const now = new Date()
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(now.getDate() - 7)
    
    return history.filter(item => {
      const itemDate = new Date(item.Date)
      if (isNaN(itemDate.getTime())) return false
      
      if (filterRange === 'month') {
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
      }
      if (filterRange === 'week') {
        return itemDate >= oneWeekAgo
      }
      return true
    }).length
  }, [history, filterRange])

  // Filtered history (Global)
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      // Shorthand range filter (Quick Filter)
      if (filterRange !== 'all') {
        const itemDate = new Date(item.Date)
        if (isNaN(itemDate.getTime())) return false
        
        const now = new Date()
        if (filterRange === 'month') {
          if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) return false
        } else if (filterRange === 'week') {
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(now.getDate() - 7)
          if (itemDate < oneWeekAgo) return false
        }
      }

      // Date filter (Explicit)
      if (startDate || endDate) {
        const itemDate = new Date(item.Date)
        if (!isNaN(itemDate.getTime())) {
          if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            if (itemDate < start) return false
          }
          if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            if (itemDate > end) return false
          }
        }
      }
      
      // Recipient filter
      if (searchTo && !item.To.toLowerCase().includes(searchTo.toLowerCase())) {
        return false
      }
      
      return true
    })
  }, [history, filterRange, startDate, endDate, searchTo])

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredHistory.slice(start, start + itemsPerPage)
  }, [filteredHistory, currentPage])

  const selectedAttachments = useMemo(
    () => getAttachmentLinks(selectedEmail?.Attachment_URL || ''),
    [selectedEmail]
  )

  return (
    <div className={`animate-fade-in ${styles.dashboard}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>แดชบอร์ดจัดการอีเมล</h1>
          <p className={styles.subtitle}>ตรวจสอบประวัติการส่งอีเมลและเข้าถึงเครื่องมือการทำงาน</p>
        </div>
        <Link href="/compose" className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          เขียนอีเมลใหม่
        </Link>
      </header>

      <div className={styles.dashboardLayout}>
        <aside className={styles.sidebarCol}>
          <section className={styles.statsGrid}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div className={styles.statIcon} style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className={styles.statValue}>{filteredHistory.length}</h3>
              <p className={styles.statLabel}>จำนวนอีเมลที่ส่งแล้วทั้งหมด</p>
            </div>
          </section>
        </aside>

        <div className={styles.filterBar} style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <select 
              className={styles.filterSelect}
              value={filterRange}
              onChange={(e) => { setFilterRange(e.target.value as any); setCurrentPage(1); }}
              style={{ minWidth: '110px' }}
            >
              <option value="all">ช่วงเวลาด่ว่น</option>
              <option value="month">เดือนนี้</option>
              <option value="week">สัปดาห์นี้</option>
            </select>

            <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
              <input 
                type="date" 
                className={styles.filterDate} 
                value={startDate} 
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>ถึง</span>
              <input 
                type="date" 
                className={styles.filterDate} 
                value={endDate} 
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <input 
              type="text" 
              className={styles.searchBox} 
              placeholder="ค้นหาผู้รับ..." 
              value={searchTo} 
              onChange={(e) => { setSearchTo(e.target.value); setCurrentPage(1); }} 
            />
            <button className={styles.previewButton} style={{ borderColor: 'transparent' }} onClick={() => { setFilterRange('all'); setStartDate(''); setEndDate(''); setSearchTo(''); setCurrentPage(1); }}>
              รีเซ็ต
            </button>
          </div>
        </div>
      </div>

      <section className={styles.recentSection}>
        <div className={styles.sectionHeader} style={{ marginBottom: '0.5rem' }}>
          <h2 className={styles.sectionTitle}>ประวัติการส่งอีเมล</h2>
        </div>

        <div className={`card ${styles.tableCard}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ผู้รับ</th>
                <th>หัวข้อ</th>
                <th>วันที่</th>
                <th>ไฟล์แนบ</th>
                <th>สถานะ</th>
                <th>ดูตัวอย่าง</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>กำลังโหลดประวัติ...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--error)' }}>{error}</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>ไม่พบข้อมูลในชีท 'History'</td>
                </tr>
              ) : currentData.map((log, i) => {
                const attachmentLinks = getAttachmentLinks(log.Attachment_URL || '')
                return (
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
                      {attachmentLinks.length > 0 ? (
                        <a href={attachmentLinks[0]} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                          {attachmentLinks.length > 1 ? `ดูไฟล์ (${attachmentLinks.length})` : 'ดูไฟล์'}
                        </a>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${log.Status === 'Success' ? styles.badgeSuccess : styles.badgePending}`}>
                        {log.Status || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.previewButton}
                        onClick={() => setSelectedEmail(log)}
                        disabled={!log.Body_HTML}
                      >
                        ดูตัวอย่าง
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button 
              className={styles.paginationBtn}
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)}
            >
              ก่อนหน้า
            </button>
            <span className={styles.pageInfo}>
              หน้า {currentPage} จาก {totalPages}
            </span>
            <button 
              className={styles.paginationBtn}
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => p + 1)}
            >
              ถัดไป
            </button>
          </div>
        )}
      </section>

      {selectedEmail && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEmail(null)}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>ตัวอย่างอีเมล</h3>
                <p className={styles.modalSubtitle}>{selectedEmail.Subject || 'ไม่มีหัวข้อ'}</p>
              </div>
              <button type="button" className={styles.modalClose} onClick={() => setSelectedEmail(null)}>
                ปิดหน้าต่าง
              </button>
            </div>

            <div className={styles.modalMeta}>
              <div><strong>ถึง:</strong> {selectedEmail.To || '-'}</div>
              <div><strong>สำเนา (CC):</strong> {selectedEmail.CC || '-'}</div>
              <div><strong>วันที่ส่ง:</strong> {selectedEmail.Date ? new Date(selectedEmail.Date).toLocaleString() : '-'}</div>
            </div>

            {selectedAttachments.length > 0 && (
              <div className={styles.attachmentList}>
                {selectedAttachments.map((link, index) => (
                  <a key={`${link}-${index}`} href={link} target="_blank" rel="noreferrer" className={styles.attachmentPill}>
                    ไฟล์แนบ {index + 1}
                  </a>
                ))}
              </div>
            )}

            <div className={styles.previewFrame} dangerouslySetInnerHTML={{ __html: selectedEmail.Body_HTML || '<p>ไม่มีตัวอย่างแสดงผล</p>' }} />
          </div>
        </div>
      )}
    </div>
  )
}
