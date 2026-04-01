export interface LigneFactureAchat {
  id?: number;
  codeArticle?: string;
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  remise: number;
  prixRemise: number;
  tva: number;
  totalHT: number;
  montantTVA: number;
  totalTTC: number;
  montantRemise: number;
  ordre?: number;
}

export interface PaiementAchat {
  modePaiement?: string;
  sousMode?: string;
  montantPaye?: number;
  montantReste?: number;
  dateEcheance?: string;
  numeroTraite?: string;
  dateLimiteCredit?: string;
  avecRetenue?: boolean;
}

export interface FactureAchat {
  id?: number;
  numeroFacture: string;
  dateFacture: string;
  fournisseurId: number;
  fournisseurRaisonSociale?: string;
  fournisseurMatricule?: string;
  lignes: LigneFactureAchat[];
  totalBrut: number;
  totalRemise: number;
  totalHT: number;
  totalTVA: number;
  timbreFiscal: number;
  netAPayer: number;
  statut: string;
  paiement?: PaiementAchat;
}

export interface FactureAchatRequest {
  numeroFacture?: string;
  dateFacture: string;
  fournisseurId: number;
  lignes: LigneFactureAchatRequest[];
  paiement?: PaiementAchatRequest;
}

export interface LigneFactureAchatRequest {
  codeArticle?: string;
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  remise: number;
  tva: number;
  ordre?: number;
}

export interface PaiementAchatRequest {
  modePaiement: string;
  sousMode?: string;
  montantPaye: number;
  montantReste: number;
  dateEcheance?: string;
  numeroTraite?: string;
  dateLimiteCredit?: string;
  avecRetenue?: boolean;
}

export interface RetenueAchatRequest {
  numeroDocument?: string;
  dateRetenue: string;
  lieuRetenue: string;
  fournisseurId: number;
  lignes: RetenueLigneRequest[];
}

export interface RetenueLigneRequest {
  numeroFacture: string;
  montantBrut: number;
  tauxRetenue: number;
  ordre?: number;
}
