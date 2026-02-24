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
  tauxConversion: number;
  prixAchatHT: number;
  prixVente: number;
  tva: number;
  stock1: number;
  stock2: number;
  pump: number;
  qteNbre: boolean;
  autreIndir: boolean;
  stockezBlock: boolean;
  dateCreation?: string;
  dateModification?: string;
}

export const UNITES_ARTICLE = ['KG', 'Pièce', 'Litre', 'Sac', 'Boîte', 'Carton', 'm²', 'L', 'mL'] as const;
