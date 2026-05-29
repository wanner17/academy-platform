'use client'

import { useState } from 'react'
import { adminPath } from '@/lib/utils/public-path'
import { LogoutButton } from './logout-button'

type AdminNavProps = {
  slug: string
  isAdmin: boolean
}

export function AdminNav({ slug, isAdmin }: AdminNavProps) {
  const [open, setOpen] = useState(false)

  const links = isAdmin
    ? [
        { href: adminPath(slug, '/settings'), label: '기본 설정' },
        { href: adminPath(slug, '/programs'), label: '수업 관리' },
        { href: adminPath(slug, '/attendance'), label: '출석 관리' },
        { href: adminPath(slug, '/tests'), label: '테스트 관리' },
        { href: adminPath(slug, '/teachers'), label: '강사진 관리' },
        { href: adminPath(slug, '/students'), label: '학생 관리' },
        { href: adminPath(slug, '/notices'), label: '공지 관리' },
        { href: adminPath(slug, '/quiz'), label: '퀴즈 관리' },
        { href: adminPath(slug, '/inquiries'), label: '문의 관리' },
        { href: adminPath(slug, '/messages'), label: '쪽지' },
        { href: adminPath(slug, '/analytics'), label: '분석' },
      ]
    : [
        { href: adminPath(slug, '/my'), label: '내 수업' },
        { href: adminPath(slug, '/attendance'), label: '출석 관리' },
        { href: adminPath(slug, '/tests'), label: '테스트 관리' },
        { href: adminPath(slug, '/students'), label: '학생 관리' },
        { href: adminPath(slug, '/inquiries'), label: '문의 관리' },
        { href: adminPath(slug, '/messages'), label: '쪽지' },
        { href: adminPath(slug, '/profile'), label: '내 정보' },
        { href: adminPath(slug, '/my/analytics'), label: '분석' },
      ]

  return (
    <div className="relative">
      <button
        aria-label="메뉴 열기"
        className="rounded p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border bg-white py-1 shadow-lg lg:hidden">
          {links.map(({ href, label }) => (
            <a
              key={href}
              className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              href={href}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          <a
            className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            href={`/${slug}`}
            onClick={() => setOpen(false)}
          >
            사용자 사이트
          </a>
          <div className="border-t px-4 py-2">
            <LogoutButton className="text-sm text-slate-600" />
          </div>
        </div>
      )}

      <nav className="hidden gap-3 text-sm text-slate-600 lg:flex lg:flex-wrap lg:items-center">
        {links.map(({ href, label }) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
        <a href={`/${slug}`}>사용자 사이트</a>
        <LogoutButton />
      </nav>
    </div>
  )
}
