'use client'
import { useEffect, useState } from 'react'
import styles from './compose.module.css'
import {
  buildEmailHtml,
  createEmptyTemplate,
  stripHtml,
  type EmailTemplateRecord,
} from '@/lib/email-template'
import { fetchGasJson } from '@/lib/gas-client'

interface Contact {
  name: string;
  email: string;
}

export default function ComposeEmail() {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [signatureName, setSignatureName] = useState('')
  const [signatureTitle, setSignatureTitle] = useState('')
  const [signatureCompany, setSignatureCompany] = useState('')
  const [signaturePhone, setSignaturePhone] = useState('')
  const [signatureEmail, setSignatureEmail] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedSignatureId, setSelectedSignatureId] = useState('')
  const [signatures, setSignatures] = useState<any[]>([])
  const [templates, setTemplates] = useState<EmailTemplateRecord[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cachedTemplates = localStorage.getItem('man_cache_templates')
        const cachedContacts = localStorage.getItem('man_cache_contacts')

        if (cachedTemplates) setTemplates(JSON.parse(cachedTemplates))
        if (cachedContacts) setContacts(JSON.parse(cachedContacts))
        if (cachedTemplates && cachedContacts) setIsLoadingData(false)

        const [templateResponse, contactResponse, signatureResponse] = await Promise.all([
          fetchGasJson<EmailTemplateRecord[]>('/api/gas?action=getTemplates'),
          fetchGasJson<Contact[]>('/api/gas?action=getContacts'),
          fetchGasJson<any[]>('/api/gas?action=getSignatures'),
        ])

        if (templateResponse.status === 'success') {
          const nextTemplates = templateResponse.data ?? []
          setTemplates(nextTemplates)
          localStorage.setItem('man_cache_templates', JSON.stringify(nextTemplates))
        }

        if (contactResponse.status === 'success') {
          const nextContacts = contactResponse.data ?? []
          setContacts(nextContacts)
          localStorage.setItem('man_cache_contacts', JSON.stringify(nextContacts))
        }

        if (signatureResponse.status === 'success') {
          setSignatures(signatureResponse.data ?? [])
        }
      } catch (error) {
        console.error('Failed to fetch compose data:', error)
        setLoadError(error instanceof Error ? error.message : 'Failed to load compose data')
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

  const hasSignatureOrImageValues = Boolean(
    signatureName ||
    signatureTitle ||
    signatureCompany ||
    signaturePhone ||
    signatureEmail ||
    imageUrl
  )

  const applyTemplate = (template: EmailTemplateRecord) => {
    setSelectedTemplateId(template.id ?? '')
    setSubject(template.subject || '')
    setBody(template.body || '')
    setSignatureName(template.signature_name || '')
    setSignatureTitle(template.signature_title || '')
    setSignatureCompany(template.signature_company || '')
    setSignaturePhone(template.signature_phone || '')
    setSignatureEmail(template.signature_email || '')
    setImageUrl(template.image_url || '')
  }

  const handleTemplateSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = event.target.value
    setSelectedTemplateId(templateId)
    if (!templateId) return

    const template = templates.find((item) => String(item.id) === templateId)
    if (template) {
      applyTemplate(template)
    }
  }

  const handleSignatureSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const sigId = event.target.value
    setSelectedSignatureId(sigId)
    if (!sigId) {
      setSignatureName('')
      setSignatureTitle('')
      setSignatureCompany('')
      setSignaturePhone('')
      setSignatureEmail('')
      setImageUrl('')
      return
    }

    const sig = signatures.find((item) => String(item.id) === sigId)
    if (sig) {
      setSignatureName(sig.name || '')
      setSignatureTitle(sig.title || '')
      setSignatureCompany(sig.company || '')
      setSignaturePhone(sig.phone || '')
      setSignatureEmail(sig.email || '')
      setImageUrl(sig.image_url || '')
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFiles = Array.from(event.target.files)
      setFiles((previous) => [...previous, ...selectedFiles])
    }
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((previous) => previous.filter((_, fileIndex) => fileIndex !== index))
  }

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.readAsDataURL(file)
    })

  const previewHtml = buildEmailHtml({
    body,
    signature_name: signatureName,
    signature_title: signatureTitle,
    signature_company: signatureCompany,
    signature_phone: signaturePhone,
    signature_email: signatureEmail,
    image_url: imageUrl,
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('sending')

    try {
      const encodedFiles = await Promise.all(
        files.map(async (file) => ({
          fileName: file.name,
          mimeType: file.type,
          fileBase64: await fileToBase64(file),
        }))
      )

      const data = await fetchGasJson('/api/gas', {
        method: 'POST',
        body: JSON.stringify({
          action: 'sendEmail',
          to,
          cc,
          subject,
          body: previewHtml,
          plainTextBody: stripHtml(previewHtml),
          files: encodedFiles,
        }),
      })
      if (data.status === 'success') {
        const emptyTemplate = createEmptyTemplate()
        setStatus('success')
        setTo('')
        setCc('')
        setSubject('')
        setBody('')
        setSignatureName(emptyTemplate.signature_name || '')
        setSignatureTitle(emptyTemplate.signature_title || '')
        setSignatureCompany(emptyTemplate.signature_company || '')
        setSignaturePhone(emptyTemplate.signature_phone || '')
        setSignatureEmail(emptyTemplate.signature_email || '')
        setImageUrl(emptyTemplate.image_url || '')
        setSelectedSignatureId('')
        setFiles([])
        setSelectedTemplateId('')
      } else {
        setStatus('error')
        alert(data.message || 'Failed to send email')
      }
    } catch (error) {
      console.error(error)
      setStatus('error')
      alert(error instanceof Error ? error.message : 'Failed to send email')
    }
  }

  return (
    <div className={`animate-fade-in ${styles.container}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Compose Email</h1>
          <p className={styles.subtitle}>Select a template, adjust the content, and preview the final email before sending.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div className={styles.stickyHeader}>
          <button type="submit" className="btn-primary" style={{ minWidth: '240px', height: '42px' }} disabled={status === 'sending'}>
            {status === 'sending' ? (
              <span className={styles.sendingState}>
                <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                </svg>
                กำลังส่งอีเมล...
              </span>
            ) : (
              <>
                ยืนยันและส่งอีเมล (Send Email)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>

        {status === 'success' && (
          <div className={styles.toastSuccess}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            ส่งอีเมลสำเร็จและบันทึกในประวัติแล้ว
          </div>
        )}

        <div className={styles.pageGrid}>
          <div className={styles.formCol}>
            <div className={styles.formSection}>
              <div className={styles.sectionTitle}>1. ข้อมูลพื้นฐาน & แม่แบบ (Basic Info)</div>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className="label">แม่แบบอีเมล (Template)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <select className="input-field" onChange={handleTemplateSelect} value={selectedTemplateId} style={{ flex: 1 }}>
                    <option value="">เลือกแม่แบบเพื่อเริ่มต้น</option>
                    {templates.map((template) => (
                      <option key={template.id} value={String(template.id)}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                  {isLoadingData && (
                    <svg className={styles.spinner} style={{ color: 'var(--primary)', width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                    </svg>
                  )}
                </div>
                {loadError && (
                  <p className={styles.sectionHint} style={{ color: 'var(--error)' }}>{loadError}</p>
                )}
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.sectionTitle}>2. ผู้รับอีเมล (Recipients)</div>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className="label">ถึง (To) <span className={styles.required}>*</span></label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="ระบุอีเมลผู้รับ"
                    list="contacts-list"
                    required
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                  />
                  <datalist id="contacts-list">
                    {contacts.map((contact, index) => (
                      <option key={index} value={contact.email}>{contact.name}</option>
                    ))}
                  </datalist>
                </div>
                <div className={styles.formGroup}>
                  <label className="label">สำเนา (CC)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="cc1@example.com, cc2@example.com"
                    value={cc}
                    onChange={(event) => setCc(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.sectionTitle}>3. เนื้อหาอีเมล (Message Content)</div>
              <div className={styles.formGroup}>
                <label className="label">หัวข้อ (Subject) <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ระบุหัวข้ออีเมล"
                  required
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </div>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className="label">ข้อความ (Message Body)</label>
                <textarea
                  className={`input-field ${styles.textareaField}`}
                  placeholder="ระบุเนื้อหาอีเมลของคุณที่นี่..."
                  rows={8}
                  style={{ minHeight: '180px' }}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.formSection}>
                <div className={styles.sectionTitle}>4. ลายเซ็น (Signature)</div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className="label">เลือกลายเซ็น</label>
                  <select className="input-field" onChange={handleSignatureSelect} value={selectedSignatureId}>
                    <option value="">-- ไม่ใช้ลายเซ็น --</option>
                    {signatures.map((sig) => (
                      <option key={sig.id} value={String(sig.id)}>
                        {sig.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formSection}>
                <div className={styles.sectionTitle}>5. แนบไฟล์ (Attachments)</div>
                <div className={styles.fileUploadBox}>
                  <input type="file" multiple className={styles.fileInput} id="file-upload" onChange={handleFileChange} />
                  <label htmlFor="file-upload" className={styles.fileUploadLabel} style={{ padding: '0.75rem', height: 'auto', flexDirection: 'row', gap: '0.5rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.8125rem' }}>คลิกเพื่อเลือกไฟล์</div>
                    </div>
                  </label>
                </div>
                {files.length > 0 && (
                  <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {files.map((file, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.4rem',
                            backgroundColor: 'var(--muted-bg)',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                          }}
                        >
                          <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                          <button type="button" onClick={() => removeFile(index)} style={{ color: 'var(--error)', padding: '0.1rem' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.previewCol}>
            <div className={styles.previewCard} style={{ marginTop: 0 }}>
              <div className={styles.previewHeader}>Email Preview (ตรวจสอบเนื้อหา)</div>
              <div className={styles.previewBody} style={{ backgroundColor: '#fff', fontSize: '14px', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
