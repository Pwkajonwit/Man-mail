'use client'
import { useEffect, useState } from 'react'
import styles from '../contacts/contacts.module.css'
import {
  buildEmailHtml,
  buildTemplateExcerpt,
  createEmptyTemplate,
  type EmailTemplateRecord,
} from '@/lib/email-template'
import { fetchGasJson } from '@/lib/gas-client'

export default function Templates() {
  const [templates, setTemplates] = useState<EmailTemplateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [signatures, setSignatures] = useState<any[]>([])
  const [formData, setFormData] = useState<EmailTemplateRecord>(createEmptyTemplate())

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const json = await fetchGasJson<EmailTemplateRecord[]>('/api/gas?action=getTemplates')
      if (json.status === 'success') {
        setTemplates(json.data ?? [])
      } else {
        setError(json.message || 'Failed to load templates')
      }
    } catch (fetchError) {
      console.error(fetchError)
      setError(fetchError instanceof Error ? fetchError.message : 'Error connecting to Google Sheets')
    } finally {
      setLoading(false)
    }
  }

  const fetchSignatures = async () => {
    try {
      const json = await fetchGasJson<any[]>('/api/gas?action=getSignatures')
      if (json.status === 'success') {
        setSignatures(json.data ?? [])
      }
    } catch (err) {
      console.error('Failed to fetch signatures', err)
    }
  }

  useEffect(() => {
    fetchTemplates()
    fetchSignatures()
  }, [])

  const handleOpenForm = (template?: EmailTemplateRecord) => {
    const nextTemplate = template ? { ...createEmptyTemplate(), ...template } : createEmptyTemplate()
    setFormData(nextTemplate)
    setIsFormOpen(true)
  }

  const updateField = (field: keyof EmailTemplateRecord, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    try {
      const data = await fetchGasJson('/api/gas', {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveRecord',
          sheetName: 'Templates',
          record: formData,
        }),
      })
      if (data.status === 'success') {
        setIsFormOpen(false)
        fetchTemplates()
      } else {
        alert(data.message || 'Error saving template')
      }
    } catch (saveError) {
      console.error(saveError)
      alert(saveError instanceof Error ? saveError.message : 'Error saving template')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectSignature = (sigId: string) => {
    const sig = signatures.find(s => String(s.id) === sigId)
    if (sig) {
      setFormData(prev => ({
        ...prev,
        signature_name: sig.name || '',
        signature_title: sig.title || '',
        signature_company: sig.company || '',
        signature_phone: sig.phone || '',
        signature_email: sig.email || '',
        image_url: sig.image_url || ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        signature_name: '',
        signature_title: '',
        signature_company: '',
        signature_phone: '',
        signature_email: '',
        image_url: ''
      }))
    }
  }

  const handleDelete = async (id: string | undefined) => {
    if (!id || !confirm('Are you sure you want to delete this template?')) return

    try {
      const data = await fetchGasJson('/api/gas', {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteRecord',
          sheetName: 'Templates',
          id,
        }),
      })
      if (data.status === 'success') {
        fetchTemplates()
      } else {
        alert(data.message || 'Error deleting template')
      }
    } catch (deleteError) {
      console.error(deleteError)
      alert(deleteError instanceof Error ? deleteError.message : 'Error deleting template')
    }
  }

  const previewHtml = buildEmailHtml(formData)
  const hasSignatureOrImageValues = Boolean(
    formData.signature_name ||
    formData.signature_title ||
    formData.signature_company ||
    formData.signature_phone ||
    formData.signature_email ||
    formData.image_url
  )

  return (
    <div className={`animate-fade-in ${styles.container}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>แม่แบบอีเมล</h1>
          <p className={styles.subtitle}>สร้างแม่แบบอีเมลที่นำกลับมาใช้ใหม่ได้ พร้อมรองรับการจัดรูปแบบ ลายเซ็น และรูปภาพ</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenForm()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มแม่แบบใหม่
        </button>
      </header>

      {isFormOpen && (
        <div style={{ paddingBottom: '2rem' }}>
          <form onSubmit={handleSave} className="card animate-fade-in">
            <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>
              {formData.id ? 'Edit Template' : 'New Template'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="label">ชื่อแม่แบบอีเมล (Template Title)</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={formData.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder="e.g. Monthly Report"
                />
              </div>
              <div>
                <label className="label">หัวข้ออีเมล (Email Subject)</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={formData.subject}
                  onChange={(event) => updateField('subject', event.target.value)}
                  placeholder="Subject line"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label">เนื้อหาข้อความ</label>
              <textarea
                className="input-field"
                rows={8}
                style={{ resize: 'vertical', minHeight: '180px' }}
                value={formData.body}
                onChange={(event) => updateField('body', event.target.value)}
                placeholder={'Type message text here.\n\nLine breaks will be preserved automatically.'}
              />
              <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginTop: '0.4rem' }}>
                Normal text with blank lines is supported. If needed, you can still paste basic HTML.
              </p>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">เลือกลายเซ็นต์ / รูปภาพแนบท้าย</label>
                <select 
                  className="input-field" 
                  value={signatures.find(s => s.name === formData.signature_name)?.id || ''}
                  onChange={(e) => handleSelectSignature(e.target.value)}
                >
                  <option value="">-- ไม่ใช้ลายเซ็นต์ --</option>
                  {signatures.map(sig => (
                    <option key={sig.id} value={sig.id}>{sig.name}</option>
                  ))}
                </select>
                <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginTop: '0.4rem' }}>
                  Choose a signature from your library. Manage them in the "Signatures" menu.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '6px', background: '#fbfdff' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#475569', marginBottom: '0.75rem' }}>
                Preview
              </div>
              <div
                style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)' }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn-primary" style={{ background: 'transparent', color: 'var(--muted)', borderColor: 'var(--border)' }} onClick={() => setIsFormOpen(false)}>
                ยกเลิก
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึกแม่แบบ'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={`card ${styles.tableCard}`}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>กำลังโหลดข้อมูลแม่แบบ...</p>
          </div>
        ) : error ? (
          <div className={styles.loadingState}>
            <p style={{ color: 'var(--error)' }}>{error}</p>
          </div>
        ) : templates.length === 0 ? (
          <div className={styles.loadingState}>
            <p>ไม่พบข้อมูลแม่แบบอีเมล</p>
            <button className="btn-primary" onClick={() => handleOpenForm()}>เริ่มสร้างแม่แบบแรก</button>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ชื่อแม่แบบและหัวข้อ</th>
                <th>ตัวอย่างเนื้อหา</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template, index) => {
                const excerpt = buildTemplateExcerpt(template)
                const hasSignature = Boolean(
                  template.signature_name ||
                  template.signature_title ||
                  template.signature_phone ||
                  template.signature_email ||
                  template.signature_company
                )
                const hasImage = Boolean(template.image_url)

                return (
                  <tr key={template.id || index}>
                    <td style={{ width: '30%' }}>
                      <div className={styles.name}>{template.title}</div>
                      <div className={styles.email} style={{ marginTop: '0.25rem' }}>{template.subject}</div>
                    </td>
                    <td>
                      <div
                        style={{
                          color: 'var(--muted)',
                          fontSize: '0.875rem',
                          maxWidth: '420px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {excerpt || 'No preview text'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        {hasSignature && <span className={styles.departmentBadge}>Signature</span>}
                        {hasImage && <span className={styles.departmentBadge}>Image</span>}
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
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
