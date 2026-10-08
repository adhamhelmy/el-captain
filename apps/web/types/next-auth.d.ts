import type { Role } from '@el-captain/types';
import type { CoachStatus } from '@/lib/coach-rules';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      coachStatus?: CoachStatus;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    coachStatus?: CoachStatus;
    coachStatusCheckedAt?: number;
  }
}
