export interface Client {
  id: number;
  codeClient: string;
  typeClient: string;         // ETATIQUE | CLIENT_DIVERS | AUTRE | AMBULANT
  nom: string;
  responsable: string;
  telephone: string;
  telephone2: string;
  fax: string;
  email: string;
  adresse: string;
  ville: string;
  zone: string;
  matriculeFiscal: string;
  codeTVA: string;
  tva: number;
  prixVente: number;
  plafond: number;
  devise: string;
  dateInscription: string;
  notes: string;
  actif: boolean;
  soldeTotalDu: number;
}

export interface PaiementClient {
  id: number;
  clientId: number;
  clientNom: string;
  montant: number;
  datePaiement: string;
  notes: string;
  blNumeros: string;
  modePaiement: 'ESPECE' | 'CHEQUE' | 'TRAITE';
  numeroPaiement: string;
  echeance: string;
  banque: string;
  dateCreation: string;
}
