export interface Fournisseur {
  id: number;
  matricule: string;
  raisonSociale: string;
  adresse: string;
  codeTVA: string;
  telephone1: string;
  telephone2: string;
  email: string;
  responsableContact: string;
  devise: string;
  observations: string;
  avecRS: boolean;
  dateCreation: string;
  dateModification: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

