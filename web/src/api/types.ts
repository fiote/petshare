export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export const PetTutorStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
} as const;

export type PetTutorStatus = (typeof PetTutorStatus)[keyof typeof PetTutorStatus];

export interface PetTutor {
  id: string;
  petId: string;
  userId: string | null;
  invitedEmail: string | null;
  displayName: string | null;
  isManual: boolean;
  status: PetTutorStatus;
  isOwner: boolean;
  user: AuthUser | null;
  displayLabel: string;
  pet?: Pet;
}

export interface CalendarEntry {
  id: string;
  petId: string;
  petTutorId: string;
  date: string;
  petTutor?: PetTutor;
}

export interface TutorStatCount {
  petTutorId: string;
  tutorName: string;
  count: number;
}

export interface StatsWindow {
  windowSize: number | null;
  isTotal: boolean;
  totalDays: number;
  counts: TutorStatCount[];
}
