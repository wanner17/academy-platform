'use client'

import { signOut } from 'next-auth/react'

export function LogoutButton() {
  return (
    <button
      className="text-sm text-slate-600"
      onClick={() => signOut({ callbackUrl: '/admin/login' })}
      type="button"
    >
      로그아웃
    </button>
  )
}
