/**
 * Traite - Lettre de Change (Bill of Exchange)
 */
export type StatutTraite = 'non_imprimee' | 'imprimee' | 'echue';

export interface Traite {
  id: number;
  ordrePaiement: string;
  ribId: number;
  fournisseurId: number;
  fournisseurNom: string;
  tireur: string;
  tire: string;
  montant: number;
  montantLettres: string;
  dateCreation: string;
  dateEcheance: string;
  lieuCreation: string;
  domiciliation: string;
  nomAdresseTire: string;
  valeurEn: string;
  statut: StatutTraite;
}
