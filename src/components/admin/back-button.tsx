'use client'

type BackButtonProps = {
  fallbackHref: string
  label?: string
}

export function BackButton({ fallbackHref, label = '뒤로가기' }: BackButtonProps) {
  return (
    <button
      className="mb-6 inline-block text-sm text-blue-700"
      onClick={() => {
        if (window.history.length > 1) {
          window.history.back()
          return
        }

        window.location.href = fallbackHref
      }}
      type="button"
    >
      {label}
    </button>
  )
}
