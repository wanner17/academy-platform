'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

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
  messagesHref?: string
  unreadCount?: number
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
  messagesHref,
  unreadCount = 0,
}: PublicHeaderProps) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const close = () => setOpen(false)

  const isActive = (href: string) => {
    if (href === homeHref) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <header className={`pub-header${scrolled ? ' pub-header--scrolled' : ''}`}>
      <a className="pub-logo" href={homeHref}>
        <Image alt={`${academyName} 로고`} height={50} priority src="/logo.png" width={220} />
      </a>

      <nav className="pub-nav">
        <a className={isActive(programsHref) ? 'active' : ''} href={programsHref}>수업 안내</a>
        <a className={isActive(teachersHref) ? 'active' : ''} href={teachersHref}>강사진</a>
        <a className={isActive(scheduleHref) ? 'active' : ''} href={scheduleHref}>시간표</a>
        <a className={isActive(noticesHref) ? 'active' : ''} href={noticesHref}>공지사항</a>
        <a className={isActive(authHref) ? 'active' : ''} href={authHref}>{authLabel}</a>
      </nav>

      <div className="pub-header-right">
        {messagesHref && (
          <a
            aria-label="쪽지"
            className="pub-msg-icon"
            href={messagesHref}
          >
            <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24" width="20">
              <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {unreadCount > 0 && (
              <span className="pub-msg-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </a>
        )}
        <a className="pub-cta" href={contactHref}>상담 문의</a>
      </div>

      <button
        className={`pub-hamburger${open ? ' pub-hamburger--open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label="메뉴"
      >
        <span /><span /><span />
      </button>

      <div className={`pub-mobile-overlay${open ? ' pub-mobile-overlay--open' : ''}`} onClick={close}>
        <nav className="pub-mobile-nav" onClick={e => e.stopPropagation()}>
          <button className="pub-mobile-close" onClick={close} aria-label="닫기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <a className={isActive(programsHref) ? 'active' : ''} href={programsHref} onClick={close}>수업 안내</a>
          <a className={isActive(teachersHref) ? 'active' : ''} href={teachersHref} onClick={close}>강사진</a>
          <a className={isActive(scheduleHref) ? 'active' : ''} href={scheduleHref} onClick={close}>시간표</a>
          <a className={isActive(noticesHref) ? 'active' : ''} href={noticesHref} onClick={close}>공지사항</a>
          <a className={isActive(authHref) ? 'active' : ''} href={authHref} onClick={close}>{authLabel}</a>
          {messagesHref && (
            <a
              className="flex items-center gap-2"
              href={messagesHref}
              onClick={close}
            >
              쪽지
              {unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </a>
          )}
          <a className="pub-mobile-cta" href={contactHref} onClick={close}>상담 문의</a>
        </nav>
      </div>
    </header>
  )
}
