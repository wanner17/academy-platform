'use client'

import Link from 'next/link'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="error-page">
      <section className="error-panel">
        <div className="error-code">ERROR</div>
        <h1>문제가 발생했습니다</h1>
        <p>요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
        {error.digest ? <p className="error-digest">오류 코드: {error.digest}</p> : null}
        <div className="error-actions">
          <button className="error-primary" onClick={reset} type="button">
            다시 시도
          </button>
          <Link className="error-secondary" href="/">
            홈으로
          </Link>
        </div>
      </section>
    </main>
  )
}
