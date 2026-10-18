import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { STATUS_RECHECK_MS } from '@/lib/shared/coach-rules';
import { checkCredentials } from '@/lib/server/credentials';
import { findAccess } from '@/prisma/models/user';
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
        const result = await checkCredentials(credentials.email, credentials.password);
        if ('user' in result) return result.user;
        if (result.error === 'invalid') return null;
        throw new Error(result.error);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.signedInAt = Date.now();
      }
      // Routing and protect() read suspension and coach status from here, re-read every few minutes to catch a suspension.
      // Waiting coaches are re-read every time so an approval shows up at once.
      const stale = Date.now() - (token.statusCheckedAt ?? 0) > STATUS_RECHECK_MS;
      const waitingCoach = token.role === 'COACH' && token.coachStatus !== 'ACTIVE';
      if (stale || waitingCoach) {
        const access = await findAccess(token.id);
        // A password change or reset signs out every session that started before it; throwing makes next-auth clear the cookie.
        if (access.passwordChangedAt && access.passwordChangedAt > (token.signedInAt ?? 0)) throw new Error('Password changed');
        token.suspended = access.suspended;
        if (token.role === 'COACH') token.coachStatus = access.coachStatus ?? 'INCOMPLETE';
        token.statusCheckedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        if (token.coachStatus) session.user.coachStatus = token.coachStatus;
        if (token.suspended) session.user.suspended = true;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
