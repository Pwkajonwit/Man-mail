'use client'
import { useState, useEffect } from 'react'
import styles from './contacts.module.css'

interface Contact {
  id?: string;
  name: string;
  email: string;
  department: string;
  status: string;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Contact>({ name: '', email: '', department: '', status: 'Active' })

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const url = process.env.NEXT_PUBLIC_GAS_URL
      if (!url) {
        setError('Please setup NEXT_PUBLIC_GAS_URL in .env.local')
        setLoading(false)
        return
      }

      const res = await fetch(`${url}?action=getContacts`)
      const json = await res.json()
      if (json.status === 'success') {
        setContacts(json.data)
      } else {
        setError('Failed to load contacts')
      }
    } catch (err) {
      console.error(err)
      setError('Error connecting to Google Sheets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const handleOpenForm = (contact?: Contact) => {
    if (contact) {
      setFormData(contact)
    } else {
      setFormData({ name: '', email: '', department: '', status: 'Active' })
    }
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = process.env.NEXT_PUBLIC_GAS_URL!
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveRecord',
          sheetName: 'Contacts',
          record: formData
        })
      })
      const data = await res.json()
      if (data.status === 'success') {
        setIsFormOpen(false)
        fetchContacts()
      } else {
        alert('Error saving contact')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving contact')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string | undefined) => {
    if (!id || !confirm('Are you sure you want to delete this contact?')) return
    
    try {
      const url = process.env.NEXT_PUBLIC_GAS_URL!
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteRecord',
          sheetName: 'Contacts',
          id
        })
      })
      const data = await res.json()
      if (data.status === 'success') {
        fetchContacts()
      } else {
        alert('Error deleting contact')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting contact')
    }
  }

  return (
    <div className={`animate-fade-in ${styles.container}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Contacts</h1>
          <p className={styles.subtitle}>Manage your email recipients.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenForm()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Contact
        </button>
      </header>

      {/* Inline Form Card */}
      {isFormOpen && (
        <form onSubmit={handleSave} className={`card animate-fade-in`} style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>{formData.id ? 'Edit Contact' : 'New Contact'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="label">Name</label>
              <input type="text" className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="label">Department</label>
              <input type="text" className="input-field" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-primary" style={{ background: 'transparent', color: 'var(--muted)', boxShadow: 'none' }} onClick={() => setIsFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Contact'}</button>
          </div>
        </form>
      )}

      <div className={`card ${styles.tableCard}`}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading contacts...</p>
          </div>
        ) : error ? (
          <div className={styles.loadingState}>
            <p style={{color: 'var(--error)'}}>{error}</p>
          </div>
        ) : contacts.length === 0 ? (
           <div className={styles.loadingState}>
             <p>No contacts found.</p>
             <button className="btn-primary" onClick={() => handleOpenForm()}>Add First Contact</button>
           </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, i) => (
                <tr key={contact.id || i}>
                  <td>
                    <div className={styles.userRef}>
                      <div className={styles.avatarRef} style={{ background: `hsl(${i * 60 + 200}, 70%, 60%)` }}>
                        {String(contact.name || '?').charAt(0)}
                      </div>
                      <div>
                        <div className={styles.name}>{contact.name}</div>
                        <div className={styles.email}>{contact.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={styles.departmentBadge}>{contact.department || 'N/A'}</span></td>
                  <td>
                    <span className={`${styles.statusBadge} ${contact.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                      {contact.status || 'Active'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className={styles.actionBtn} onClick={() => handleOpenForm(contact)} title="Edit">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnDestructive}`} onClick={() => handleDelete(contact.id)} title="Delete">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
