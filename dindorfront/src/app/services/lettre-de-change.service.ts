import { Injectable } from '@angular/core';
import { Traite } from '../models/traite.model';
import { RIB } from '../models/rib.model';

@Injectable({ providedIn: 'root' })
export class LettreDeChangeService {

  /** Formate une date YYYY-MM-DD en DD/MM/YYYY */
  private formatDate(d: string): string {
    if (!d) return '';
    const x = new Date(d);
    if (isNaN(x.getTime())) return d;
    return x.getDate().toString().padStart(2, '0') + '/' +
      (x.getMonth() + 1).toString().padStart(2, '0') + '/' + x.getFullYear();
  }

  /** Formate le montant pour affichage */
  private formatMontant(m: number): string {
    return m.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }

  /** RIB: extrait partie principale et clé (dernier chiffre si 14+ caractères) */
  private splitRib(numeroCompte: string): { main: string; cle: string } {
    const n = (numeroCompte || '').trim();
    if (n.length >= 14) {
      return { main: n.slice(0, -1), cle: n.slice(-1) };
    }
    return { main: n, cle: '' };
  }

  /** Génère un code-barres visuel simple à partir du numéro d'ordre */
  private barcodePattern(ordre: string): string {
    const s = (ordre || '').replace(/\D/g, '');
    const pattern: number[] = [];
    for (let i = 0; i < Math.min(s.length, 30); i++) {
      const v = parseInt(s[i], 10);
      pattern.push((v % 3) + 1);
    }
    return pattern.length ? pattern.join(',') : '3,1,2,1,3';
  }

