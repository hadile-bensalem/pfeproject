export interface Client {
  id: number;
  codeClient: string;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  observations: string;
  dateCreation: string;
  dateModification: string;
}

export interface ClientEtat {
  clientId: number;
  codeClient: string;
  nomClient: string;
  solde: number;
  traitementEnCours: number;
}

export interface TransactionClient {
  id: number;
  clientId: number;
  numeroFacture: string;
  date: string;
  debit: number;
  credit: number;
  espece: number;
  modePaiement: string;
}
