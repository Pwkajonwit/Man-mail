'use client'
import { useState, useEffect } from 'react'
import styles from './compose.module.css'

interface Template {
  id: string;
  title: string;
  subject: string;
  body: string;
}

interface Contact {
  name: string;
  email: string;
}

export default function ComposeEmail() {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  
  const [templates, setTemplates] = useState<Template[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_GAS_URL
        if (!url) {
          setIsLoadingData(false)
          return
        }

        // ดึงจาก Cache ด่วน (Local Storage) ก่อนเพื่อความไว
        const cachedTemplates = localStorage.getItem('man_cache_templates')
        const cachedContacts = localStorage.getItem('man_cache_contacts')
        
        if (cachedTemplates) setTemplates(JSON.parse(cachedTemplates))
        if (cachedContacts) setContacts(JSON.parse(cachedContacts))
        
        // เลิกหมุน Loading ทันทีถ้ามี Cache (ถึงแม้ว่าเราจะดึงข้อมูลใหม่แบบ Background ต่อไป)
        if (cachedTemplates && cachedContacts) {
          setIsLoadingData(false)
        }

        // โหลดข้อมูลล่าสุดจาก GAS แบบ Background ไร้รอยต่อ (Stale-while-revalidate)
        Promise.all([
          fetch(`${url}?action=getTemplates`).then(r => r.json()),
          fetch(`${url}?action=getContacts`).then(r => r.json())
        ]).then(([tempJson, contJson]) => {
          if (tempJson.status === 'success') {
            setTemplates(tempJson.data)
            localStorage.setItem('man_cache_templates', JSON.stringify(tempJson.data))
          }
          if (contJson.status === 'success') {
            setContacts(contJson.data)
            localStorage.setItem('man_cache_contacts', JSON.stringify(contJson.data))
          }
          setIsLoadingData(false) // เพื่อความชัวร์ถ้า Cache โล่งตั้งแต่แรก
        }).catch(err => {
          console.error("Background fetch err:", err)
          setIsLoadingData(false)
        })

      } catch (err) {
        console.error("Fetch init err:", err)
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTitle = e.target.value
    if (!selectedTitle) return
    const template = templates.find(t => t.title === selectedTitle)
    if (template) {
      setSubject(template.subject || '')
      setBody(template.body || '')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles])
    }
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')

    try {
      const encodedFiles = await Promise.all(
        files.map(async (f) => {
          const base64Data = await fileToBase64(f)
          return {
            fileName: f.name,
            mimeType: f.type,
            fileBase64: base64Data
          }
        })
      )

      const url = process.env.NEXT_PUBLIC_GAS_URL
      if (!url) throw new Error('No GAS URL')
      
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'sendEmail',
          to,         
          subject,
          body,
          files: encodedFiles
        })
      })

      const data = await res.json()
      if (data.status === 'success') {
        setStatus('success')
        setTo('')
        setSubject('')
        setBody('')
        setFiles([])
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <div className={`animate-fade-in ${styles.container}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Compose Email</h1>
          <p className={styles.subtitle}>Use 'Templates' sheet for quick drafts and send to your 'Contacts'.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={`card ${styles.formCard}`}>
        {status === 'success' && (
          <div className={styles.toastSuccess}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Email, including multiple attachments, has been sent and logged to 'History' sheet!
          </div>
        )}

        <div className={styles.formGroup}>
          <label className="label">Template</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select 
              className="input-field" 
              onChange={handleTemplateSelect} 
              defaultValue=""
              style={{ flex: 1 }}
            >
              <option value="" disabled>-- เลือกตัวอย่างเมล --</option>
              {templates.map((t, i) => (
                 <option key={i} value={t.title}>{t.title}</option>
              ))}
            </select>
            {isLoadingData && (
              <svg className={styles.spinner} style={{ color: 'var(--primary)', width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
            )}
          </div>
          {templates.length === 0 && !isLoadingData && <small style={{color: 'var(--muted)'}}>No templates created yet.</small>}
        </div>

        <div className={styles.formGroup}>
          <label className="label">To <span className={styles.required}>*</span></label>
          <input 
            type="email" 
            className="input-field" 
            placeholder="Select or enter email..." 
            list="contacts-list"
            required
            value={to}
            onChange={e => setTo(e.target.value)}
          />
          <datalist id="contacts-list">
             {contacts.map((c, i) => (
                <option key={i} value={c.email}>{c.name}</option>
             ))}
          </datalist>
        </div>

        <div className={styles.formGroup}>
          <label className="label">Subject <span className={styles.required}>*</span></label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Enter subject..." 
            required
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className="label">Message (Supports HTML)</label>
          <textarea 
            className={`input-field ${styles.textareaField}`} 
            placeholder="Type your message here..."
            rows={8}
            value={body}
            onChange={e => setBody(e.target.value)}
          ></textarea>
        </div>

        <div className={styles.formGroup}>
          <label className="label">Attachments</label>
          <div className={styles.fileUploadBox}>
            <input 
              type="file" 
              multiple
              className={styles.fileInput} 
              id="file-upload" 
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className={styles.fileUploadLabel}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.uploadIcon}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Click here to select files (Multiple allowed)</span>
              <span className={styles.fileSubtext}>Max 5MB total depending on GAS limits</span>
            </label>
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <strong style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Selected Files ({files.length}):</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {files.map((file, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '0.5rem 0.75rem', backgroundColor: 'var(--muted-bg)', 
                    borderRadius: '6px', fontSize: '0.875rem' 
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', overflow: 'hidden' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.6">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button type="button" onClick={() => removeFile(idx)} style={{ color: 'var(--error)', padding: '0.25rem', cursor: 'pointer', border: 'none', background: 'transparent' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.submitRow}>
          <button type="submit" className="btn-primary" disabled={status === 'sending'}>
            {status === 'sending' ? (
              <span className={styles.sendingState}>
                <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                </svg>
                Sending Multiple Files...
              </span>
            ) : (
              <>
                Send & Save to History
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