  generateHtml(traite: Traite, rib: RIB | null): string {
    const r = rib || {
      codeEtablissement: '',
      codeAgence: '',
      numeroCompte: '',
      domiciliation: ''
    } as RIB;
    const { main: ribMain, cle: ribCle } = this.splitRib(r.numeroCompte);
    const echeance = this.formatDate(traite.dateEcheance);
    const dateCreation = this.formatDate(traite.dateCreation);
    const montant = this.formatMontant(traite.montant);
    const bcPattern = this.barcodePattern(traite.ordrePaiement);

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lettre de Change – République Tunisienne</title>
<link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=IM+Fell+English+SC&family=Crimson+Pro:wght@300;400;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: radial-gradient(ellipse at center, #3d1f0a 0%, #1a0a00 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px;
    font-family: 'Crimson Pro', serif;
  }
  .lettre {
    width: 980px;
    background: #fdf8ee;
    position: relative;
    box-shadow: 0 0 0 1px #b8860b, 0 0 0 4px #fdf8ee, 0 0 0 6px #8b1c1c, 0 20px 60px rgba(0,0,0,0.7);
  }
  .lettre::before {
    content: 'LETTRE DE CHANGE';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-family: 'Playfair Display', serif;
    font-size: 80px;
    font-weight: 700;
    color: rgba(139,28,28,0.04);
    letter-spacing: 8px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
  }
  .inner-border {
    position: absolute;
    inset: 8px;
    border: 1px solid #c8973a;
    pointer-events: none;
    z-index: 1;
  }
  .inner-border::before {
    content: '';
    position: absolute;
    inset: 3px;
    border: 0.5px solid rgba(200,151,58,0.4);
  }
  .corner {
    position: absolute;
    width: 28px; height: 28px;
    z-index: 2;
  }
  .corner svg { width: 100%; height: 100%; }
  .corner-tl { top: 4px; left: 4px; }
  .corner-tr { top: 4px; right: 4px; transform: scaleX(-1); }
  .corner-bl { bottom: 4px; left: 4px; transform: scaleY(-1); }
  .corner-br { bottom: 4px; right: 4px; transform: scale(-1,-1); }
  .header {
    background: linear-gradient(180deg, #6b0f0f 0%, #9b1c1c 30%, #b52020 50%, #9b1c1c 70%, #6b0f0f 100%);
    position: relative;
    display: grid;
    grid-template-columns: 160px 1fr 160px;
    align-items: center;
    padding: 0;
    border-bottom: 3px solid #c8973a;
    overflow: hidden;
    z-index: 2;
  }
  .header::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(200,151,58,0.08) 8px, rgba(200,151,58,0.08) 9px);
    pointer-events: none;
  }
  .header-republic { padding: 10px 14px; color: rgba(255,255,255,0.9); z-index: 1; }
  .republic-line { font-family: 'Amiri', serif; font-size: 12px; line-height: 1.6; text-align: center; }
  .republic-line .ar { font-size: 14px; direction: rtl; display: block; color: #f5d98a; }
  .header-center { text-align: center; z-index: 1; padding: 8px 0; }
  .title-lettre { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: white; letter-spacing: 3px; text-shadow: 0 2px 8px rgba(0,0,0,0.4); }
  .title-de { font-family: 'IM Fell English SC', serif; font-size: 13px; color: #f5d98a; letter-spacing: 5px; margin: 2px 0; }
  .title-change { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: #f5d98a; letter-spacing: 4px; text-shadow: 0 2px 8px rgba(0,0,0,0.4); }
  .title-divider { margin: 4px 0; color: rgba(200,151,58,0.7); font-size: 10px; letter-spacing: 6px; }
  .title-bill { font-family: 'IM Fell English SC', serif; font-size: 11px; color: rgba(255,255,255,0.7); letter-spacing: 4px; }
  .title-exchange { font-family: 'Playfair Display', serif; font-size: 16px; font-style: italic; color: rgba(255,255,255,0.85); letter-spacing: 2px; }
  .header-stamp { padding: 10px 14px; display: flex; flex-direction: column; align-items: center; gap: 6px; z-index: 1; }
  .stamp-box {
    border: 1.5px solid rgba(245,217,138,0.5);
    padding: 6px 10px;
    font-size: 8px;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.7);
    text-align: center;
    font-family: 'IM Fell English SC', serif;
    background: rgba(0,0,0,0.15);
  }
  .timbre {
    width: 48px; height: 48px;
    border: 2px solid rgba(245,217,138,0.4);
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7px;
    color: rgba(255,255,255,0.4);
    text-align: center;
    font-family: 'Amiri', serif;
  }
  .body { padding: 14px 20px 10px; position: relative; z-index: 2; }
  .lbl {
    font-family: 'Crimson Pro', serif;
    font-size: 9.5px;
    color: #8b1c1c;
    font-weight: 600;
    letter-spacing: 0.2px;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 1px;
  }
  .lbl .ar { font-family: 'Amiri', serif; font-size: 10px; color: #5a3a00; direction: rtl; }
  .fld {
    border: none;
    border-bottom: 1px solid #b8860b;
    background: transparent;
    min-height: 20px;
    padding: 2px 4px;
    font-family: 'Crimson Pro', serif;
    font-size: 12px;
    color: #1a0a00;
    outline: none;
    width: 100%;
  }
  .fld.tall { min-height: 44px; }
  .fld.sig { min-height: 54px; }
  .fld.bold-val { font-size: 16px; font-weight: 700; color: #8b1c1c; font-family: 'Playfair Display', serif; border-bottom: 2px solid #8b1c1c; }
  .fg { margin-bottom: 7px; }
  .row { display: flex; gap: 14px; margin-bottom: 8px; }
  .col { flex: 1; }
  .rib-wrap { display: flex; align-items: flex-end; gap: 3px; }
  .rib-cell {
    border-bottom: 1px solid #b8860b;
    min-height: 20px;
    padding: 2px 3px;
    font-family: 'Crimson Pro', serif;
    font-size: 12px;
    text-align: center;
    background: transparent;
  }
  .rib-w30 { width: 30px; }
  .rib-w36 { width: 36px; }
  .rib-w140 { width: 140px; flex: 1; }
  .rib-w24 { width: 24px; }
  .rib-sep { font-size: 9px; color: #8b1c1c; padding-bottom: 3px; white-space: nowrap; }
  .contre {
    border: 1px solid #b8860b;
    background: linear-gradient(135deg, #fdf5dc 0%, #fdf8ee 100%);
    padding: 8px 12px;
    margin-bottom: 10px;
    position: relative;
  }
  .contre::before { content: ''; position: absolute; inset: 2px; border: 0.5px solid rgba(184,134,11,0.3); pointer-events: none; }
  .contre-title { font-family: 'Playfair Display', serif; font-size: 11px; color: #6b0f0f; font-weight: 700; margin-bottom: 6px; letter-spacing: 0.3px; }
  .contre-title .ar { font-family: 'Amiri', serif; font-weight: 400; font-size: 11px; color: #5a3a00; }
  .payer-row { display: flex; justify-content: space-between; align-items: center; }
  .payer-text { font-size: 10.5px; color: #2a1a00; font-style: italic; }
  .payer-text .ar { font-family: 'Amiri', serif; font-style: normal; color: #5a3a00; }
  .checkbox-group { display: flex; gap: 14px; font-size: 10px; color: #2a1a00; }
  .checkbox-group label { display: flex; align-items: center; gap: 4px; cursor: pointer; font-family: 'Crimson Pro', serif; }
  .checkbox-group input[type=checkbox] { accent-color: #8b1c1c; width: 11px; height: 11px; }
  .montant-lettres-wrap { border: 1px solid #b8860b; padding: 6px 10px; margin-bottom: 10px; background: linear-gradient(to right, rgba(200,151,58,0.04), transparent); }
  .divider { height: 1px; background: linear-gradient(to right, transparent, #c8973a, transparent); margin: 10px 0; }
  .top-grid { display: grid; grid-template-columns: 155px 1fr; gap: 14px; margin-bottom: 10px; }
  .right-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .ksibet-name {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: #8b1c1c;
    letter-spacing: 2px;
    border-bottom: 2px solid #8b1c1c;
    padding: 2px 4px;
    display: block;
    min-width: 100px;
  }
  .bottom-grid {
    display: grid;
    grid-template-columns: 1fr 130px 1fr;
    gap: 14px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #c8973a;
  }
  .bottom-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
  .km-label {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: #8b1c1c;
    border-bottom: 2px solid #8b1c1c;
    text-align: center;
    padding: 2px 8px;
    width: 100%;
  }
  .company-label {
    font-family: 'Playfair Display', serif;
    font-size: 14px;
    font-weight: 700;
    color: #1a0a00;
    border-bottom: 1px solid #b8860b;
    text-align: center;
    padding: 2px 4px;
    width: 100%;
  }
  .montant-box {
    border: 1.5px solid #8b1c1c;
    padding: 6px 10px;
    margin-bottom: 8px;
    background: linear-gradient(to bottom, rgba(139,28,28,0.03), transparent);
  }
  .montant-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
    padding-bottom: 4px;
    border-bottom: 0.5px solid rgba(184,134,11,0.3);
  }
  .montant-row:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
  .montant-lbl { font-size: 9px; color: #8b1c1c; font-weight: 600; }
  .montant-lbl .ar { font-family: 'Amiri', serif; color: #5a3a00; }
  .montant-val {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 700;
    color: #8b1c1c;
    border-bottom: 1px solid #8b1c1c;
    min-width: 110px;
    text-align: right;
    padding: 1px 3px;
  }
  .ordre-section {
    border-top: 1.5px solid #c8973a;
    margin-top: 10px;
    padding-top: 8px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .barcode-section {
    border-top: 1px solid #c8973a;
    margin-top: 8px;
    padding-top: 6px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .barcode-wrap { display: flex; flex-direction: column; gap: 3px; }
  .barcode-num { font-family: 'Courier New', monospace; font-size: 10px; color: #333; letter-spacing: 1px; }
  .barcode-bars { display: flex; gap: 1px; height: 36px; align-items: stretch; }
  .bar { background: #1a0a00; display: inline-block; height: 100%; }
  .bar.white { background: #fdf8ee; }
  .footnote {
    background: linear-gradient(to right, #f5e8cc, #fdf8ee, #f5e8cc);
    border-top: 2px solid #c8973a;
    padding: 5px 20px;
    font-size: 8px;
    color: #5a3a00;
    font-style: italic;
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
    z-index: 2;
  }
  .footnote .ar { font-family: 'Amiri', serif; font-style: normal; font-size: 9px; }
  .accept-box {
    border: 1px solid #b8860b;
    padding: 3px 10px;
    font-size: 8px;
    color: #5a1010;
    display: flex;
    gap: 8px;
    align-items: center;
    margin-left: auto;
  }
  .sig-area { border: 1px dashed rgba(184,134,11,0.5); min-height: 56px; background: rgba(253,248,238,0.5); }
  .print-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #8b1c1c;
    color: white;
    border: none;
    padding: 10px 20px;
    font-family: 'IM Fell English SC', serif;
    font-size: 13px;
    letter-spacing: 1px;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0,0,0,0.4);
    z-index: 100;
    transition: background 0.2s;
  }
  .print-btn:hover { background: #6b0f0f; }
  @media print {
    body { background: white; padding: 0; }
    .lettre { box-shadow: none; width: 100%; }
    .print-btn { display: none; }
  }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">⎙ Imprimer</button>
<div class="lettre">
  <div class="inner-border"></div>
  <div class="corner corner-tl"><svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 26 L2 2 L26 2" stroke="#c8973a" stroke-width="1.5" fill="none"/><path d="M2 14 Q8 8 14 2" stroke="#c8973a" stroke-width="0.7" fill="none"/><circle cx="2" cy="2" r="2" fill="#c8973a"/></svg></div>
  <div class="corner corner-tr"><svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 26 L2 2 L26 2" stroke="#c8973a" stroke-width="1.5" fill="none"/><path d="M2 14 Q8 8 14 2" stroke="#c8973a" stroke-width="0.7" fill="none"/><circle cx="2" cy="2" r="2" fill="#c8973a"/></svg></div>
  <div class="corner corner-bl"><svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 26 L2 2 L26 2" stroke="#c8973a" stroke-width="1.5" fill="none"/><path d="M2 14 Q8 8 14 2" stroke="#c8973a" stroke-width="0.7" fill="none"/><circle cx="2" cy="2" r="2" fill="#c8973a"/></svg></div>
  <div class="corner corner-br"><svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 26 L2 2 L26 2" stroke="#c8973a" stroke-width="1.5" fill="none"/><path d="M2 14 Q8 8 14 2" stroke="#c8973a" stroke-width="0.7" fill="none"/><circle cx="2" cy="2" r="2" fill="#c8973a"/></svg></div>
  <div class="header">
    <div class="header-republic">
      <div class="republic-line">République<br><span class="ar">الجمهورية التونسية</span><br>Tunisienne</div>
    </div>
    <div class="header-center">
      <div class="title-lettre">Lettre</div>
      <div class="title-de">— de —</div>
      <div class="title-change">Change</div>
      <div class="title-divider">· · · · · · · ·</div>
      <div class="title-bill">Republic of Tunisia</div>
      <div class="title-exchange">Bill of exchange</div>
    </div>
    <div class="header-stamp">
      <div class="stamp-box">LETTRE<br>DE CHANGE</div>
      <div class="timbre">طابع<br>ضريبي</div>
    </div>
  </div>
  <div class="body">
    <div class="top-grid">
      <div>
        <div class="fg">
          <div class="lbl">Signature <span class="ar">الإمضاء</span></div>
          <div class="lbl" style="font-weight:300; font-size:8.5px;">du tiré <span class="ar">المسحوب عليه</span></div>
          <div class="fld sig" style="border:1px dashed rgba(184,134,11,0.5); border-bottom:1px solid #b8860b;"></div>
        </div>
      </div>
      <div class="right-panel">
        <div>
          <div class="fg">
            <div class="lbl">Echéance <span class="ar">تاريخ الاستحقاق</span></div>
            <div class="fld">${echeance}</div>
          </div>
          <div class="fg">
            <div class="lbl">RIB ou RIP du Tiré <span class="ar">المسحوب عليه</span></div>
            <div class="rib-wrap">
              <div class="rib-cell rib-w30">${r.codeEtablissement}</div>
              <div class="rib-cell rib-w36">${r.codeAgence}</div>
              <div class="rib-cell rib-w140">${ribMain}</div>
              <div class="rib-cell rib-w24">${ribCle}</div>
            </div>
          </div>
          <div class="fg">
            <div class="lbl">A <span class="ar">إلى</span></div>
            <div class="fld">${this.esc(traite.tire)}</div>
          </div>
          <div class="fg">
            <div class="lbl">Le <span class="ar">بتاريخ</span></div>
            <div class="fld">${dateCreation}</div>
          </div>
        </div>
        <div>
          <div class="fg">
            <div class="lbl">Ordre de paiement L - CN <span class="ar">أمر الدفع</span></div>
            <div class="fld">${this.esc(traite.ordrePaiement)}</div>
          </div>
          <div class="montant-box" style="margin-top:6px;">
            <div class="montant-row">
              <div class="montant-lbl">Montant <span class="ar">المبلغ</span></div>
              <div class="montant-val">${montant}</div>
            </div>
          </div>
          <div class="fg">
            <div class="lbl">STXS <span class="ar">م.ت.و.م</span></div>
            <div class="fld">${this.esc(traite.valeurEn)}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="contre">
      <div class="contre-title">Contre cette lettre de change (Protestable*) <span class="ar">بموجب هذه الكمبيالة (قابلة للاحتجاج*)</span></div>
      <div class="payer-row">
        <span class="payer-text">payer à l'ordre de <span class="ar">إدفع لأمر</span></span>
        <div class="checkbox-group">
          <label><input type="checkbox" checked> Protestable</label>
          <label><input type="checkbox"> Sans Frais</label>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div class="lbl">Tireur <span class="ar">الساحب</span></div>
        <div class="fld">${this.esc(traite.tireur)}</div>
      </div>
    </div>
    <div class="montant-lettres-wrap fg">
      <div class="lbl">Montant en lettres <span class="ar">المبلغ بالحروف</span></div>
      <div class="fld bold-val">${this.esc(traite.montantLettres)}</div>
    </div>
    <div class="row">
      <div class="col">
        <div class="lbl">Lieu de création <span class="ar">مكان الإنشاء</span></div>
        <div class="fld">${this.esc(traite.lieuCreation)}</div>
      </div>
      <div class="col">
        <div class="lbl">Date de création <span class="ar">تاريخ الإنشاء</span></div>
        <div class="fld">${dateCreation}</div>
      </div>
      <div class="col">
        <div class="lbl">Echéance <span class="ar">تاريخ الاستحقاق</span></div>
        <div class="fld">${echeance}</div>
      </div>
    </div>
    <div class="fg">
      <div class="lbl">RIB ou RIP du Tiré <span class="ar">الساحب</span></div>
      <div class="rib-wrap" style="flex-wrap:wrap; gap:4px;">
        <span class="rib-sep">Code étab.</span>
        <div class="rib-cell rib-w30">${r.codeEtablissement}</div>
        <span class="rib-sep">Code Agence</span>
        <div class="rib-cell rib-w36">${r.codeAgence}</div>
        <div class="rib-cell rib-w140">${ribMain}</div>
        <span class="rib-sep">Clé</span>
        <div class="rib-cell rib-w24">${ribCle}</div>
      </div>
    </div>
    <div class="row" style="align-items:flex-end;">
      <div class="col">
        <div class="lbl">Nom du Tiré <span class="ar">المسحوب عليه</span></div>
        <div class="ksibet-name">${this.esc(traite.tire)}</div>
      </div>
      <div class="col">
        <div class="fg">
          <div class="lbl">N° de Compte <span class="ar">رقم الحساب</span></div>
          <div class="fld">${this.esc(r.numeroCompte)}</div>
        </div>
        <div class="fg">
          <div class="lbl">Aval <span class="ar">الضمان الاحتياطي</span></div>
          <div class="fld"></div>
        </div>
      </div>
    </div>
    <div class="bottom-grid">
      <div>
        <div class="fg">
          <div class="lbl">Valeur en <span class="ar">قيمة</span></div>
          <div style="display:flex; align-items:center; gap:6px;">
            <div class="fld" style="width:80px; border:none;"></div>
            <span style="font-weight:700; color:#8b1c1c; font-size:13px;">${this.esc(traite.valeurEn || 'DT')}</span>
          </div>
        </div>
        <div class="fg">
          <div class="lbl">Nom et adresse du Tiré <span class="ar">اسم وعنوان المسحوب عليه</span></div>
          <div class="fld tall">${this.esc(traite.nomAdresseTire || traite.fournisseurNom)}</div>
        </div>
        <div class="fg">
          <div class="lbl">Nom du cédant <span class="ar">اسم المُحيل</span></div>
          <div class="fld">${this.esc(traite.fournisseurNom)}</div>
        </div>
      </div>
      <div class="bottom-center">
        <div class="km-label">${this.esc(traite.tire)}</div>
        <div class="company-label">${this.esc(traite.nomAdresseTire || traite.fournisseurNom)}</div>
      </div>
      <div>
        <div class="fg">
          <div class="lbl">Domiciliation <span class="ar">التوطين</span></div>
          <div class="fld">${this.esc(traite.domiciliation)}</div>
        </div>
        <div class="montant-box">
          <div class="montant-row">
            <div class="montant-lbl">Montant <span class="ar">المبلغ</span></div>
            <div class="montant-val">${montant}</div>
          </div>
          <div class="montant-row">
            <div class="montant-lbl">Montant <span class="ar">المبلغ</span></div>
            <div class="montant-val">${montant}</div>
          </div>
        </div>
        <div class="fg">
          <div class="lbl">Codes réservés <span class="ar">أكواد مخصصة</span></div>
          <div class="fld"></div>
        </div>
        <div class="fg">
          <div class="lbl">Signature du tireur <span class="ar">إمضاء الساحب</span></div>
          <div class="fld sig" style="border:1px dashed rgba(184,134,11,0.5); border-bottom:1px solid #b8860b;"></div>
        </div>
      </div>
    </div>
    <div class="ordre-section">
      <div>
        <div class="lbl">Ordre de paiement L - CN <span class="ar">أمر الدفع ل - م.ت</span></div>
        <div class="fld">${this.esc(traite.ordrePaiement)}</div>
      </div>
      <div>
        <div class="lbl">Domiciliation <span class="ar">التوطين</span></div>
        <div class="fld">${this.esc(traite.domiciliation)}</div>
      </div>
    </div>
    <div class="barcode-section">
      <div class="barcode-wrap">
        <div class="barcode-num">&lt;${this.esc(traite.ordrePaiement)}&gt;</div>
        <div class="barcode-bars" id="bc"></div>
      </div>
    </div>
  </div>
  <div class="footnote">
    <span>* mettre X dans la case correspondante <span class="ar">ضع X في الخانة المناسبة</span></span>
    <div class="accept-box">Acceptation <span class="ar">القبول</span><div style="width:14px; height:14px; border:1px solid #b8860b; display:inline-block;"></div></div>
  </div>
</div>
<script>
(function(){
  var p = [${bcPattern}];
  var bc = document.getElementById('bc');
  if (bc) {
    p.forEach(function(w, i) {
      var bar = document.createElement('div');
      bar.className = 'bar' + (i % 2 === 1 ? ' white' : '');
      bar.style.width = w + 'px';
      bc.appendChild(bar);
    });
  }
})();
</script>
</body>
</html>`;
  }

  private esc(s: string | undefined | null): string {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Ouvre la lettre de change dans une nouvelle fenêtre et optionnellement imprime */
  openPrintWindow(traite: Traite, rib: RIB | null, autoPrint = false): void {
    const html = this.generateHtml(traite, rib);
    const w = window.open('', '_blank', 'width=1100,height=900,scrollbars=yes');
    if (!w) {
      alert('Veuillez autoriser les fenêtres popup pour afficher la lettre de change.');
      return;
    }
    w.document.write(html);
    w.document.close();
    if (autoPrint) {
      w.onload = () => setTimeout(() => w.print(), 300);
    }
  }
}
