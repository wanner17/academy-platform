import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main className="error-page">
      <section className="error-panel">
        <div className="error-code">404</div>
        <h1>페이지를 찾을 수 없습니다</h1>
        <p>주소가 바뀌었거나 삭제된 페이지입니다. 홈으로 돌아가 다시 이동해 주세요.</p>
        <div className="error-actions">
          <Link className="error-primary" href="/">
            홈으로
          </Link>
        </div>
      </section>
    </main>
  )
}
