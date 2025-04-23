
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import MemoryStore from 'memorystore';
import type { Request, Response, NextFunction } from 'express';

const SessionStore = MemoryStore(session);

// This would come from a database in production
const USERS = [{
  id: 1,
  username: 'admin',
  password: 'admin' // In production, use hashed passwords
}];

passport.use(new LocalStrategy((username, password, done) => {
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return done(null, false);
  return done(null, user);
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: number, done) => {
  const user = USERS.find(u => u.id === id);
  done(null, user);
});

export const sessionMiddleware = session({
  store: new SessionStore({
    checkPeriod: 86400000 // 24 hours
  }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
});

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}
