import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { isValidEmail, normalizeEmail } from '@/lib/auth-rules';
import { STATUS_RECHECK_MS } from '@/lib/coach-rules';
import { ERROR_CODES } from '@/lib/error-codes';
import { checkPassword } from '@/lib/password';
import { findCoachStatus } from '@/prisma/models/coach-profile';
import { findUserByEmail } from '@/prisma/models/user';
import type { Role } from '@el-captain/types';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = normalizeEmail(credentials.email);
        if (!isValidEmail(email)) return null;

        const user = await findUserByEmail(email);
        if (!user) return null;

        const valid = await checkPassword(credentials.password, user.passwordHash);
        if (!valid) return null;
        // Only after the password matched, so this can't be used to find out which emails have accounts.
        if (!user.emailVerified) throw new Error(ERROR_CODES.EMAIL_NOT_VERIFIED);

        return { id: user.id, name: user.name, email: user.email, role: user.role as Role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      // Routing reads the status from here; the APIs check the database themselves.
      // Waiting coaches are re-read every time so an approval shows up at once; active ones every few minutes to catch a suspension.
      const stale = Date.now() - (token.coachStatusCheckedAt ?? 0) > STATUS_RECHECK_MS;
      if (token.role === 'COACH' && (token.coachStatus !== 'ACTIVE' || stale)) {
        token.coachStatus = (await findCoachStatus(token.id)) ?? 'INCOMPLETE';
        token.coachStatusCheckedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        if (token.coachStatus) session.user.coachStatus = token.coachStatus;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
