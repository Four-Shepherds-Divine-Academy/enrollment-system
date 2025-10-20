import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Use the lightweight auth config for Edge Runtime
const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: ['/admin/:path*'],
}
