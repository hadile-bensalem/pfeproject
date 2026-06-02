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

  private formatDateLong(d: string): string {
    if (!d) return '';
    const x = new Date(d);
    if (isNaN(x.getTime())) return d;
    const mois = ['Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    return `${x.getDate()} ${mois[x.getMonth()]} ${x.getFullYear()}`;
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

  private matCase(val: string): string {
    return (val || '').split('').map(c => `<div class="mat-box">${this.esc(c)}</div>`).join('');
  }

  generateHtml(retenue: RetenueSource, payeur = PAYEUR_DEFAULT): string {
    const annee   = retenue.dateRetenue ? new Date(retenue.dateRetenue).getFullYear() : new Date().getFullYear();
    const matFisc = (payeur.matriculeFiscal || '').replace(/\s/g, '');
    const codeTVA = (payeur.codeTVA        || '').replace(/\s/g, '');
    const codeCat = (payeur.codeCategorie  || '').replace(/\s/g, '');
    const codeEts = (payeur.etabSecondaire || '000').replace(/\s/g, '');

    const libelleNature = retenue.libelle || 'Honoraires, Commissions, Courtages';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Certificat de Retenue d'Impôt — ${this.esc(retenue.numeroRetenue)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;700;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', Arial, sans-serif;
    font-size: 11px;
    color: #2d3435;
    background: #f9f9f9;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Control bar ── */
  .no-print {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background: #f2f4f4;
    border-bottom: 1px solid #acb3b4;
    position: sticky;
    top: 0;
    z-index: 50;
    gap: 12px;
  }
  .no-print span {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #5e5e5e;
  }
  .no-print-actions { display: flex; gap: 8px; }
  .btn-print {
    display: flex; align-items: center; gap: 6px;
    background: #fff;
    color: #2d3435;
    border: 1px solid #acb3b4;
    padding: 7px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-print:hover { background: #e4e9ea; }
  .btn-dl {
    background: #2d3435;
    color: #fff;
    border: 1px solid #2d3435;
    padding: 7px 20px;
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-dl:hover { background: #525252; }

  /* ── Document wrapper ── */
  main {
    max-width: 780px;
    margin: 32px auto;
    padding: 40px 48px 56px;
    background: #fff;
  }

  /* ── Official header ── */
  .doc-header {
    text-align: center;
    margin-bottom: 28px;
  }
  .doc-header .republic {
    font-family: 'Public Sans', serif;
    font-weight: 900;
    font-size: 16px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #2d3435;
  }
  .doc-header .ministry {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #2d3435;
    margin-top: 3px;
  }
  .doc-header .dgi {
    font-family: 'Inter', sans-serif;
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #5e5e5e;
    margin-top: 2px;
  }
  .emblem {
    width: 52px;
    height: 52px;
    margin: 14px auto 16px;
    display: block;
    filter: grayscale(1) contrast(1.2);
  }
  .doc-title-box {
    display: inline-block;
    border: 2px solid #2d3435;
    padding: 10px 28px;
    margin-top: 6px;
  }
  .doc-title {
    font-family: 'Public Sans', serif;
    font-weight: 900;
    font-size: 17px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #2d3435;
    line-height: 1.25;
  }

  /* ── Sections ── */
  .section { margin-bottom: 16px; }
  .section-head {
    background: #f2f4f4;
    border: 1px solid #2d3435;
    border-bottom: none;
    padding: 5px 10px;
  }
  .section-head span {
    font-family: 'Inter', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #2d3435;
  }
  .section-body {
    border: 1px solid #2d3435;
    padding: 14px 16px;
  }

  /* ── Labels ── */
  .field-label {
    font-family: 'Inter', sans-serif;
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #5e5e5e;
    margin-bottom: 4px;
    display: block;
  }
  .field-value {
    font-family: 'Public Sans', sans-serif;
    font-weight: 700;
    font-size: 13px;
    color: #2d3435;
    border-bottom: 1px dotted #acb3b4;
    min-height: 22px;
    padding-bottom: 2px;
    margin-bottom: 10px;
  }
  .field-value-sm {
    font-family: 'Public Sans', sans-serif;
    font-size: 12px;
    color: #2d3435;
    border-bottom: 1px dotted #acb3b4;
    min-height: 20px;
    padding-bottom: 2px;
    margin-bottom: 10px;
  }

  /* ── Two-column layout ── */
  .cols { display: flex; gap: 24px; }
  .col-2 { flex: 2; }
  .col-1 { flex: 1; }

  /* ── Matricule fiscal boxes ── */
  .mat-row { display: flex; gap: 2px; flex-wrap: wrap; }
  .mat-box {
    width: 22px;
    height: 26px;
    border: 1px solid #2d3435;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 12px;
    color: #2d3435;
  }

  /* ── TVA / Catégorie / Ets row ── */
  .code-row { display: flex; gap: 16px; margin-top: 8px; }
  .code-cell { display: flex; flex-direction: column; gap: 4px; }
  .code-box {
    border: 1px solid #2d3435;
    padding: 4px 8px;
    min-width: 44px;
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 12px;
    color: #2d3435;
  }

  /* ── Retenues table ── */
  .ret-table {
    width: 100%;
    border-collapse: collapse;
  }
  .ret-table th {
    background: #f2f4f4;
    border: 1px solid #2d3435;
    padding: 6px 8px;
    font-family: 'Inter', sans-serif;
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #5e5e5e;
    text-align: left;
  }
  .ret-table td {
    border: 1px solid #2d3435;
    padding: 7px 8px;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: #2d3435;
  }
  .ret-table .num { text-align: right; font-variant-numeric: tabular-nums; }
  .ret-table tbody tr.zero-row td { color: #acb3b4; }
  .ret-table tfoot tr td {
    font-weight: 700;
    font-size: 11.5px;
    background: #f2f4f4;
  }

  /* ── Footer ── */
  .doc-footer { margin-top: 28px; }
  .footer-cert {
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-style: italic;
    line-height: 1.7;
    color: #2d3435;
    text-align: justify;
  }
  .footer-lieu {
    margin-top: 20px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #2d3435;
  }
  .footer-date {
    margin-top: 8px;
    font-family: 'Public Sans', serif;
    font-weight: 700;
    font-size: 14px;
    text-decoration: underline;
    text-underline-offset: 4px;
    color: #2d3435;
  }
  .signature-box {
    border: 1px dashed #acb3b4;
    background: #fafafa;
    padding: 16px;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
  }
  .signature-label {
    font-family: 'Inter', sans-serif;
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #5e5e5e;
  }
  .sig-stamp {
    opacity: 0.08;
    font-size: 56px;
    color: #2d3435;
    margin-top: 8px;
  }
  .footer-grid { display: flex; gap: 48px; margin-top: 28px; }
  .footer-left { flex: 1; }
  .footer-right { flex: 1; }

  .doc-bottom {
    margin-top: 36px;
    padding-top: 8px;
    border-top: 1px solid #acb3b4;
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-size: 7.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #acb3b4;
  }

  @media print {
    .no-print { display: none !important; }
    body { background: #fff; }
    main { margin: 0; padding: 24px 32px 40px; max-width: 100%; box-shadow: none; }
  }
</style>
</head>
<body>

<!-- ── Barre de contrôle (masquée à l'impression) ── -->
<div class="no-print">
  <span>Aperçu du Formulaire Officiel</span>
  <div class="no-print-actions">
    <button class="btn-print" onclick="window.print()">&#128438; Imprimer</button>
    <button class="btn-dl" onclick="window.print()">Télécharger PDF</button>
  </div>
</div>

<main>

  <!-- ════════ EN-TÊTE OFFICIEL ════════ -->
  <div class="doc-header">
    <div class="republic">REPUBLIQUE TUNISIENNE</div>
    <div class="ministry">MINISTERE DES FINANCES</div>
    <div class="dgi">Direction Générale des Impôts</div>
    <img class="emblem"
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Coat_of_arms_of_Tunisia.svg/200px-Coat_of_arms_of_Tunisia.svg.png"
      alt="Armoiries de la Tunisie">
    <div class="doc-title-box">
      <div class="doc-title">Certificat de<br>Retenue d'Impôt</div>
    </div>
  </div>

  <!-- ════════ SECTION A — PAYEUR ════════ -->
  <div class="section">
    <div class="section-head">
      <span>A - Personne ou Organisme Payeur</span>
    </div>
    <div class="section-body">
      <div class="cols">
        <div class="col-2">
          <span class="field-label">Dénomination ou Raison Sociale :</span>
          <div class="field-value">${this.esc(payeur.denomination)}</div>
          <span class="field-label">Adresse de l'établissement :</span>
          <div class="field-value-sm">${this.esc(payeur.adresse)}${payeur.lieu ? ', ' + this.esc(payeur.lieu) : ''}</div>
        </div>
        <div class="col-1">
          <span class="field-label">Matricule Fiscal :</span>
          <div class="mat-row">${this.matCase(matFisc)}</div>
          <div class="code-row">
            <div class="code-cell">
              <span class="field-label">Code TVA</span>
              <div class="code-box">${this.esc(codeTVA) || '&nbsp;'}</div>
            </div>
            <div class="code-cell">
              <span class="field-label">Catégorie</span>
              <div class="code-box">${this.esc(codeCat) || '&nbsp;'}</div>
            </div>
            <div class="code-cell">
              <span class="field-label">Code Ets</span>
              <div class="code-box">${this.esc(codeEts) || '000'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ════════ SECTION B — BÉNÉFICIAIRE ════════ -->
  <div class="section">
    <div class="section-head">
      <span>B - Le Bénéficiaire</span>
    </div>
    <div class="section-body">
      <div class="cols">
        <div class="col-1">
          <span class="field-label">Nom &amp; Prénom ou Raison Sociale :</span>
          <div class="field-value">${this.esc(retenue.fournisseurNom)}</div>
          <span class="field-label">Matricule Fiscal / CIN :</span>
          <div class="field-value">${this.esc(retenue.fournisseurMatricule)}</div>
        </div>
        <div class="col-1">
          <span class="field-label">Adresse Personnelle / Professionnelle :</span>
          <div class="field-value-sm">${this.esc(retenue.fournisseurAdresse)}</div>
          <div style="display:flex; gap:16px;">
            <div style="flex:1;">
              <span class="field-label">Qualité :</span>
              <div class="field-value-sm">${this.esc(libelleNature)}</div>
            </div>
            <div style="flex:1;">
              <span class="field-label">Période :</span>
              <div class="field-value-sm">Année ${annee}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ════════ SECTION C — DÉTAILS DES RETENUES ════════ -->
  <div class="section">
    <div class="section-head">
      <span>C - Détails des Retenues Effectuées</span>
    </div>
    <div class="section-body" style="padding: 0;">
      <table class="ret-table">
        <thead>
          <tr>
            <th style="width:32%;">Nature des Montants Servis</th>
            <th class="num">Montant Brut (TND)</th>
            <th class="num">Taux (%)</th>
            <th class="num">Retenue (TND)</th>
            <th class="num">Montant Net (TND)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${this.esc(libelleNature)}</td>
            <td class="num">${this.formatMontant(retenue.montantBrut)}</td>
            <td class="num">${retenue.taux > 0 ? retenue.taux + '%' : '—'}</td>
            <td class="num">${this.formatMontant(retenue.retenue)}</td>
            <td class="num">${this.formatMontant(retenue.montantNet)}</td>
          </tr>
          <tr class="zero-row">
            <td>Redevances (Royalty)</td>
            <td class="num">0,000</td><td class="num">—</td>
            <td class="num">0,000</td><td class="num">0,000</td>
          </tr>
          <tr class="zero-row">
            <td>Loyer et Primes de location</td>
            <td class="num">0,000</td><td class="num">—</td>
            <td class="num">0,000</td><td class="num">0,000</td>
          </tr>
          <tr class="zero-row">
            <td>Autres sommes soumises à retenue</td>
            <td class="num">0,000</td><td class="num">—</td>
            <td class="num">0,000</td><td class="num">0,000</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td><strong>TOTAUX GÉNÉRAUX</strong></td>
            <td class="num">${this.formatMontant(retenue.montantBrut)}</td>
            <td class="num">—</td>
            <td class="num">${this.formatMontant(retenue.retenue)}</td>
            <td class="num">${this.formatMontant(retenue.montantNet)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- ════════ PIED DE PAGE OFFICIEL ════════ -->
  <div class="doc-footer">
    <div class="footer-grid">
      <div class="footer-left">
        <p class="footer-cert">
          Je soussigné, certifie exacts les renseignements contenus dans le présent certificat
          et je m'expose aux sanctions prévues par la loi en cas d'inexactitude de ces renseignements.
        </p>
        <p class="footer-lieu" style="margin-top:20px;">
          Fait à ................................, le ......................
        </p>
        <p class="footer-date">${this.formatDateLong(retenue.dateRetenue)}</p>
      </div>
      <div class="footer-right">
        <div class="signature-box">
          <span class="signature-label">Cachet et Signature du Payeur</span>
          <div class="sig-stamp">✦</div>
        </div>
      </div>
    </div>
  </div>

  <div class="doc-bottom">
    Document généré par le système d'administration fiscale — Tunisie
  </div>

</main>
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
