/**
 * Formulaire d'ajout d'une ancienne facture fournisseur (régularisation des comptes)
 */
export interface AncienFactureForm {
  id?: number;
  numeroFacture: string;
  date: string; // yyyy-mm-dd pour input date
  fournisseurId: number | null;
  montantHT: number;
  tauxTva: number;
  montantTva: number;
  timbre1: number;
  timbre2: number;
  timbre3: number;
}
