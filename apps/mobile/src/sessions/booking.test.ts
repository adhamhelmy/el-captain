import { bookingState } from './booking';

const now = new Date('2026-10-20T10:00:00Z');
const base = { type: 'GROUP' as const, status: 'SCHEDULED', startsAt: '2026-10-22T16:00:00Z', capacity: 10, booked: 3, bookedByMe: false };

describe('bookingState', () => {
  it('asks a guest to log in to book', () => {
    expect(bookingState(base, false, now)).toBe('logIn');
  });

  it('lets a member reserve an open session, and says when it is full', () => {
    expect(bookingState(base, true, now)).toBe('reserve');
    expect(bookingState({ ...base, booked: 10 }, true, now)).toBe('full');
  });

  it('lets a member cancel a group booking until two hours before', () => {
    expect(bookingState({ ...base, bookedByMe: true }, true, now)).toBe('bookedCanCancel');
    const soon = { ...base, bookedByMe: true, startsAt: '2026-10-20T11:30:00Z' };
    expect(bookingState(soon, true, now)).toBe('bookedTooLate');
  });

  it('never offers to cancel a private session here', () => {
    expect(bookingState({ ...base, type: 'PRIVATE', bookedByMe: true }, true, now)).toBe('bookedPrivate');
  });

  it('shows coaches and studios the price but no way to book', () => {
    expect(bookingState(base, true, now, 'COACH')).toBe('notMember');
    expect(bookingState(base, true, now, 'USER')).toBe('reserve');
  });

  it('closes past and cancelled sessions', () => {
    expect(bookingState({ ...base, startsAt: '2026-10-19T10:00:00Z' }, true, now)).toBe('past');
    expect(bookingState({ ...base, status: 'CANCELLED' }, true, now)).toBe('cancelled');
  });
});
