export interface Attendance {
  id: number;
  employeeId: number;
  date: string;          // YYYY-MM-DD
  heureEntree: string;   // HH:mm
  heureSortie: string;   // HH:mm
  heuresTravaillees: number;
  mode: 'MANUEL' | 'MOBILE';
}

