/**
 * RIB - Relevé d'Identité Bancaire
 * Format: Code Établissement | Code Agence | N° Compte
 */
export interface RIB {
  id: number;
  codeEtablissement: string;
  codeAgence: string;
  numeroCompte: string;
  domiciliation: string;
  fournisseurIds: number[];
}

export function formatRibDisplay(rib: RIB): string {
  return `${rib.codeEtablissement} | ${rib.codeAgence} | ${rib.numeroCompte}`;
}
