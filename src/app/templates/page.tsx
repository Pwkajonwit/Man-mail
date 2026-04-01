'use client'
import { useState, useEffect } from 'react'
import styles from '../contacts/contacts.module.css' // Reuse similar elegant styles

interface Template {
  id?: string;
  title: string;
  subject: string;
  body: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Template>({ title: '', subject: '', body: '' })

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const url = process.env.NEXT_PUBLIC_GAS_URL
      if (!url) {
        setError('Please setup NEXT_PUBLIC_GAS_URL in .env.local')
        setLoading(false)
        return
      }

      const res = await fetch(`${url}?action=getTemplates`)
      const json = await res.json()
      if (json.status === 'success') {
        setTemplates(json.data)
      } else {
        setError('Failed to load templates')
      }
    } catch (err) {
      console.error(err)
      setError('Error connecting to Google Sheets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleOpenForm = (template?: Template) => {
    if (template) {
      setFormData(template)
    } else {
      setFormData({ title: '', subject: '', body: '' })
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
          sheetName: 'Templates',
          record: formData
        })
      })
      const data = await res.json()
      if (data.status === 'success') {
        setIsFormOpen(false)
        fetchTemplates()
      } else {
        alert('Error saving template')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string | undefined) => {
    if (!id || !confirm('Are you sure you want to delete this template?')) return
    
    try {
      const url = process.env.NEXT_PUBLIC_GAS_URL!
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteRecord',
          sheetName: 'Templates',
          id
        })
      })
      const data = await res.json()
      if (data.status === 'success') {
        fetchTemplates()
      } else {
        alert('Error deleting template')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting template')
    }
  }

  return (
    <div className={`animate-fade-in ${styles.container}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Email Templates</h1>
          <p className={styles.subtitle}>Create and manage reusable email drafts.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenForm()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Template
        </button>
      </header>

      {/* Inline Form Card */}
      {isFormOpen && (
         // Use double wrapping div for easy styling without layout conflict
        <div style={{ paddingBottom: '2rem' }}>
          <form onSubmit={handleSave} className={`card animate-fade-in`}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>{formData.id ? 'Edit Template' : 'New Template'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="label">Template Title</label>
                <input type="text" className="input-field" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g., Monthly Report" />
              </div>
              <div>
                <label className="label">Email Subject</label>
                <input type="text" className="input-field" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Subject line..." />
              </div>
              <div>
                <label className="label">Body (Supports HTML)</label>
                <textarea className="input-field" rows={8} style={{ resize: 'vertical' }} value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})} placeholder="<p>Hello...</p>"></textarea>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-primary" style={{ background: 'transparent', color: 'var(--muted)', boxShadow: 'none' }} onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Template'}</button>
            </div>
          </form>
        </div>
      )}

      <div className={`card ${styles.tableCard}`}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading templates...</p>
          </div>
        ) : error ? (
          <div className={styles.loadingState}>
            <p style={{color: 'var(--error)'}}>{error}</p>
          </div>
        ) : templates.length === 0 ? (
           <div className={styles.loadingState}>
             <p>No templates found.</p>
             <button className="btn-primary" onClick={() => handleOpenForm()}>Create First Template</button>
           </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title & Subject</th>
                <th>Preview</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template, i) => (
                <tr key={template.id || i}>
                  <td style={{ width: '30%' }}>
                    <div className={styles.name}>{template.title}</div>
                    <div className={styles.email} style={{ marginTop: '0.25rem' }}>{template.subject}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--muted)', fontSize: '0.875rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {template.body.replace(/<[^>]+>/g, '') /* Very basic strip HTML for preview */}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className={styles.actionBtn} onClick={() => handleOpenForm(template)} title="Edit">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnDestructive}`} onClick={() => handleDelete(template.id)} title="Delete">
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
