import { Injectable } from '@angular/core';
import { Traite } from '../models/traite.model';
import { RIB } from '../models/rib.model';

@Injectable({ providedIn: 'root' })
export class LettreDeChangeService {

  private fmtD(iso?: string | null): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  private fmtN(v: number): string {
    return (v ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }

  private e(s?: string | null): string {
    return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Génère un HTML calque transparent à imprimer sur la traite physique.
   *
   * FORMAT PAPIER : A5 paysage  210mm × 148mm
   * IMPRESSION    : Marges = Aucune  |  Échelle = 100%  |  Pas d'en-tête ni pied de page
   *
   * Procédure :
   *   1. Placer la traite physique vierge dans le bac imprimante (face imprimable vers le haut).
   *   2. Ouvrir l'aperçu (bouton "Voir") → vérifier l'alignement visuel.
   *   3. Lancer l'impression (bouton "⎙ Imprimer").
   *   4. Dans la boîte de dialogue du navigateur :
   *      - Format : A5 paysage (ou Personnalisé 210×148mm)
   *      - Marges : Aucune (None)
   *      - Échelle : 100 %
   *      - Décocher "En-têtes et pieds de page"
   *
   * Positions mesurées sur le formulaire normalisé tunisien (BCT/STB).
   */
  generateHtml(traite: Traite, rib: RIB | null): string {
    // ── RIB ────────────────────────────────────────────────────────
    const codeEtab   = traite.ribCodeEtab    ?? rib?.codeEtablissement ?? '';
    const codeAgence = traite.ribCodeAgence  ?? rib?.codeAgence        ?? '';
    const numCompte  = traite.ribNumeroCompte ?? rib?.numeroCompte      ?? '';
    const cle        = traite.ribCle         ?? '';
    const domicil    = traite.domiciliation  ?? rib?.domiciliation     ?? '';

    // ── Tiré (multi-lignes) ─────────────────────────────────────────
    const tireLines = (traite.nomAdresseTire ?? '').split('\n');
    const tire1 = tireLines[0] ?? '';
    const tire2 = tireLines[1] ?? '';
    const tire3 = tireLines[2] ?? '';

    // ── Montant ─────────────────────────────────────────────────────
    const montantStr  = this.fmtN(traite.montant);
    const lettresStr  = (traite.montantLettres ?? '').toUpperCase();

    return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8">
<title>Traite LC – calque impression</title>
<style>
  /* ── Page : A5 paysage, zéro marge ──────────────────────────── */
  @page {
    size: 210mm 148mm landscape;
    margin: 0;
  }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }

  html, body {
    width:  210mm;
    height: 148mm;
    background: transparent;
    overflow: hidden;
  }

  /* ── Classe de base pour tous les champs ────────────────────── */
  .f {
    position: absolute;
    font-family: 'Arial Narrow', Arial, Helvetica, sans-serif;
    font-weight: 700;
    font-size: 8.5pt;
    color: #000;
    line-height: 1;
    white-space: nowrap;
  }
  .sm  { font-size: 7.5pt; }
  .med { font-size: 9pt; }
  .lg  { font-size: 10pt; }
  .normal { font-weight: 400; }
  .wrap   { white-space: normal; }
  .mono   { letter-spacing: 1.5px; }
</style>
</head>
<body>

<!-- ══════════════════════════════════════════════════════════════
     SECTION HAUTE (coupon détachable) — top: 0..73mm
     ══════════════════════════════════════════════════════════════ -->

<!-- N° ordre de paiement (haut droit) -->
<span class="f mono" style="top:17mm; left:163mm;">${this.e(traite.ordrePaiement)}</span>

<!-- Échéance (haut) -->
<span class="f med" style="top:25mm; left:47mm;">${this.fmtD(traite.dateEcheance)}</span>

<!-- À (ville)  -->
<span class="f med" style="top:25mm; left:95mm;">${this.e(traite.faitA)}</span>

<!-- Le (date création haut) -->
<span class="f med" style="top:25mm; left:120mm;">${this.fmtD(traite.dateCreation)}</span>

<!-- Montant chiffres case 1 (haut droit) -->
<span class="f med mono" style="top:32mm; left:153mm;">${this.e(montantStr)}</span>

<!-- RIB haut : code étab. -->
<span class="f mono" style="top:37mm; left:9mm;">${this.e(codeEtab)}</span>
<!-- RIB haut : code agence -->
<span class="f mono" style="top:37mm; left:27mm;">${this.e(codeAgence)}</span>
<!-- RIB haut : n° compte -->
<span class="f mono" style="top:37mm; left:50mm;">${this.e(numCompte)}</span>
<!-- RIB haut : clé -->
<span class="f mono" style="top:37mm; left:138mm;">${this.e(cle)}</span>

<!-- Montant chiffres case 2 -->
<span class="f med mono" style="top:37mm; left:153mm;">${this.e(montantStr)}</span>

<!-- Tireur (ساحب) -->
<span class="f" style="top:50mm; left:48mm;">${this.e(traite.tireur)}</span>

<!-- Montant chiffres case 3 -->
<span class="f med mono" style="top:50mm; left:153mm;">${this.e(montantStr)}</span>

<!-- Montant en lettres (ligne entière) -->
<span class="f wrap" style="top:63mm; left:10mm; right:5mm; line-height:1.3;">${this.e(lettresStr)}</span>


<!-- ══════════════════════════════════════════════════════════════
     SECTION BASSE (corps de la traite) — top: 73mm..148mm
     ══════════════════════════════════════════════════════════════ -->

<!-- Lieu de création (bas) -->
<span class="f med" style="top:79mm; left:12mm;">${this.e(traite.lieuCreation)}</span>

<!-- Date de création (bas) -->
<span class="f med" style="top:79mm; left:66mm;">${this.fmtD(traite.dateCreation)}</span>

<!-- Échéance (bas) -->
<span class="f med" style="top:79mm; left:110mm;">${this.fmtD(traite.dateEcheance)}</span>

<!-- RIB bas : code étab. -->
<span class="f mono" style="top:99mm; left:6mm;">${this.e(codeEtab)}</span>
<!-- RIB bas : code agence -->
<span class="f mono" style="top:99mm; left:21mm;">${this.e(codeAgence)}</span>
<!-- RIB bas : n° compte -->
<span class="f mono" style="top:103mm; left:37mm;">${this.e(numCompte)}</span>
<!-- RIB bas : clé -->
<span class="f mono" style="top:103mm; left:126mm;">${this.e(cle)}</span>

<!-- Domiciliation bancaire -->
<span class="f" style="top:96mm; left:140mm;">${this.e(domicil)}</span>

<!-- Valeur en -->
<span class="f" style="top:111mm; left:83mm;">${this.e(traite.valeurEn ?? 'DT')}</span>

<!-- Nom tiré ligne 1 -->
<span class="f med" style="top:114mm; left:82mm;">${this.e(tire1)}</span>
<!-- Nom tiré ligne 2 -->
<span class="f normal" style="top:121mm; left:82mm;">${this.e(tire2)}</span>
<!-- Nom tiré ligne 3 -->
<span class="f normal" style="top:127mm; left:82mm;">${this.e(tire3)}</span>

</body></html>`;
  }

  /**
   * Ouvre le calque dans une nouvelle fenêtre.
   * autoPrint = true → lance directement l'impression.
   */
  openPrintWindow(traite: Traite, rib: RIB | null, autoPrint = false): void {
    const w = window.open('', '_blank', 'width=960,height=700');
    if (!w) {
      alert('Les popups sont bloqués.\nAutorisez les popups pour ce site pour imprimer.');
      return;
    }
    w.document.write(this.generateHtml(traite, rib));
    w.document.close();
    if (autoPrint) {
      w.onload = () => setTimeout(() => { w.focus(); w.print(); }, 300);
    }
  }
}
