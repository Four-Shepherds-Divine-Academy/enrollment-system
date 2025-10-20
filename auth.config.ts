import type { NextAuthConfig } from 'next-auth'

// This is a lightweight auth config for Edge Runtime (middleware)
// It doesn't include Prisma or any heavy dependencies
export const authConfig = {
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.userRole = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string
        session.user.role = token.userRole as string
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAdminRoute = nextUrl.pathname.startsWith('/admin')
      const isLoginPage = nextUrl.pathname === '/admin/login'

      if (isAdminRoute && !isLoginPage) {
        if (!isLoggedIn) return false
        return true
      }

      return true
    },
  },
  providers: [], // Providers are added in auth.ts
} satisfies NextAuthConfig
