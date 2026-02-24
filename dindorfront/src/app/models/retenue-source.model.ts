/**
 * Retenue à la Source — Certificat de Retenue d'Impôt (Tunisie)
 */
export interface RetenueSource {
  id: number;
  numeroRetenue: string;
  fournisseurId: number;
  fournisseurNom: string;
  fournisseurAdresse: string;
  fournisseurMatricule: string;
  fournisseurCodeTVA: string;
  dateRetenue: string;
  lot: string;
  taux: number;
  numeroFacture: string;
  montantBrut: number;
  retenue: number;
  montantNet: number;
  libelle: string;
}

/** Facture simplifiée pour sélection (depuis transactions fournisseur) */
export interface FactureFournisseur {
  numeroFacture: string;
  montantTotal: number;
  date: string;
}
