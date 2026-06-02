export interface FournisseurEtat {
  fournisseurId: number;
  nom: string;
  matricule: string;
  solde: number;
  traitementEnCours: number;
}

export interface TransactionFournisseur {
  id: number;
  /** Présent uniquement sur les PaiementFournisseur (règlements supprimables) */
  paiementFournisseurId?: number;
  type: string;           // 'Achat' | 'TRAITE' | 'Espèces' | 'Crédit' | 'Règlement'
  numeroFacture: string;
  date: string;
  debit: number;
  credit: number;
  soldeCumule: number;
  modePaiement: string;
  numeroTraite?: string;
  echeance?: string;
  espece: number;
}

export interface PaiementFournisseurRequest {
  montant: number;
  datePaiement: string;
  modePaiement: 'ESPECE' | 'CHEQUE' | 'TRAITE';
  numeroPaiement?: string;
  echeance?: string;
  banque?: string;
  remarque?: string;
  numeroFacture?: string;
}

export interface ResumeFournisseur {
  totalGeneral: number;
  solde: number;
  totalDebit: number;
  totalCredit: number;
}
