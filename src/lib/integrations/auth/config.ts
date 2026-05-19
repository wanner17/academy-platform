import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

export const authConfig: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim()
        const password = credentials?.password
        if (!email || !password) return null

        const user = await prisma.user.findFirst({
          where: { email },
          include: { academy: true },
        })
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          academyId: user.academyId,
          academySlug: user.academy?.slug ?? null,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.academyId = user.academyId
        token.academySlug = user.academySlug
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub!
      session.user.academyId = token.academyId
      session.user.academySlug = token.academySlug
      session.user.role = token.role
      return session
    },
  },
}
