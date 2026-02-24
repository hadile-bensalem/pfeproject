export type ModePaiementDepense = 'Espèce' | 'Chèque' | 'Virement';

export const CATEGORIES_DEPENSE = [
  'Charges fixes',
  'Transport',
  'Salaire',
  'Loyer',
  'Carburant',
  'Divers'
] as const;

export type CategorieDepense = (typeof CATEGORIES_DEPENSE)[number];

export interface Depense {
  id: number;
  date: string;
  libelle: string;
  categorie: string;
  montant: number;
  modePaiement: ModePaiementDepense;
  remarque: string;
}
