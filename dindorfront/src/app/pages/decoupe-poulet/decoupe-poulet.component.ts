import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  DecoupePoulet, DecoupePouletLigne, ProduitDecoupe,
  PRODUITS_DECOUPE, ProduitMeta
} from '../../models/decoupe-poulet.model';
import { DecoupePouletService } from '../../services/decoupe-poulet.service';

interface LigneSaisie {
  meta:         ProduitMeta;
  actif:        boolean;       // inclus dans cette découpe ?
  quantite:     number | null;
  prixUnitaire: number | null;
  totalValeur:  number;
}

@Component({
  selector: 'app-decoupe-poulet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './decoupe-poulet.component.html',
  styleUrl: './decoupe-poulet.component.css'
})
export class DecoupePouletComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  readonly produitsMeta = PRODUITS_DECOUPE;
  readonly Math = Math;

  // ── Historique ────────────────────────────────────────────────────────
  decoupes:     DecoupePoulet[] = [];
  isLoading     = false;
  errorMessage  = '';
  dateDebut     = '';
  dateFin       = '';

  // ── Détail sélectionné ────────────────────────────────────────────────
  selectedDecoupe: DecoupePoulet | null = null;

  // ── Saisie ────────────────────────────────────────────────────────────
  showSaisie    = false;
  isSaving      = false;
  saisieError   = '';
  saisieSuccess = '';
  isEditMode    = false;
  editId: number | null = null;

  saisieDate    = '';
  saisieLot     = '';
  saisieQte:    number | null = null;
  saisiePrix:   number | null = null;

  produitCalculeKey: ProduitDecoupe = 'CUISSE';

  lignes: LigneSaisie[] = [];

  constructor(private service: DecoupePouletService) {}

  ngOnInit(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.dateDebut = today;
    this.dateFin   = today;
    this.initLignes();
    this.loadAll();
  }

  // ── Initialisation ────────────────────────────────────────────────────

  private initLignes(): void {
    this.lignes = PRODUITS_DECOUPE.map(m => ({
      meta:         m,
      actif:        true,
      quantite:     null,
      prixUnitaire: null,
      totalValeur:  0
    }));
  }

  // ── Getters ───────────────────────────────────────────────────────────

  get totalAchat(): number {
    return +(this.saisieQte ?? 0) * +(this.saisiePrix ?? 0);
  }

  get lignesActives(): LigneSaisie[] {
    return this.lignes.filter(l => l.actif);
  }

  get lignesManuellesActives(): LigneSaisie[] {
    return this.lignes.filter(l => l.actif && l.meta.code !== this.produitCalculeKey);
  }

  get sommeManuelle(): number {
    return this.lignesManuellesActives.reduce((s, l) => s + l.totalValeur, 0);
  }

  get valeurCalculee(): number {
    return this.totalAchat - this.sommeManuelle;
  }

  get prixUnitaireCalcule(): number {
    const ligne = this.lignes.find(l => l.meta.code === this.produitCalculeKey);
    const qte   = +(ligne?.quantite ?? 0);
    return qte > 0 ? this.valeurCalculee / qte : 0;
  }

  get isDepassement(): boolean {
    return this.totalAchat > 0 && this.valeurCalculee < 0;
  }

  isCalcule(code: ProduitDecoupe): boolean {
    return code === this.produitCalculeKey;
  }

  getLigne(code: ProduitDecoupe): LigneSaisie {
    return this.lignes.find(l => l.meta.code === code)!;
  }

  // ── Toggle actif / inactif ────────────────────────────────────────────

  onToggleActif(ligne: LigneSaisie): void {
    // Le produit calculé ne peut pas être désactivé
    if (ligne.meta.code === this.produitCalculeKey) {
      ligne.actif = true;
      return;
    }
    if (!ligne.actif) {
      // Désactivation : remettre à zéro
      ligne.quantite     = null;
      ligne.prixUnitaire = null;
      ligne.totalValeur  = 0;
    }
  }

  // ── Changement produit calculé ────────────────────────────────────────

  onProduitCalculeChange(): void {
    // Forcer l'activation du nouveau produit calculé
    const ligne = this.getLigne(this.produitCalculeKey);
    if (ligne) ligne.actif = true;

    // Recalculer les totaux manuels
    this.lignes.forEach(l => {
      if (l.actif && !this.isCalcule(l.meta.code)) {
        l.totalValeur = +(l.quantite ?? 0) * +(l.prixUnitaire ?? 0);
      }
    });
  }

  // ── Recalcul sur input ────────────────────────────────────────────────

  onLigneChange(ligne: LigneSaisie): void {
    if (ligne.actif && !this.isCalcule(ligne.meta.code)) {
      ligne.totalValeur = +(ligne.quantite ?? 0) * +(ligne.prixUnitaire ?? 0);
    }
  }

  onInputEnter(event: Event): void {
    event.preventDefault();
    const panel = document.getElementById('decoupe-panel');
    if (!panel) return;
    const inputs = Array.from(
      panel.querySelectorAll<HTMLInputElement>('input:not([type="checkbox"]):not([disabled])')
    );
    const idx = inputs.indexOf(event.target as HTMLInputElement);
    if (idx >= 0 && idx < inputs.length - 1) {
      inputs[idx + 1].focus();
      inputs[idx + 1].select();
    }
  }

  // ── Saisie panel ─────────────────────────────────────────────────────

  openSaisie(): void {
    this.isEditMode        = false;
    this.editId            = null;
    this.showSaisie        = true;
    this.saisieError       = '';
    this.saisieSuccess     = '';
    this.saisieDate        = new Date().toISOString().slice(0, 10);
    this.saisieLot         = '';
    this.saisieQte         = null;
    this.saisiePrix        = null;
    this.produitCalculeKey = 'CUISSE';
    this.initLignes();
    setTimeout(() => document.getElementById('decoupe-panel')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  openEdit(d: DecoupePoulet): void {
    this.isEditMode        = true;
    this.editId            = d.id!;
    this.showSaisie        = true;
    this.saisieError       = '';
    this.saisieSuccess     = '';
    this.saisieDate        = d.dateDecoupe;
    this.saisieLot         = d.numeroLot || '';
    this.saisieQte         = +d.qteAchetee;
    this.saisiePrix        = +d.prixUnitaireAchat;
    this.produitCalculeKey = d.produitCalcule as ProduitDecoupe;
    this.initLignes();
    const existingCodes = (d.lignes || []).map(l => l.produit);
    this.lignes.forEach(l => {
      const found = (d.lignes || []).find(el => el.produit === l.meta.code);
      if (found) {
        l.actif        = true;
        l.quantite     = +found.quantite;
        if (!this.isCalcule(l.meta.code)) {
          l.prixUnitaire = +found.prixUnitaire;
          l.totalValeur  = +found.totalValeur;
        }
      } else if (!this.isCalcule(l.meta.code)) {
        l.actif = false;
      }
    });
    setTimeout(() => document.getElementById('decoupe-panel')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  closeSaisie(): void {
    this.showSaisie    = false;
    this.isEditMode    = false;
    this.editId        = null;
    this.saisieError   = '';
    this.saisieSuccess = '';
  }

  resetSaisie(): void {
    this.saisieDate        = new Date().toISOString().slice(0, 10);
    this.saisieLot         = '';
    this.saisieQte         = null;
    this.saisiePrix        = null;
    this.produitCalculeKey = 'CUISSE';
    this.saisieError       = '';
    this.saisieSuccess     = '';
    this.initLignes();
  }

  onSubmit(): void {
    this.saisieError = '';
    if (!this.saisieDate)                                  { this.saisieError = 'La date est obligatoire.'; return; }
    if (!(this.saisieQte  && this.saisieQte  > 0))         { this.saisieError = 'La quantité achetée doit être > 0.'; return; }
    if (!(this.saisiePrix && this.saisiePrix > 0))         { this.saisieError = 'Le prix unitaire doit être > 0.'; return; }
    if (this.lignesActives.length < 1)                     { this.saisieError = 'Activez au moins un produit.'; return; }

    const ligneCalc = this.getLigne(this.produitCalculeKey);
    if (!ligneCalc.actif)                                  { this.saisieError = 'Le produit calculé doit être actif.'; return; }
    if (!(ligneCalc.quantite && +ligneCalc.quantite > 0))  { this.saisieError = `Saisissez la quantité de « ${ligneCalc.meta.label} » (produit calculé).`; return; }
    if (this.isDepassement)                                { this.saisieError = 'La somme des produits dépasse le total achat.'; return; }

    // Seules les lignes actives sont envoyées
    const lignesReq = this.lignesActives.map(l => ({
      produit:      l.meta.code,
      unite:        l.meta.unite,
      quantite:     +(l.quantite  ?? 0),
      prixUnitaire: this.isCalcule(l.meta.code) ? this.prixUnitaireCalcule : +(l.prixUnitaire ?? 0),
      totalValeur:  this.isCalcule(l.meta.code) ? this.valeurCalculee      : l.totalValeur,
      calcule:      this.isCalcule(l.meta.code)
    }));

    const request = {
      dateDecoupe:       this.saisieDate,
      numeroLot:         this.saisieLot || null,
      qteAchetee:        this.saisieQte,
      prixUnitaireAchat: this.saisiePrix,
      produitCalcule:    this.produitCalculeKey,
      lignes:            lignesReq
    };

    this.isSaving = true;
    const obs = this.isEditMode
      ? this.service.update(this.editId!, request)
      : this.service.create(request);
    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: d => {
        this.isSaving      = false;
        this.saisieSuccess = this.isEditMode
          ? `Découpe N°${d.id} modifiée — Total : ${this.formatNum(+d.totalAchat)} DT`
          : `Découpe N°${d.id} enregistrée — Total : ${this.formatNum(+d.totalAchat)} DT`;
        setTimeout(() => { this.closeSaisie(); this.loadAll(); }, 2200);
      },
      error: err => {
        this.isSaving    = false;
        this.saisieError = err?.error?.message || `Erreur HTTP ${err?.status}`;
      }
    });
  }

  // ── Historique ────────────────────────────────────────────────────────

  loadAll(): void {
    this.isLoading    = true;
    this.errorMessage = '';
    this.service.getAll(this.dateDebut, this.dateFin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: list => { this.decoupes = list ?? []; this.isLoading = false; },
        error: err => {
          this.isLoading    = false;
          this.errorMessage = err?.status === 0 ? '⚠ Serveur inaccessible.' : `⚠ Erreur HTTP ${err?.status}`;
        }
      });
  }

  resetFiltres(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.dateDebut = today;
    this.dateFin   = today;
    this.loadAll();
  }

  selectDecoupe(d: DecoupePoulet): void {
    this.selectedDecoupe = (this.selectedDecoupe?.id === d.id) ? null : d;
  }

  deleteDecoupe(d: DecoupePoulet): void {
    if (!confirm(`Supprimer la découpe N°${d.id} du ${this.formatDate(d.dateDecoupe)} ?`)) return;
    this.service.delete(d.id!).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.decoupes = this.decoupes.filter(x => x.id !== d.id);
        if (this.selectedDecoupe?.id === d.id) this.selectedDecoupe = null;
      }
    });
  }

  // ── KPI ───────────────────────────────────────────────────────────────

  get kpiTotal():        number { return this.decoupes.length; }
  get kpiTotalKg():      number { return this.decoupes.reduce((s, d) => s + +d.qteAchetee, 0); }
  get kpiTotalInvesti(): number { return this.decoupes.reduce((s, d) => s + +d.totalAchat,  0); }

  // ── Helpers ───────────────────────────────────────────────────────────

  getLigneFromDecoupe(d: DecoupePoulet, code: ProduitDecoupe): DecoupePouletLigne | undefined {
    return d.lignes?.find(l => l.produit === code);
  }

  labelProduit(code: string): string {
    return PRODUITS_DECOUPE.find(p => p.code === code)?.label ?? code;
  }

  formatNum(val: number | null | undefined, dec = 3): string {
    if (val == null) return '—';
    return (+val).toLocaleString('fr-TN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
