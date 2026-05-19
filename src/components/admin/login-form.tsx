'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        setError(null)
        const form = new FormData(event.currentTarget)
        const result = await signIn('credentials', {
          email: form.get('email'),
          password: form.get('password'),
          redirect: false,
          callbackUrl: callbackUrl ?? '/admin/demo',
        })

        if (result?.error) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.')
          return
        }

        window.location.href = result?.url ?? callbackUrl ?? '/admin/demo'
      }}
    >
      <label className="block">
        <span className="mb-1 block text-sm font-medium">이메일</span>
        <input className="w-full rounded border px-3 py-2" name="email" type="email" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">비밀번호</span>
        <input className="w-full rounded border px-3 py-2" name="password" type="password" required />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className="w-full rounded bg-slate-900 px-4 py-2 font-medium text-white" type="submit">
        로그인
      </button>
    </form>
  )
}
