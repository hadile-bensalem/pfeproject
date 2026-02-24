import { Injectable } from '@angular/core';
import { RetenueSource } from '../models/retenue-source.model';

const PAYEUR_DEFAULT = {
  denomination: 'STE DINDOR',
  adresse: 'RUE IBN CHAREF',
  lieu: 'KSIBET',
  matriculeFiscal: '',
  codeTVA: '',
  codeCategorie: '',
  etabSecondaire: ''
};

@Injectable({ providedIn: 'root' })
export class CertificatRetenueService {
  private formatDate(d: string): string {
    if (!d) return '';
    const x = new Date(d);
    if (isNaN(x.getTime())) return d;
    return x.getDate().toString().padStart(2, '0') + '/' +
      (x.getMonth() + 1).toString().padStart(2, '0') + '/' + x.getFullYear();
  }

  private formatMontant(m: number): string {
    return m.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private esc(s: string | undefined | null): string {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  generateHtml(retenue: RetenueSource, payeur = PAYEUR_DEFAULT): string {
    const annee = retenue.dateRetenue ? new Date(retenue.dateRetenue).getFullYear() : new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Certificat de Retenue d'Impôt</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', serif; font-size: 11px; line-height: 1.4; color: #1a1a1a; padding: 20px; }
  .certificat { max-width: 800px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 16px; }
  .header-left { text-align: left; }
  .header-left .rep { font-weight: 700; font-size: 12px; }
  .header-left .ministere { font-size: 11px; margin-top: 2px; }
  .header-right { text-align: right; margin-top: -50px; }
  .header-right .titre { font-weight: 700; font-size: 10px; text-transform: uppercase; }
  .retenue-date { margin: 12px 0; font-weight: 600; }
  .section { margin: 14px 0; }
  .section-title { font-weight: 700; font-size: 11px; margin-bottom: 8px; }
  table.id-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  table.id-table td { border: 1px solid #333; padding: 4px 8px; }
  table.id-table .label { font-weight: 600; width: 140px; background: #f5f5f5; }
  .denomination { font-weight: 700; margin: 4px 0; }
  table.ret-table { width: 100%; border-collapse: collapse; }
  table.ret-table th, table.ret-table td { border: 1px solid #333; padding: 5px 8px; text-align: left; }
  table.ret-table th { background: #f0f0f0; font-weight: 600; }
  table.ret-table .num { text-align: right; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #333; font-size: 10px; }
  .print-btn { position: fixed; top: 10px; right: 10px; background: #8B1A1A; color: #fff; border: none; padding: 8px 16px; cursor: pointer; z-index: 100; }
  @media print { .print-btn { display: none; } body { padding: 0; } }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Imprimer</button>
<div class="certificat">
  <div class="header">
    <div class="header-left">
      <div class="rep">REPUBLIQUE TUNISIENNE</div>
      <div class="ministere">MINISTERE DU PLAN ET DES FINANCES</div>
      <div class="ministere">DIRECTION GENERALE DU CONTROLE FISCAL</div>
    </div>
    <div class="header-right">
      <div class="titre">Certificat de Retenue d'Impôt sur le Revenu ou d'Impôt sur les Sociétés</div>
    </div>
  </div>

  <div class="retenue-date">Retenue effectuée le : ${this.formatDate(retenue.dateRetenue)} (Année ${annee})</div>

  <div class="section">
    <div class="section-title">Section A — Personne ou Organisme Payeur</div>
    <table class="id-table">
      <tr><td class="label">Matricule Fiscal</td><td>${this.esc(payeur.matriculeFiscal)}</td><td class="label">Code TVA</td><td>${this.esc(payeur.codeTVA)}</td></tr>
      <tr><td class="label">Code Catégorie</td><td>${this.esc(payeur.codeCategorie)}</td><td class="label">N° Étab. Secondaire</td><td>${this.esc(payeur.etabSecondaire)}</td></tr>
    </table>
    <div class="denomination">Dénomination : ${this.esc(payeur.denomination)}</div>
    <div>Adresse : ${this.esc(payeur.adresse)} — Lieu : ${this.esc(payeur.lieu)}</div>
  </div>

  <div class="section">
    <div class="section-title">Section B — Retenues Effectuées Sur</div>
    <table class="ret-table">
      <thead><tr><th>Libellé</th><th>Facture</th><th class="num">Montant Brut</th><th class="num">Retenue</th><th class="num">Montant Net</th></tr></thead>
      <tbody>
        <tr>
          <td>${this.esc(retenue.libelle || 'Retenue à la source marché')}</td>
          <td>${this.esc(retenue.numeroFacture)}</td>
          <td class="num">${this.formatMontant(retenue.montantBrut)}</td>
          <td class="num">${this.formatMontant(retenue.retenue)}</td>
          <td class="num">${this.formatMontant(retenue.montantNet)}</td>
        </tr>
        <tr style="font-weight:700; background:#f8f8f8;">
          <td colspan="2">Total Général</td>
          <td class="num">${this.formatMontant(retenue.montantBrut)}</td>
          <td class="num">${this.formatMontant(retenue.retenue)}</td>
          <td class="num">${this.formatMontant(retenue.montantNet)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Section C — Bénéficiaire</div>
    <table class="id-table">
      <tr><td class="label">Matricule Fiscal</td><td>${this.esc(retenue.fournisseurMatricule)}</td><td class="label">Code TVA</td><td>${this.esc(retenue.fournisseurCodeTVA)}</td></tr>
    </table>
    <div class="denomination">Raison sociale : ${this.esc(retenue.fournisseurNom)}</div>
    <div>Adresse professionnelle : ${this.esc(retenue.fournisseurAdresse)}</div>
  </div>

  <div class="footer">
    <p>Je soussigné, certifie exactes les renseignements figurant sur le présent certificat et m'expose aux sanctions prévues par la loi pour toute inexactitude.</p>
    <p style="margin-top: 24px; text-align: right;">A _________________________ LE ${this.formatDate(retenue.dateRetenue)}</p>
    <p style="margin-top: 8px; text-align: right; font-size: 9px;">Cachet et signature du payeur</p>
  </div>
</div>
</body>
</html>`;
  }

  openPrintWindow(retenue: RetenueSource, payeur?: Partial<{ denomination: string; adresse: string; lieu: string; matriculeFiscal: string; codeTVA: string }>, autoPrint = false): void {
    const p = payeur ? { ...PAYEUR_DEFAULT, ...payeur } : PAYEUR_DEFAULT;
    const html = this.generateHtml(retenue, p);
    const w = window.open('', '_blank', 'width=900,height=800,scrollbars=yes');
    if (!w) {
      alert('Veuillez autoriser les fenêtres popup pour afficher le certificat.');
      return;
    }
    w.document.write(html);
    w.document.close();
    if (autoPrint) w.onload = () => setTimeout(() => w.print(), 300);
  }
}
