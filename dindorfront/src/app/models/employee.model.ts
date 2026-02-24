export type ContractType = 'CDI' | 'CDD' | 'JOURNALIER' | 'HORAIRE';

export type EmployeeStatus = 'ACTIF' | 'SUSPENDU' | 'QUITTÉ';

export type Department = 'VENTE' | 'STOCK' | 'LIVRAISON';

export interface Employee {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  cin: string;
  telephone: string;
  email: string;
  adresse: string;
  dateNaissance: string;
  situationFamiliale: string;
  nombreEnfants: number;
  poste: string;
  departement: Department;
  typeContrat: ContractType;
  dateRecrutement: string;
  statut: EmployeeStatus;

  // Rémunération mensuelle
  salaireBase?: number;
  primesFixes?: number;
  primeRendement?: number;

  // Rémunération journalière
  tarifJournalier?: number;
  joursTravail?: number;

  // Rémunération horaire
  tarifHoraire?: number;
  heuresNormales?: number;
  heuresSupplementaires?: number;

  // Statut global
  actif: boolean;
}

