import type { PetTutor } from './types';

export const TUTOR_COLORS = ['#f4941e', '#2f6f4f', '#3f5f8a', '#c2578a', '#6f8a3f'];

export function tutorColor(tutors: PetTutor[], petTutorId: string | null): string | undefined {
  if (!petTutorId) return undefined;
  const index = tutors.findIndex((t) => t.id === petTutorId);
  return index >= 0 ? TUTOR_COLORS[index % TUTOR_COLORS.length] : undefined;
}
