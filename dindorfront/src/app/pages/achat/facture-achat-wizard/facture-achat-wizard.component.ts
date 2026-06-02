import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

import { Article } from '../../../models/article.model';
import { Fournisseur } from '../../../models/fournisseur.model';
import {
  FactureAchat, FactureAchatRequest, LigneFactureAchatRequest,
  PaiementAchatRequest, RetenueAchatRequest,
} from '../../../models/facture-achat.model';
import { ArticleService }      from '../../../services/article.service';
import { FournisseurService }  from '../../../services/fournisseur.service';
import { FactureAchatService } from '../../../services/facture-achat.service';
import {
  PredictionService, ArticleDashboardItem, PredictionResult,
} from '../../../services/prediction.service';
import { CurrencyFormatPipe }  from '../../../pipes/currency-format.pipe';

@Component({
  selector: 'app-facture-achat-wizard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatStepperModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatRadioModule,
    MatProgressSpinnerModule, MatTooltipModule, MatIconModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './facture-achat-wizard.component.html',
  styleUrl:    './facture-achat-wizard.component.css',
})
export class FactureAchatWizardComponent implements OnInit, OnDestroy {

  // ── Router public pour le template ──────────────────────────────────────
  router: Router;

  // ── Mode édition ─────────────────────────────────────────────────────────
  editMode = false;
  editId?: number;

  // ── Forms ────────────────────────────────────────────────────────────────
  headerForm!:   FormGroup;
  lignesForm!:   FormGroup;
  paiementForm!: FormGroup;
  retenueForm!:  FormGroup;

  // ── Constantes ───────────────────────────────────────────────────────────
  readonly TIMBRE_FISCAL = 0.600;
  readonly TVA_OPTIONS   = [0, 7, 13, 19];

  // ── Données ──────────────────────────────────────────────────────────────
  fournisseurs: Fournisseur[] = [];
  articles:     Article[]     = [];

  // ── État global ──────────────────────────────────────────────────────────
  isLoading           = false;
  isSavingFacture     = false;
  isSavingBrouillon   = false;
  isSavingRetenue     = false;
  successMessage      = '';
  brouillonSuccess    = '';
  errorMessage        = '';
  successRetenueMessage = '';
  savedFactureId?: number;
  savedRetenueId?: number;
  savedBrouillonId?: number;

  // ── Totaux calculés ──────────────────────────────────────────────────────
  totalBrut   = 0;
  totalRemise = 0;
  totalHT     = 0;
  totalTVA    = 0;
  get netAPayer(): number {
    return +(this.totalHT + this.totalTVA + this.TIMBRE_FISCAL).toFixed(3);
  }

  // ── Advisory rapide (par ligne) ──────────────────────────────────────────
  advisories:     (ArticleDashboardItem | null)[] = [];
  advisoryLoading: boolean[] = [];

  // ── Prédiction IA complète (par ligne) ───────────────────────────────────
  predictions:      (PredictionResult | null)[] = [];
  predictionLoading: boolean[] = [];

  // ── Autocomplete (par ligne) ─────────────────────────────────────────────
  showCodeDropdown:   boolean[]    = [];
  showDesignDropdown: boolean[]    = [];
  codeFilteredList:   Article[][]  = [];
  designFilteredList: Article[][]  = [];

  // ── Info société pour le certificat de retenue ───────────────────────────
  readonly company = {
    matricule:    '1234567A/P/M/000',
    codeTVA:      'A',
    codeCategorie:'P',
    denomination: "SOCIETE DIND'OR",
    adresse:      'Avenue de la Liberté',
    ville:        'Tunis',
  };

