import { getAcademyBySlug } from '@/lib/utils/tenant'
import { requireMemberPage } from '@/lib/auth/server'
import { studentService } from '@/lib/services/student.service'
import { schoolExamService } from '@/lib/services/school-exam.service'
import { createSchoolExamAction } from '../actions'
import { ExamTypeSelect } from '@/components/admin/exam-type-select'

type PageProps = { params: Promise<{ slug: string; id: string }> }

export default async function NewSchoolExamPage({ params }: PageProps) {
  const { slug, id: studentId } = await params
  await requireMemberPage(slug)
  const academy = await getAcademyBySlug(slug)
  const student = await studentService.getStudentById(studentId, academy.id)
  const meta = await schoolExamService.getDistinctMeta(academy.id)
  const subjects = [...new Set(meta.map((m) => m.subject))].sort()
  const currentYear = new Date().getFullYear()

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <div className="mb-6">
        <a className="text-sm text-slate-500 hover:underline" href={`/admin/${slug}/students/${studentId}`}>
          ← {student.name} 상세로 돌아가기
        </a>
        <h1 className="mt-2 text-2xl font-bold">학교 시험 성적 추가</h1>
      </div>
      <form action={createSchoolExamAction} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="studentId" value={studentId} />

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">연도 *</span>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              defaultValue={currentYear}
              max={currentYear + 1}
              min={2000}
              name="examYear"
              required
              type="number"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">학기 *</span>
            <select className="w-full rounded border px-3 py-2 text-sm" name="semester" required>
              <option value="1">1학기</option>
              <option value="2">2학기</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">시험 종류 *</span>
          <ExamTypeSelect />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">과목 *</span>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            list="subjects"
            name="subject"
            placeholder="예: 국어, 수학, 영어"
            required
          />
          <datalist id="subjects">
            {subjects.map((s) => <option key={s} value={s} />)}
          </datalist>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">원점수</span>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              min={0}
              name="score"
              placeholder="예: 85"
              type="number"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">등급 (1~9)</span>
            <select className="w-full rounded border px-3 py-2 text-sm" name="grade">
              <option value="">선택 안 함</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                <option key={g} value={g}>{g}등급</option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-slate-500">* 원점수 또는 등급 중 하나는 필수입니다</p>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">메모</span>
          <textarea className="w-full rounded border px-3 py-2 text-sm" name="memo" rows={2} />
        </label>

        <div className="flex gap-2 pt-2">
          <button className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" type="submit">
            저장
          </button>
          <a className="rounded border px-4 py-2 text-sm" href={`/admin/${slug}/students/${studentId}`}>
            취소
          </a>
        </div>
      </form>
    </main>
  )
}
