export interface BonLivraisonLigne {
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

export interface BonLivraison {
  id: number;
  numeroBL: string;
  dateBL: string;
  clientId: number | null;
  clientCode: string;
  clientNom: string;
  clientAdresse: string;
  clientMF: string;
  transporteurId: number | null;
  vehiculeId: number | null;
  transporteurNom: string;
  vehiculeNumero: string;
  soldeSurBL: number;
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
  lignes: BonLivraisonLigne[];
}

export interface VenteStats {
  chiffreAffaire: number;
  totalQteVendue: number;
  nombreBons: number;
  montantCredit: number;
  montantEspeces: number;
  benefice: number;
  detailArticles: DetailArticleVente[];
}

export interface DetailArticleVente {
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
  numeroBL: string;
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  totalHT: number;
}