  get currentYearChars(): string[] {
    return String(new Date().getFullYear()).split('');
  }
  get matriculeChars(): string[] {
    return this.company.matricule.replace(/\//g, '').padEnd(9, ' ').slice(0, 9).split('');
  }
  get etablissementChars(): string[] { return ['0', '0', '0']; }

  get fournisseurSelectionne(): Fournisseur | null {
    const id = this.headerForm?.get('fournisseurId')?.value;
    return this.fournisseurs.find(f => f.id === id) ?? null;
  }
  get fournisseurMatriculeCharsPadded(): string[] {
    const m = (this.fournisseurSelectionne?.matricule ?? '').padEnd(9, ' ');
    return m.slice(0, 9).split('');
  }

  // ── Getters paiement ─────────────────────────────────────────────────────
  get modePaiement(): string { return this.paiementForm?.get('modePaiement')?.value ?? ''; }
  get sousMode(): string     { return this.paiementForm?.get('sousMode')?.value     ?? ''; }

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb:            FormBuilder,
    private articleSvc:    ArticleService,
    private fournisseurSvc:FournisseurService,
    private factureSvc:    FactureAchatService,
    private predictionSvc: PredictionService,
    private route:         ActivatedRoute,
    router: Router,
  ) { this.router = router; }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editMode = true;
      this.editId   = +idParam;
    }
    this.buildForms();
    this.loadData();
    if (this.editMode && this.editId) {
      this.factureSvc.getById(this.editId).pipe(takeUntil(this.destroy$)).subscribe({
        next:  f  => this.populateFromFacture(f),
        error: () => { this.errorMessage = 'Impossible de charger la facture pour modification.'; },
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Construction des formulaires ─────────────────────────────────────────

  private buildForms(): void {
    const today = new Date().toISOString().split('T')[0];

    this.headerForm = this.fb.group({
      numeroFacture: [''],
      dateFacture:   [today, Validators.required],
      fournisseurId: [null, Validators.required],
    });

    this.lignesForm = this.fb.group({
      lignes: this.fb.array([this.newLigneGroup()]),
    });

    this.paiementForm = this.fb.group({
      modePaiement:    ['ESPECES', Validators.required],
      sousMode:        [''],
      montantPaye:     [0, [Validators.required, Validators.min(0)]],
      montantReste:    [{ value: 0, disabled: true }],
      dateEcheance:    [''],
      numeroTraite:    [''],
      dateLimiteCredit:[''],
    });

    this.retenueForm = this.fb.group({
      tauxRetenue:  [1.5, [Validators.required, Validators.min(0.001)]],
      montantBrut:  [{ value: 0, disabled: true }],
      montantRetenu:[{ value: 0, disabled: true }],
      montantNet:   [{ value: 0, disabled: true }],
      dateRetenue:  [today, Validators.required],
      lieuRetenue:  ['Tunis', Validators.required],
    });

    this._initLigneArrays(1);
    this.lignesForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.computeTotals());
  }

  private newLigneGroup(): FormGroup {
    const g = this.fb.group({
      codeArticle:       [''],
      designation:       ['', Validators.required],
      quantite:          [1, [Validators.required, Validators.min(0.001)]],
      prixUnitaireHT:    [0, [Validators.required, Validators.min(0)]],
      remise:            [0, [Validators.min(0), Validators.max(100)]],
      tva:               [19],
      estArticleSource:  [false],
      tauxTransformation:[null],
      prixRemise:        [{ value: 0, disabled: true }],
      totalHT:           [{ value: 0, disabled: true }],
      montantTVA:        [{ value: 0, disabled: true }],
      totalTTC:          [{ value: 0, disabled: true }],
    });
    g.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.recalcLigne(g));
    return g;
  }

  // ── Accesseurs FormArray ─────────────────────────────────────────────────

  get lignesArray(): FormArray { return this.lignesForm.get('lignes') as FormArray; }
  ligneFg(i: number): FormGroup { return this.lignesArray.at(i) as FormGroup; }

  // ── Chargement des données ───────────────────────────────────────────────

  private loadData(): void {
    this.isLoading = true;

    this.fournisseurSvc.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: f => { this.fournisseurs = f; },
      error: () => {},
    });

    this.articleSvc.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: a  => { this.articles = a; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });

    if (!this.editMode) {
      this.factureSvc.getNextNumero().pipe(takeUntil(this.destroy$)).subscribe({
        next: n => this.headerForm.patchValue({ numeroFacture: n }),
        error: () => {},
      });
    }
  }

  // ── Chargement de la facture existante (mode édition) ────────────────────

  private populateFromFacture(f: FactureAchat): void {
    this.headerForm.patchValue({
      numeroFacture: f.numeroFacture,
      dateFacture:   f.dateFacture,
      fournisseurId: f.fournisseurId,
    });

    // Vider les lignes et réinitialiser les tableaux IA/autocomplete
    while (this.lignesArray.length > 0) this.lignesArray.removeAt(0);
    this.advisories        = [];
    this.advisoryLoading   = [];
    this.predictions       = [];
    this.predictionLoading = [];
    this.showCodeDropdown  = [];
    this.showDesignDropdown= [];
    this.codeFilteredList  = [];
    this.designFilteredList= [];

    (f.lignes ?? []).forEach(l => this.lignesArray.push(this.newLigneGroup()));
    this._initLigneArrays(this.lignesArray.length);

    (f.lignes ?? []).forEach((l, i) => {
      const tauxPct = (l.tauxTransformation != null && l.tauxTransformation > 0)
        ? +(l.tauxTransformation * 100).toFixed(2) : null;
      this.ligneFg(i).patchValue({
        codeArticle:        l.codeArticle ?? '',
        designation:        l.designation,
        quantite:           l.quantite,
        prixUnitaireHT:     l.prixUnitaireHT,
        remise:             l.remise,
        tva:                l.tva,
        estArticleSource:   tauxPct != null,
        tauxTransformation: tauxPct,
      });
    });
    this.computeTotals();

    if (f.paiement) {
      this.paiementForm.patchValue({
        modePaiement:     f.paiement.modePaiement    ?? 'ESPECES',
        sousMode:         f.paiement.sousMode         ?? '',
        montantPaye:      f.paiement.montantPaye      ?? 0,
        dateEcheance:     f.paiement.dateEcheance     ?? '',
        numeroTraite:     f.paiement.numeroTraite     ?? '',
        dateLimiteCredit: f.paiement.dateLimiteCredit ?? '',
      });
      this.onMontantPayeChange();
    }
  }

  // ── Gestion des lignes ───────────────────────────────────────────────────

  addLigne(): void {
    this.lignesArray.push(this.newLigneGroup());
    this._initLigneArrays(this.lignesArray.length);
  }

  removeLigne(i: number): void {
    if (this.lignesArray.length === 1) return;
    this.lignesArray.removeAt(i);
    const arrs = [
      this.advisories, this.advisoryLoading,
      this.predictions, this.predictionLoading,
      this.showCodeDropdown, this.showDesignDropdown,
      this.codeFilteredList, this.designFilteredList,
    ];
    arrs.forEach(a => a.splice(i, 1));
    this.computeTotals();
  }

  private _initLigneArrays(length: number): void {
    const fill = (arr: any[], val: any) => { while (arr.length < length) arr.push(val()); };
    fill(this.advisories,      () => null);
    fill(this.advisoryLoading, () => false);
    fill(this.predictions,     () => null);
    fill(this.predictionLoading, () => false);
    fill(this.showCodeDropdown,  () => false);
    fill(this.showDesignDropdown,() => false);
    fill(this.codeFilteredList,  () => []);
    fill(this.designFilteredList,() => []);
  }

  // ── Autocomplete ─────────────────────────────────────────────────────────

  onCodeInput(i: number, value: string): void {
    this.ligneFg(i).get('codeArticle')!.setValue(value, { emitEvent: false });
    if (value.length < 1) { this.showCodeDropdown[i] = false; return; }
    const v = value.toLowerCase();
    this.codeFilteredList[i] = this.articles
      .filter(a => (a.codeArticle ?? '').toLowerCase().includes(v))
      .slice(0, 8);
    this.showCodeDropdown[i] = this.codeFilteredList[i].length > 0;
  }

  hideCodeDropdown(i: number): void {
    setTimeout(() => { this.showCodeDropdown[i] = false; }, 200);
  }

  onDesignInput(i: number, value: string): void {
    this.ligneFg(i).get('designation')!.setValue(value, { emitEvent: false });
    if (value.length < 2) { this.showDesignDropdown[i] = false; return; }
    const v = value.toLowerCase();
    this.designFilteredList[i] = this.articles
      .filter(a => a.designation.toLowerCase().includes(v))
      .slice(0, 8);
    this.showDesignDropdown[i] = this.designFilteredList[i].length > 0;
  }

  hideDesignDropdown(i: number): void {
    setTimeout(() => { this.showDesignDropdown[i] = false; }, 200);
  }

  // ── Sélection d'article — déclenche l'IA ─────────────────────────────────

  selectArticle(i: number, article: Article): void {
    this.showCodeDropdown[i]   = false;
    this.showDesignDropdown[i] = false;

    this.ligneFg(i).patchValue({
      codeArticle:      article.codeArticle,
      designation:      article.designation,
      prixUnitaireHT:   article.prixAchatHT ?? 0,
      tva:              article.tva ?? 19,
      estArticleSource: !!article.produitSpecial,
    });

    // 1. Advisory rapide (stock + prix historique) — sans IA
    this.advisoryLoading[i] = true;
    this.advisories[i]      = null;
    this.predictionService.getAdvisory(article.designation).subscribe({
      next:  r => { this.advisories[i] = r.data; this.advisoryLoading[i] = false; },
      error: () => { this.advisoryLoading[i] = false; },
    });

    // 2. Prédiction IA complète — J+7 / J+15 / J+30 + recommandation
    this.predictionLoading[i] = true;
    this.predictions[i]       = null;
    this.predictionService.predict(article.designation).subscribe({
      next:  r => { this.predictions[i] = r.data; this.predictionLoading[i] = false; },
      error: () => { this.predictionLoading[i] = false; },
    });
  }

  // Alias pour la méthode utilisée dans le template
  private get predictionService() { return this.predictionSvc; }

  // ── Advisory helper ───────────────────────────────────────────────────────

  getAdvisoryPriceNote(i: number): { text: string; css: string } | null {
    const adv  = this.advisories[i];
    const prix = this.ligneFg(i).get('prixUnitaireHT')?.value;
    if (!adv || !prix || prix <= 0 || adv.prixMoyen <= 0) return null;
    const diff = ((prix - adv.prixMoyen) / adv.prixMoyen) * 100;
    if (Math.abs(diff) < 1) return null;
    return diff > 5
      ? { text: `Prix saisi ${diff.toFixed(1)}% au-dessus du prix moyen historique`, css: 'adv-price-note adv-price-note-warn' }
      : { text: `Prix saisi ${Math.abs(diff).toFixed(1)}% en-dessous du prix moyen historique`, css: 'adv-price-note adv-price-note-good' };
  }

  // ── Calcul des totaux ────────────────────────────────────────────────────

  private recalcLigne(g: FormGroup): void {
    const qty  = +g.get('quantite')?.value       || 0;
    const prix = +g.get('prixUnitaireHT')?.value || 0;
    const rem  = +g.get('remise')?.value         || 0;
    const tva  = +g.get('tva')?.value            || 0;

    const prixRemise = +(prix * (1 - rem / 100)).toFixed(3);
    const totalHT    = +(qty * prixRemise).toFixed(3);
    const montantTVA = +(totalHT * tva / 100).toFixed(3);
    const totalTTC   = +(totalHT + montantTVA).toFixed(3);
    g.patchValue({ prixRemise, totalHT, montantTVA, totalTTC }, { emitEvent: false });
  }

  private computeTotals(): void {
    let brut = 0, remise = 0, ht = 0, tva = 0;
    for (let i = 0; i < this.lignesArray.length; i++) {
      const g  = this.ligneFg(i);
      const qty  = +g.get('quantite')?.value       || 0;
      const prix = +g.get('prixUnitaireHT')?.value || 0;
      const rem  = +g.get('remise')?.value         || 0;
      const tvap = +g.get('tva')?.value            || 0;
      const lineHT = +(qty * prix * (1 - rem / 100)).toFixed(3);
      brut   += qty * prix;
      remise += qty * prix * rem / 100;
      ht     += lineHT;
      tva    += lineHT * tvap / 100;
    }
    this.totalBrut   = +brut.toFixed(3);
    this.totalRemise = +remise.toFixed(3);
    this.totalHT     = +ht.toFixed(3);
    this.totalTVA    = +tva.toFixed(3);
  }

  // ── Étape 3 ──────────────────────────────────────────────────────────────

  onStep3Enter(): void {
    this.paiementForm.patchValue({ montantPaye: this.netAPayer });
    this.onMontantPayeChange();
    this.retenueForm.patchValue({ montantBrut: this.totalHT });
    this.recalcRetenue();
  }

  onMontantPayeChange(): void {
    const paye  = +this.paiementForm.get('montantPaye')?.value || 0;
    const reste = +(this.netAPayer - paye).toFixed(3);
    this.paiementForm.patchValue({ montantReste: reste }, { emitEvent: false });
  }

  recalcRetenue(): void {
    const brut   = +this.retenueForm.get('montantBrut')?.value  || 0;
    const taux   = +this.retenueForm.get('tauxRetenue')?.value  || 0;
    const retenu = +(brut * taux / 100).toFixed(3);
    const net    = +(brut - retenu).toFixed(3);
    this.retenueForm.patchValue({ montantRetenu: retenu, montantNet: net }, { emitEvent: false });
  }

  // ── Construction de la requête ───────────────────────────────────────────

  private buildRequest(): FactureAchatRequest {
    const h = this.headerForm.value;
    const lignes: LigneFactureAchatRequest[] = this.lignesArray.controls.map((ctrl, idx) => {
      const g = ctrl as FormGroup;
      return {
        codeArticle:      g.get('codeArticle')?.value || undefined,
        designation:      g.get('designation')?.value,
        quantite:         +g.get('quantite')?.value,
        prixUnitaireHT:   +g.get('prixUnitaireHT')?.value,
        remise:           +g.get('remise')?.value || 0,
        tva:              +g.get('tva')?.value || 0,
        tauxTransformation: g.get('estArticleSource')?.value
          ? +g.get('tauxTransformation')?.value || null
          : null,
        ordre: idx + 1,
      };
    });

    const p = this.paiementForm.value;
    const paiement: PaiementAchatRequest = {
      modePaiement:    p.modePaiement,
      sousMode:        p.sousMode || undefined,
      montantPaye:     +p.montantPaye,
      montantReste:    +(this.netAPayer - +p.montantPaye).toFixed(3),
      dateEcheance:    p.dateEcheance    || undefined,
      numeroTraite:    p.numeroTraite    || undefined,
      dateLimiteCredit:p.dateLimiteCredit|| undefined,
    };

    return { numeroFacture: h.numeroFacture || undefined, dateFacture: h.dateFacture, fournisseurId: h.fournisseurId, lignes, paiement };
  }

  // ── Brouillon ────────────────────────────────────────────────────────────

  onSaveBrouillon(): void {
    this.isSavingBrouillon = true;
    this.brouillonSuccess  = '';
    this.errorMessage      = '';
    const req = this.buildRequest();
    const obs = (this.editMode && this.editId)
      ? this.factureSvc.update(this.editId, req)
      : this.factureSvc.saveDraft(req);
    obs.subscribe({
      next: f => {
        this.savedBrouillonId  = f.id;
        this.isSavingBrouillon = false;
        this.brouillonSuccess  = this.editMode
          ? `Brouillon ${f.numeroFacture} mis à jour.`
          : `Brouillon ${f.numeroFacture} enregistré.`;
      },
      error: e => {
        this.isSavingBrouillon = false;
        this.errorMessage = e?.error?.message ?? 'Erreur lors de la sauvegarde.';
      },
    });
  }

  onValidateBrouillon(): void {
    const id = this.savedBrouillonId ?? (this.editMode ? this.editId : undefined);
    if (!id) return;
    this.isSavingFacture = true;
    this.factureSvc.validateFacture(id).subscribe({
      next: f => {
        this.isSavingFacture  = false;
        this.brouillonSuccess = '';
        this.savedFactureId   = f.id;
        this.successMessage   = `Facture ${f.numeroFacture} validée avec succès.`;
      },
      error: e => {
        this.isSavingFacture = false;
        this.errorMessage = e?.error?.message ?? 'Erreur lors de la validation.';
      },
    });
  }

  // ── Validation finale ────────────────────────────────────────────────────

  onSubmit(): void {
    this.isSavingFacture = true;
    this.errorMessage    = '';
    const req = this.buildRequest();
    const obs = (this.editMode && this.editId)
      ? this.factureSvc.update(this.editId, req)
      : this.factureSvc.create(req);
    obs.subscribe({
      next: f => {
        this.isSavingFacture = false;
        this.savedFactureId  = f.id;
        this.successMessage  = this.editMode
          ? `Facture ${f.numeroFacture} modifiée et validée.`
          : `Facture ${f.numeroFacture} créée et validée.`;
      },
      error: e => {
        this.isSavingFacture = false;
        this.errorMessage = e?.error?.message ?? 'Erreur lors de la sauvegarde.';
      },
    });
  }

  // ── Retenue à la source ──────────────────────────────────────────────────

  onSubmitRetenueSeulement(): void {
    if (this.retenueForm.invalid || !this.headerForm.get('fournisseurId')?.value) return;
    this.isSavingRetenue      = true;
    this.successRetenueMessage = '';

    const r = this.retenueForm.value;
    const req: RetenueAchatRequest = {
      dateRetenue:   r.dateRetenue,
      lieuRetenue:   r.lieuRetenue,
      fournisseurId: this.headerForm.get('fournisseurId')?.value,
      lignes: [{
        numeroFacture: this.headerForm.get('numeroFacture')?.value || '',
        montantBrut:   +this.retenueForm.get('montantBrut')?.value || this.totalHT,
        tauxRetenue:   +r.tauxRetenue,
        ordre: 1,
      }],
    };

    this.factureSvc.createRetenue(req).subscribe({
      next: res => {
        this.isSavingRetenue       = false;
        this.savedRetenueId        = res?.id;
        this.successRetenueMessage = 'Retenue à la source enregistrée avec succès.';
      },
      error: e => {
        this.isSavingRetenue = false;
        this.errorMessage    = e?.error?.message ?? "Erreur lors de l'enregistrement de la retenue.";
      },
    });
  }

  // ── Impression ───────────────────────────────────────────────────────────

  printFacture(): void {
    if (this.savedFactureId) {
      const numero = this.headerForm.get('numeroFacture')?.value ?? String(this.savedFactureId);
      this.factureSvc.downloadFacturePdf(this.savedFactureId, numero);
    }
  }

  printRetenue(): void {
    if (this.savedRetenueId) {
      this.factureSvc.downloadRetenuePdf(this.savedRetenueId);
    }
  }

  // ── Helpers template ─────────────────────────────────────────────────────

  annuler(): void { this.router.navigate(['/achat']); }

  fournisseurLabel(id: number): string {
    const f = this.fournisseurs.find(x => x.id === id);
    return f ? `${f.raisonSociale} · ${f.matricule}` : '';
  }

  // ── Helpers IA (utilisés dans le template) ───────────────────────────────

  getRecoClass(reco: string): string {
    return ({
      'ACHETER_MAINTENANT'      : 'reco-buy-now',
      'ACHETER_PROGRESSIVEMENT' : 'reco-buy-progressive',
      'ATTENDRE'                : 'reco-wait',
      'SURVEILLER'              : 'reco-watch',
    } as Record<string, string>)[reco] ?? '';
  }

  getRecoIcon(reco: string): string {
    return ({
      'ACHETER_MAINTENANT'      : 'shopping_cart',
      'ACHETER_PROGRESSIVEMENT' : 'trending_up',
      'ATTENDRE'                : 'hourglass_empty',
      'SURVEILLER'              : 'visibility',
    } as Record<string, string>)[reco] ?? 'info';
  }

  getRecoLabel(reco: string): string {
    return ({
      'ACHETER_MAINTENANT'      : 'Acheter maintenant',
      'ACHETER_PROGRESSIVEMENT' : 'Acheter progressivement',
      'ATTENDRE'                : 'Attendre — prix en baisse',
      'SURVEILLER'              : 'Surveiller le marché',
    } as Record<string, string>)[reco] ?? reco;
  }
}
