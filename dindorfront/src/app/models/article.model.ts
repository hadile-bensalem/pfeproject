/**
 * Article pour la gestion des achats et du stock
 */
export interface Article {
  id: number;
  codeArticle: string;
  designation: string;
  unite: string;
  famille: string;
  origine: string;
  tauxConversion?: number;
  codeArticleSource?: string | null;
  /** Produit spécial : base de transfo. Le taux % est saisi sur chaque facture (variable), pas ici. */
  produitSpecial?: boolean;
  prixAchatHT: number;
  prixVente: number;
  prixPublic?: number;
  margeB?: number;
  tva: number;
  stock1: number;
  stock2: number;
  pump: number;
  qteNbre: boolean;
  autreIndir: boolean;
  stockezBlock: boolean;
  imageUrl?: string;
  dateCreation?: string;
  dateModification?: string;
}

export const UNITES_ARTICLE = ['KG', 'Pièce', 'Litre', 'Sac', 'Boîte', 'Carton', 'm²', 'L', 'mL'] as const;
