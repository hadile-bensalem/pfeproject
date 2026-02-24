/**
 * Ligne du tableau récapitulatif "État Fournisseur"
 */
export interface FournisseurEtat {
  fournisseurId: number;
  nom: string;
  matricule: string;
  solde: number;
  traitementEnCours: number;
}

/**
 * Transaction d'un fournisseur (historique détaillé)
 */
export interface TransactionFournisseur {
  id: number;
  fournisseurId: number;
  numeroFacture: string;
  date: string; // ISO date
  debit: number;
  credit: number;
  espece: number;
  modePaiement: string; // TRA, ESP, CHQ, etc.
}

/**
 * Résumé financier pour la vue détail
 */
export interface ResumeFournisseur {
  totalGeneral: number;
  solde: number;
  totalDebit: number;
  totalCredit: number;
}
