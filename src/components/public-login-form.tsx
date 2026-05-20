'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

type PublicLoginFormProps = {
  callbackUrl: string
}

export function PublicLoginForm({ callbackUrl }: PublicLoginFormProps) {
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="pub-login-form"
      onSubmit={async (event) => {
        event.preventDefault()
        setError(null)

        const form = new FormData(event.currentTarget)
        const result = await signIn('credentials', {
          email: form.get('email'),
          password: form.get('password'),
          redirect: false,
          callbackUrl,
        })

        if (result?.error) {
          setError('아이디 또는 비밀번호가 올바르지 않습니다.')
          return
        }

        window.location.href = result?.url ?? callbackUrl
      }}
    >
      <label className="pub-login-field">
        <span>아이디</span>
        <input name="email" type="text" autoComplete="username" required />
      </label>
      <label className="pub-login-field">
        <span>비밀번호</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error ? <p className="pub-login-error">{error}</p> : null}
      <button className="pub-login-submit" type="submit">
        로그인
      </button>
    </form>
  )
}
