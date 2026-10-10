import type { Role } from '@el-captain/types';
import type { CoachStatus } from '@/lib/shared/coach-rules';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      coachStatus?: CoachStatus;
      suspended?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    coachStatus?: CoachStatus;
    suspended?: boolean;
    statusCheckedAt?: number;
  }
}
