import { createInquiryAction } from './actions'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'

type ContactPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ submitted?: string }>
}

export default async function ContactPage({ params, searchParams }: ContactPageProps) {
  const { slug } = await params
  const { submitted } = await searchParams
  const academy = await getAcademyBySlug(slug)

  return (
    <>
      <div className="pub-page-hero">
        <div className="pub-page-hero-inner">
          <div className="pub-label">CONTACT</div>
          <h1 className="pub-page-title">상담 문의</h1>
          <p className="pub-page-subtitle">연락처와 문의 내용을 남기면 담당자가 확인합니다.</p>
        </div>
      </div>

      <div className="pub-page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 60, alignItems: 'start' }}>
          <aside className="pub-side">
            <h3 className="pub-side-title">연락처</h3>
            <div className="pub-side-line" />
            {academy.phone && (
              <div className="pub-notice-item">
                <div className="pub-label" style={{ marginBottom: 4 }}>PHONE</div>
                {academy.phone}
              </div>
            )}
            {academy.email && (
              <div className="pub-notice-item">
                <div className="pub-label" style={{ marginBottom: 4 }}>EMAIL</div>
                {academy.email}
              </div>
            )}
            {academy.address && (
              <div className="pub-notice-item">
                <div className="pub-label" style={{ marginBottom: 4 }}>ADDRESS</div>
                {academy.address}
              </div>
            )}
          </aside>

          <section>
            {submitted === '1' && (
              <div className="pub-success-msg">
                문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.
              </div>
            )}

            <form action={createInquiryAction} className="pub-form-wrap">
              <input type="hidden" name="slug" value={slug} />

              <label>
                <span className="pub-form-label">NAME</span>
                <input className="pub-form-input" name="name" required />
              </label>

              <label>
                <span className="pub-form-label">PHONE</span>
                <input
                  className="pub-form-input"
                  name="phone"
                  placeholder="010-1234-5678"
                  required
                />
              </label>

              <label>
                <span className="pub-form-label">EMAIL</span>
                <input className="pub-form-input" name="email" type="email" />
              </label>

              <label>
                <span className="pub-form-label">SUBJECT</span>
                <input className="pub-form-input" name="subject" />
              </label>

              <label>
                <span className="pub-form-label">MESSAGE</span>
                <textarea className="pub-form-textarea" name="content" required />
              </label>

              <ConfirmSubmitButton
                className="pub-form-submit"
                message="문의 내용을 접수할까요?"
              >
                SUBMIT INQUIRY
              </ConfirmSubmitButton>
            </form>
          </section>
        </div>
      </div>
    </>
  )
}
