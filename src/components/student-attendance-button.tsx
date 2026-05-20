'use client'

import { useState, useTransition } from 'react'
import { checkInAttendanceAction } from '@/app/(student)/student/[slug]/actions'

type StudentAttendanceButtonProps = {
  disabled: boolean
  hasRecord: boolean
  slug: string
}

export function StudentAttendanceButton({ disabled, hasRecord, slug }: StudentAttendanceButtonProps) {
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  const checkIn = () => {
    setMessage('')
    if (!navigator.geolocation) {
      setMessage('브라우저 위치 기능을 사용할 수 없습니다.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          const result = await checkInAttendanceAction(slug, {
            accuracyMeters: position.coords.accuracy,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          setMessage(result.message)
        })
      },
      () => setMessage('위치 권한을 허용해야 출석할 수 있습니다.'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    )
  }

  return (
    <div className="student-attendance-action">
      <button disabled={disabled || pending || hasRecord} onClick={checkIn} type="button">
        {pending ? '위치 확인 중' : hasRecord ? '출석 완료' : '출석하기'}
      </button>
      {message ? <p>{message}</p> : null}
    </div>
  )
}
