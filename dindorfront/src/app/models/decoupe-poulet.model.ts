export type ProduitDecoupe = 'ESCALOPE' | 'CARCASSE' | 'CUISSE' | 'AILES' | 'ABAT';

export interface ProduitMeta {
  code: ProduitDecoupe;
  label: string;
  unite: string;
}

export const PRODUITS_DECOUPE: ProduitMeta[] = [
  { code: 'ESCALOPE', label: 'Escalope',          unite: 'kg'    },
  { code: 'CARCASSE', label: 'Carcasse',           unite: 'unité' },
  { code: 'CUISSE',   label: 'Cuisse de poulet',   unite: 'kg'    },
  { code: 'AILES',    label: 'Ailes',              unite: 'kg'    },
  { code: 'ABAT',     label: 'Abat',               unite: 'kg'    },
];

export interface DecoupePouletLigne {
  id?: number;
  produit: ProduitDecoupe;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  totalValeur: number;
  calcule: boolean;
}

export interface DecoupePoulet {
  id?: number;
  dateDecoupe: string;
  numeroLot: string;
  qteAchetee: number;
  prixUnitaireAchat: number;
  totalAchat: number;
  produitCalcule: ProduitDecoupe;
  dateCreation?: string;
  lignes: DecoupePouletLigne[];
}
