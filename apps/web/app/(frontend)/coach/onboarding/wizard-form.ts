/** The onboarding wizard's form state and how it saves; shared with the mobile app in @el-captain/rules/coach-form. */
import type { CoachForm } from '@el-captain/rules/coach-form';
import type { Certification } from '@/lib/client/coach-api';
import type { SportDTO } from '@/lib/server/dto';

export { bodyFor, filledSteps, formOf, leaveStep, savedBodiesOf, savedPart, submitBlocked, type SavedBodies } from '@el-captain/rules/coach-form';
export type Form = CoachForm<SportDTO, Certification>;
