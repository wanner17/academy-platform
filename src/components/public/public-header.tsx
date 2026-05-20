'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

type PublicHeaderProps = {
  academyName: string
  slug: string
  homeHref: string
  programsHref: string
  teachersHref: string
  scheduleHref: string
  noticesHref: string
  contactHref: string
  authHref: string
  authLabel: string
}

export function PublicHeader({
  academyName,
  homeHref,
  programsHref,
  teachersHref,
  scheduleHref,
  noticesHref,
  contactHref,
  authHref,
  authLabel,
}: PublicHeaderProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const close = () => setOpen(false)

  return (
    <header className="pub-header">
      <a className="pub-logo" href={homeHref}>
        <Image alt={`${academyName} 로고`} height={50} priority src="/logo.png" width={220} />
      </a>

      <nav className="pub-nav">
        <a href={programsHref}>수업 안내</a>
        <a href={teachersHref}>강사진</a>
        <a href={scheduleHref}>시간표</a>
        <a href={noticesHref}>공지사항</a>
        <a href={authHref}>{authLabel}</a>
      </nav>

      <a className="pub-cta" href={contactHref}>상담 문의</a>

      <button
        className={`pub-hamburger${open ? ' pub-hamburger--open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label="메뉴"
      >
        <span /><span /><span />
      </button>

      {open && (
        <div className="pub-mobile-overlay" onClick={close}>
          <nav className="pub-mobile-nav" onClick={e => e.stopPropagation()}>
            <a href={programsHref} onClick={close}>수업 안내</a>
            <a href={teachersHref} onClick={close}>강사진</a>
            <a href={scheduleHref} onClick={close}>시간표</a>
            <a href={noticesHref} onClick={close}>공지사항</a>
            <a href={authHref} onClick={close}>{authLabel}</a>
            <a className="pub-mobile-cta" href={contactHref} onClick={close}>상담 문의</a>
          </nav>
        </div>
      )}
    </header>
  )
}
