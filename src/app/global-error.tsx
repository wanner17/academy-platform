'use client'

type GlobalErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  return (
    <html lang="ko">
      <body>
        <main className="error-page">
          <section className="error-panel">
            <div className="error-code">SYSTEM</div>
            <h1>서비스 오류가 발생했습니다</h1>
            <p>페이지를 불러오지 못했습니다. 다시 시도하거나 홈으로 이동해 주세요.</p>
            {error.digest ? <p className="error-digest">오류 코드: {error.digest}</p> : null}
            <div className="error-actions">
              <button className="error-primary" onClick={reset} type="button">
                다시 시도
              </button>
              <button className="error-secondary" onClick={() => window.location.assign('/')} type="button">
                홈으로
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
