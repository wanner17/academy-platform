type KpiCardsProps = {
  totalStudents: number
  newStudents: number
  activeEnrollments: number
  newEnrollments: number
  endedEnrollments: number
}

const cards = (props: KpiCardsProps) => [
  { label: '총 재원 학생', value: props.totalStudents, unit: '명', color: 'border-t-indigo-500' },
  { label: '이번 달 신규 학생', value: props.newStudents, unit: '명', color: 'border-t-emerald-500' },
  { label: '활성 수강', value: props.activeEnrollments, unit: '건', color: 'border-t-sky-500' },
  { label: '이번 달 신규 수강', value: props.newEnrollments, unit: '건', color: 'border-t-amber-500' },
  { label: '이번 달 이탈', value: props.endedEnrollments, unit: '건', color: 'border-t-rose-500' },
]

export function KpiCards(props: KpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards(props).map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm border-t-4 ${card.color}`}
        >
          <p className="text-xs text-slate-500">{card.label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {card.value.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-slate-500">{card.unit}</span>
          </p>
        </div>
      ))}
    </div>
  )
}
