'use client'

import { useState, useRef } from 'react'

type ConfirmSubmitButtonProps = {
  children: React.ReactNode
  className?: string
  message: string
  name?: string
  value?: string
}

export function ConfirmSubmitButton({
  children,
  className,
  message,
  name,
  value,
}: ConfirmSubmitButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleTrigger = (event: React.MouseEvent) => {
    event.preventDefault()
    setIsOpen(true)
  }

  const handleConfirm = () => {
    setIsOpen(false)
    const form = buttonRef.current?.closest('form')
    if (form) {
      if (name && value) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        form.appendChild(input)
        form.requestSubmit()
        form.removeChild(input)
      } else {
        form.requestSubmit()
      }
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        className={className}
        onClick={handleTrigger}
        type="button"
      >
        {children}
      </button>

      {isOpen && (
        <div className="custom-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="custom-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="custom-modal-title">알림</h3>
            <p className="custom-modal-message">{message}</p>
            <div className="custom-modal-actions">
              <button className="custom-modal-btn cancel" onClick={() => setIsOpen(false)} type="button">
                취소
              </button>
              <button className="custom-modal-btn confirm" onClick={handleConfirm} type="button">
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

