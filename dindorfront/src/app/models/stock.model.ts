export interface StockArticle {
  id: number;
  codeArticle: string;
  designation: string;
  famille: string;
  unite: string;
  /** Stock physique confirmé (achats validés). */
  stock: number;
  /** Quantité réservée pour des commandes en cours. */
  stockReserve: number;
  /** Quantité attendue via achats en brouillon. */
  stockEnAttente: number;
  /** stock - stockReserve */
  disponibleReel: number;
  /** stock + stockEnAttente - stockReserve */
  disponiblePrevu: number;
  stockMinimum: number;
  pump: number;
  valeurStock: number;
  enAlerte: boolean;
  enRupture: boolean;
  estDerive: boolean;
  codeArticleSource?: string;
}

export interface LotStockResponse {
  id: number;
  numeroFacture: string;
  fournisseurNom: string;
  fournisseurMatricule: string;
  dateEntree: string;
  prixUnitaire: number;
  qteOrigineInitiale: number;
  qteOrigineRestante: number;
  tauxConversion?: number;
  qteDeriveInitiale?: number;
  qteDeriveRestante?: number;
  actif: boolean;
  articleOrigineCode: string;
  articleOrigineDesignation: string;
  articleDeriveCode?: string;
  articleDeriveDesignation?: string;
}

export interface DisponibiliteResult {
  statut: 'DISPONIBLE' | 'EN_ATTENTE_STOCK' | 'INSUFFISANT';
  disponibleReel: number;
  disponiblePrevu: number;
  message: string;
}

export interface MouvementStock {
  id: number;
  codeArticle: string;
  designation: string;
  typeMouvement: string;
  quantite: number;
  prixUnitaire: number;
  pumpApres: number;
  stockAvant: number;
  stockApres: number;
  referenceDocument: string;
  notes: string;
  dateOperation: string;
}

export interface StockDashboard {
  valeurTotale: number;
  nombreArticles: number;
  articlesEnAlerte: number;
  articlesEnRupture: number;
  parFamille: FamilleValeur[];
}

export interface FamilleValeur {
  famille: string;
  valeur: number;
  nombreArticles: number;
}
