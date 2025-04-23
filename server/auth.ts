
import { Auth } from "@auth/core"
import Google from "@auth/core/providers/google"
import { OAuth2Client } from 'google-auth-library'
import { Request, Response, NextFunction } from 'express'

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth credentials')
}

export const auth = new Auth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  secret: process.env.AUTH_SECRET || 'your-secret-key',
})

export const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/auth/callback/google'
)

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = req.headers.authorization?.split(' ')[1]
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  next()
}
