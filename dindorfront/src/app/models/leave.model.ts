export type LeaveType = 'CONGE_PAYE' | 'MALADIE' | 'ABSENCE_NON_JUSTIFIEE';

export interface Leave {
  id: number;
  employeeId: number;
  type: LeaveType;
  dateDebut: string;
  dateFin: string;
  jours: number;
  impactPaie: boolean;
  soldeRestant?: number;
  commentaire?: string;
}

