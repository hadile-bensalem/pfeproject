export type TypeTravailleur = 'PERMANENT' | 'SAISONNIER';

export interface Travailleur {
  id: number;
  nom: string;
  prenom: string;
  cin: string;
  adresse?: string;
  telephone?: string;
  dateNaissance?: string;
  dateEmbauche: string;
  typeTravailleur: TypeTravailleur;
  statutCNSS: boolean;
  tarifJournalier: number;
  heuresTravailJour: number;
  rendement: number;
  observations?: string;
  actif: boolean;
  salaireFinal?: number;
}

