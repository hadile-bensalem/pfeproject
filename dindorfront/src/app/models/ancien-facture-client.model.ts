/**
 * Formulaire ancienne facture client (régularisation / tasfiyet hsebet)
 */
export interface AncienFactureClientForm {
  id?: number;
  numeroFacture: string;
  date: string;
  clientId: number | null;
  montantHT: number;
  tauxTva: number;
  montantTva: number;
  timbre1: number;
  timbre2: number;
  timbre3: number;
}
