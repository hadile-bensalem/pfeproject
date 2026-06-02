export type StatutTraite = 'non_imprimee' | 'imprimee' | 'echue';

export interface Traite {
  id: number;
  ordrePaiement: string;

  faitA?: string;

  // ── RIB inline (nouveau formulaire traites) ────────────────────────
  ribCodeEtab?:    string;
  ribCodeAgence?:  string;
  ribNumeroCompte?: string;
  ribCle?:         string;

  // ── RIB par référence (ancien formulaire éléments) ─────────────────
  ribId?: number;

  domiciliation?: string;

  fournisseurId?: number;
  fournisseurNom?: string;

  // Tireur (ساحب) — émetteur de la traite
  tireur?: string;

  // Tiré (مسحوب عليه) — fournisseur / destinataire
  tire?:           string;    // ancien champ (éléments)
  nomAdresseTire?: string;    // nouveau champ (page traites)

  montant:         number;
  montantLettres?: string;

  dateCreation:  string;
  dateEcheance:  string;

  lieuCreation?: string;
  valeurEn?:     string;

  statut: StatutTraite;
}
