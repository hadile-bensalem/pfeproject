export interface FactureClientLigne {
  id: number;
  codeArticle: string;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaireHT: number;
  remise: number;
  tva: number;
  totalHT: number;
  montantTVA: number;
  montantRemise: number;
  prixRevient: number;
  ordre: number;
}

export interface FactureClient {
  id: number;
  typeDocument?: 'FACTURE' | 'BON_LIVRAISON';
  numeroFacture: string;
  dateFacture: string;
  clientId: number | null;
  clientCode: string;
  clientNom: string;
  clientAdresse: string;
  clientMF: string;
  soldeSurFacture: number;
  totalBrut: number;
  totalRemise: number;
  totalHT: number;
  totalTVA: number;
  timbreFiscal: number;
  netAPayer: number;
  montantEnLettres: string;
  etatPaiement: 'EN_ATTENTE' | 'PARTIEL' | 'PAYE';
  modePaiement: 'ESPECES' | 'CREDIT';
  montantPaye: number;
  montantReste: number;
  dateLimiteCredit: string | null;
  benefice: number;
  lignes: FactureClientLigne[];
}

export interface FactureClientStats {
  chiffreAffaire: number;
  totalQteVendue: number;
  nombreBons: number;
  montantCredit: number;
  montantEspeces: number;
  benefice: number;
  detailArticles: DetailArticleFacture[];
}

export interface DetailArticleFacture {
  codeArticle: string;
  libelle: string;
  qteSortie: number;
  montantHT: number;
}

export interface TopArticleClient {
  codeArticle: string;
  designation: string;
  unite: string;
  totalQte: number;
  nbBons: number;
  avgPrix: number;
}

export interface RapportPeriodeRow {
  date: string;
  numeroFacture: string;
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  totalHT: number;
}
