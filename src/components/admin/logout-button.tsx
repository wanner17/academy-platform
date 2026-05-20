'use client'

import { signOut } from 'next-auth/react'

type LogoutButtonProps = {
  className?: string
}

export function LogoutButton({ className = 'text-sm text-slate-600' }: LogoutButtonProps) {
  return (
    <button
      className={className}
      onClick={() => signOut({ callbackUrl: '/' })}
      type="button"
    >
      로그아웃
    </button>
  )
}
