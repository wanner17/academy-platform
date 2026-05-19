import type { UserRole } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      academyId: string | null
      academySlug?: string | null
      role: UserRole
    } & DefaultSession['user']
  }

  interface User {
    academyId: string | null
    academySlug?: string | null
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    academyId: string | null
    academySlug?: string | null
    role: UserRole
  }
}
