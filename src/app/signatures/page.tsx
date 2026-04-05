'use client'
import { useState, useEffect } from 'react'
import styles from '../contacts/contacts.module.css'
import { fetchGasJson } from '@/lib/gas-client'

interface Signature {
  id?: string;
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  image_url: string;
}

export default function Signatures() {
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Signature>({
    name: '',
    title: '',
    company: '',
    phone: '',
    email: '',
    image_url: ''
  })

  const fetchSignatures = async () => {
    try {
      setLoading(true)
      const json = await fetchGasJson<Signature[]>('/api/gas?action=getSignatures')
      if (json.status === 'success') {
        setSignatures(json.data ?? [])
      } else {
        setError(json.message || 'Failed to load signatures')
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error connecting to Google Sheets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSignatures()
  }, [])

  const handleOpenForm = (sig?: Signature) => {
    if (sig) {
      setFormData(sig)
    } else {
      setFormData({ name: '', title: '', company: '', phone: '', email: '', image_url: '' })
    }
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = await fetchGasJson('/api/gas', {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveRecord',
          sheetName: 'Signatures',
          record: formData
        })
      })
      if (data.status === 'success') {
        setIsFormOpen(false)
        fetchSignatures()
      } else {
        alert(data.message || 'Error saving signature')
      }
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Error saving signature')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string | undefined) => {
    if (!id || !confirm('Are you sure you want to delete this signature?')) return
    
    try {
      const data = await fetchGasJson('/api/gas', {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteRecord',
          sheetName: 'Signatures',
          id
        })
      })
      if (data.status === 'success') {
        fetchSignatures()
      } else {
        alert(data.message || 'Error deleting signature')
      }
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Error deleting signature')
    }
  }

  return (
    <div className={`animate-fade-in ${styles.container}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Signatures & Images</h1>
          <p className={styles.subtitle}>Manage your email signatures and reusable images.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenForm()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Signature
        </button>
      </header>

      {isFormOpen && (
        <form onSubmit={handleSave} className="card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>{formData.id ? 'Edit Signature' : 'New Signature'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="label">Signature Name (Placeholder)</label>
              <input type="text" className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. CEO Signature" />
            </div>
            <div>
              <label className="label">Job Title</label>
              <input type="text" className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
              <label className="label">Company</label>
              <input type="text" className="input-field" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="text" className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="label">Image URL</label>
              <input type="text" className="input-field" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-primary" style={{ background: 'transparent', color: 'var(--muted)', borderColor: 'var(--border)' }} onClick={() => setIsFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Signature'}</button>
          </div>
        </form>
      )}

      <div className={`card ${styles.tableCard}`}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading signatures...</p>
          </div>
        ) : error ? (
          <div className={styles.loadingState}>
            <p style={{color: 'var(--error)'}}>{error}</p>
          </div>
        ) : signatures.length === 0 ? (
           <div className={styles.loadingState}>
             <p>No signatures found.</p>
             <button className="btn-primary" onClick={() => handleOpenForm()}>Add First Signature</button>
           </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Signature Name</th>
                <th>Company & Title</th>
                <th>Image</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {signatures.map((sig, i) => (
                <tr key={sig.id || i}>
                  <td>
                    <div className={styles.name}>{sig.name}</div>
                    <div className={styles.email}>{sig.email}</div>
                  </td>
                  <td>
                    <div className={styles.name}>{sig.company || '-'}</div>
                    <div className={styles.email}>{sig.title || '-'}</div>
                  </td>
                  <td>
                    {sig.image_url ? (
                      <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={sig.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <span className={styles.departmentBadge}>No Image</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className={styles.actionBtn} onClick={() => handleOpenForm(sig)} title="Edit">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnDestructive}`} onClick={() => handleDelete(sig.id)} title="Delete">
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
