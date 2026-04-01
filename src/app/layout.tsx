import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import styles from './layout.module.css'

export const metadata: Metadata = {
  title: 'MAN Email Management',
  description: 'Manage your contacts and send emails easily with Attachments.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className={styles.appContainer}>
          <nav className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div className={styles.logo}>MAN Email</div>
            </div>
            <div className={styles.navLinks}>
              <Link href="/" className={styles.navLink}>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Dashboard
              </Link>
              <Link href="/contacts" className={styles.navLink}>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Contacts
              </Link>
              <Link href="/templates" className={styles.navLink}>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Templates
              </Link>
              <Link href="/compose" className={styles.navLink}>
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Email
              </Link>
            </div>
            <div className={styles.sidebarFooter}>
              <div className={styles.userProfile}>
                <div className={styles.avatar}>A</div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>Admin User</div>
                </div>
              </div>
            </div>
          </nav>
          
          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
