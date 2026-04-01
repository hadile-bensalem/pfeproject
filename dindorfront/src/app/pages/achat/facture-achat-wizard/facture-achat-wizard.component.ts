import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  FormArray, Validators, AbstractControl
} from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { FactureAchatService } from '../../../services/facture-achat.service';
import { FournisseurService } from '../../../services/fournisseur.service';
import { ArticleService } from '../../../services/article.service';
import { Fournisseur } from '../../../models/fournisseur.model';
import { Article } from '../../../models/article.model';
import { CurrencyFormatPipe } from '../../../pipes/currency-format.pipe';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-facture-achat-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyFormatPipe,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './facture-achat-wizard.component.html',
  styleUrl: './facture-achat-wizard.component.css'
})
export class FactureAchatWizardComponent implements OnInit {

  readonly TIMBRE_FISCAL = 1.000;
  readonly TVA_OPTIONS = [0, 7, 13, 19];

  isLoading = false;
  isSavingFacture  = false;
  isSavingRetenue  = false;
  errorMessage          = '';
  successMessage        = '';
  successRetenueMessage = '';

  // ── Step 1 ────────────────────────────────────────────────────────────
  headerForm!: FormGroup;
  fournisseurs: Fournisseur[] = [];

  // ── Step 2 ────────────────────────────────────────────────────────────
  lignesForm!: FormGroup;
  articles: Article[] = [];

  // Autocomplete CODE
  codeFilteredList: Article[][] = [];
  showCodeDropdown: boolean[]   = [];

  // Autocomplete DÉSIGNATION
  designFilteredList: Article[][] = [];
  showDesignDropdown: boolean[]   = [];

  // ── Step 3 ────────────────────────────────────────────────────────────
  paiementForm!: FormGroup;
  retenueForm!: FormGroup;
  savedRetenueId:  number | null = null;
  savedFactureId:  number | null = null;
  savedFactureNum: string = '';

  private fb      = inject(FormBuilder);
  router  = inject(Router);
  private factureAchatService  = inject(FactureAchatService);
  private fournisseurService   = inject(FournisseurService);
  private articleService       = inject(ArticleService);

  ngOnInit(): void {
    this.buildForms();
    this.loadData();
  }

  // ── Form builders ─────────────────────────────────────────────────────

  private buildForms(): void {
    this.headerForm = this.fb.group({
      numeroFacture: [{ value: '', disabled: true }],
      dateFacture:   [new Date().toISOString().slice(0, 10), Validators.required],
      fournisseurId: [null, Validators.required]
    });

    this.lignesForm = this.fb.group({ lignes: this.fb.array([]) });

    this.paiementForm = this.fb.group({
      modePaiement:     ['ESPECES', Validators.required],
      sousMode:         ['TOUT_ESPECES'],
      montantPaye:      [0, [Validators.required, Validators.min(0)]],
      montantReste:     [{ value: 0, disabled: true }],
      dateEcheance:     [null],
      numeroTraite:     [''],
      dateLimiteCredit: [null]
    });

    this.retenueForm = this.fb.group({
      dateRetenue:   [new Date().toISOString().slice(0, 10), Validators.required],
      lieuRetenue:   [environment.company.ville, Validators.required],
      tauxRetenue:   [1.5, [Validators.required, Validators.min(0.001)]],
      montantBrut:   [{ value: 0, disabled: true }],
      montantRetenu: [{ value: 0, disabled: true }],
      montantNet:    [{ value: 0, disabled: true }]
    });

    this.addLigne();
  }

  private loadData(): void {
    this.isLoading = true;
    this.factureAchatService.getNextNumero().subscribe({
      next: n => this.headerForm.patchValue({ numeroFacture: n }),
      error: () => this.headerForm.patchValue({ numeroFacture: this.localNumero() })
    });
    this.fournisseurService.getAll().subscribe({
      next: list => { this.fournisseurs = list ?? []; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
    this.articleService.getAll().subscribe({ next: list => this.articles = list ?? [] });
  }

  private localNumero(): string {
    return `${new Date().getFullYear()}000001`;
  }

  // ── Lignes (FormArray) ────────────────────────────────────────────────

  get lignesArray(): FormArray { return this.lignesForm.get('lignes') as FormArray; }

  addLigne(): void {
    const g = this.fb.group({
      codeArticle:    [''],
      designation:    ['', Validators.required],
      quantite:       [1,  [Validators.required, Validators.min(0.001)]],
      prixUnitaireHT: [0,  [Validators.required, Validators.min(0)]],
      remise:         [0,  [Validators.min(0), Validators.max(100)]],
      prixRemise:     [{ value: 0, disabled: true }],
      tva:            [0,  Validators.required],
      totalHT:        [{ value: 0, disabled: true }],
      montantTVA:     [{ value: 0, disabled: true }],
      totalTTC:       [{ value: 0, disabled: true }]
    });

    ['quantite', 'prixUnitaireHT', 'remise', 'tva'].forEach(f =>
      g.get(f)!.valueChanges.subscribe(() => this.recalcLigne(g))
    );

    this.lignesArray.push(g);
    this.codeFilteredList.push([]);
    this.showCodeDropdown.push(false);
    this.designFilteredList.push([]);
    this.showDesignDropdown.push(false);
  }

  removeLigne(i: number): void {
    if (this.lignesArray.length > 1) {
      this.lignesArray.removeAt(i);
      this.codeFilteredList.splice(i, 1);
      this.showCodeDropdown.splice(i, 1);
      this.designFilteredList.splice(i, 1);
      this.showDesignDropdown.splice(i, 1);
    }
  }

  private recalcLigne(g: AbstractControl): void {
    const fg = g as FormGroup;
    const pu   = +fg.get('prixUnitaireHT')!.value || 0;
    const qte  = +fg.get('quantite')!.value       || 0;
    const rem  = +fg.get('remise')!.value          || 0;
    const tva  = +fg.get('tva')!.value             || 0;
    const pr   = this.r3(pu * (1 - rem / 100));
    const ht   = this.r3(pr * qte);
    const mtva = this.r3(ht * tva / 100);
    fg.patchValue({ prixRemise: pr, totalHT: ht, montantTVA: mtva,
                    totalTTC: this.r3(ht + mtva) }, { emitEvent: false });
  }

  // ── Autocomplete CODE article ─────────────────────────────────────────

  onCodeInput(i: number, val: string): void {
    this.ligneFg(i).get('codeArticle')!.setValue(val, { emitEvent: false });
    if (val.length >= 1) {
      this.codeFilteredList[i] = this.articles
        .filter(a => a.codeArticle.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 8);
      this.showCodeDropdown[i] = this.codeFilteredList[i].length > 0;
    } else {
      this.showCodeDropdown[i] = false;
    }
  }

  hideCodeDropdown(i: number): void {
    setTimeout(() => { this.showCodeDropdown[i] = false; }, 200);
  }

  // ── Autocomplete DÉSIGNATION article ─────────────────────────────────

  onDesignInput(i: number, val: string): void {
    this.ligneFg(i).get('designation')!.setValue(val, { emitEvent: false });
    if (val.length >= 1) {
      this.designFilteredList[i] = this.articles
        .filter(a => a.designation.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 8);
      this.showDesignDropdown[i] = this.designFilteredList[i].length > 0;
    } else {
      this.showDesignDropdown[i] = false;
    }
  }

  hideDesignDropdown(i: number): void {
    setTimeout(() => { this.showDesignDropdown[i] = false; }, 200);
  }

  // ── Sélection d'un article (depuis code OU désignation) ───────────────

  selectArticle(i: number, a: Article): void {
    const fg = this.ligneFg(i);
    fg.patchValue({
      codeArticle:    a.codeArticle,
      designation:    a.designation,
      prixUnitaireHT: a.prixAchatHT || 0,
      tva:            a.tva         || 0
    });
    this.showCodeDropdown[i]   = false;
    this.showDesignDropdown[i] = false;
    this.recalcLigne(fg);
  }

  // ── Totaux calculés ───────────────────────────────────────────────────

  get totalBrut(): number {
    return this.r3(this.lignesArray.controls.reduce((s, g) => {
      const fg = g as FormGroup;
      return s + (+fg.get('prixUnitaireHT')!.value || 0) * (+fg.get('quantite')!.value || 0);
    }, 0));
  }

  get totalHT(): number {
    return this.r3(this.lignesArray.controls.reduce((s, g) => {
      const fg  = g as FormGroup;
      const pu  = +fg.get('prixUnitaireHT')!.value || 0;
      const qte = +fg.get('quantite')!.value        || 0;
      const rem = +fg.get('remise')!.value           || 0;
      return s + pu * (1 - rem / 100) * qte;
    }, 0));
  }

  get totalRemise(): number { return this.r3(this.totalBrut - this.totalHT); }

  get totalTVA(): number {
    return this.r3(this.lignesArray.controls.reduce((s, g) => {
      const fg  = g as FormGroup;
      const pu  = +fg.get('prixUnitaireHT')!.value || 0;
      const qte = +fg.get('quantite')!.value        || 0;
      const rem = +fg.get('remise')!.value           || 0;
      const tva = +fg.get('tva')!.value              || 0;
      return s + pu * (1 - rem / 100) * qte * (tva / 100);
    }, 0));
  }

  get netAPayer(): number { return this.r3(this.totalHT + this.totalTVA + this.TIMBRE_FISCAL); }

  private r3(v: number): number { return Math.round(v * 1000) / 1000; }

  // ── Paiement ──────────────────────────────────────────────────────────

  get modePaiement(): string { return this.paiementForm.get('modePaiement')!.value; }
  get sousMode():     string { return this.paiementForm.get('sousMode')!.value; }

  onMontantPayeChange(): void {
    const reste = this.r3(this.netAPayer - (+this.paiementForm.get('montantPaye')!.value || 0));
    this.paiementForm.patchValue({ montantReste: Math.max(0, reste) });
  }

  // ── Retenue ───────────────────────────────────────────────────────────

  recalcRetenue(): void {
    const brut   = this.totalHT;
    const taux   = +this.retenueForm.get('tauxRetenue')!.value || 0;
    const retenu = this.r3(brut * taux / 100);
    this.retenueForm.patchValue({ montantBrut: brut, montantRetenu: retenu,
                                   montantNet: this.r3(brut - retenu) });
  }

  // ── Step 3 init ───────────────────────────────────────────────────────

  onStep3Enter(): void {
    this.paiementForm.patchValue({ montantPaye: this.netAPayer });
    this.onMontantPayeChange();
    this.recalcRetenue(); // pré-calculer les montants retenue dès l'arrivée au step 3
  }

  // ── Enregistrer la facture (indépendant de la retenue) ───────────────

  onSubmit(): void {
    if (this.paiementForm.invalid) { this.paiementForm.markAllAsTouched(); return; }
    this.isSavingFacture = true; this.errorMessage = '';
    const pv = this.paiementForm.value;
    const request = {
      numeroFacture: this.headerForm.get('numeroFacture')!.value,
      dateFacture:   this.headerForm.get('dateFacture')!.value,
      fournisseurId: this.headerForm.get('fournisseurId')!.value,
      lignes: this.lignesArray.controls.map((g, i) => {
        const fg = g as FormGroup;
        return {
          codeArticle:    fg.get('codeArticle')!.value || null,
          designation:    fg.get('designation')!.value,
          quantite:       +fg.get('quantite')!.value,
          prixUnitaireHT: +fg.get('prixUnitaireHT')!.value,
          remise:         +fg.get('remise')!.value || 0,
          tva:            +fg.get('tva')!.value    || 0,
          ordre: i + 1
        };
      }),
      paiement: {
        modePaiement:     pv.modePaiement,
        sousMode:         pv.sousMode || null,
        montantPaye:      +pv.montantPaye      || 0,
        montantReste:     +pv.montantReste     || 0,
        dateEcheance:     pv.dateEcheance      || null,
        numeroTraite:     pv.numeroTraite      || null,
        dateLimiteCredit: pv.dateLimiteCredit  || null
      }
    };
    this.factureAchatService.create(request).subscribe({
      next: facture => {
        this.savedFactureId  = facture.id  ?? null;
        this.savedFactureNum = facture.numeroFacture ?? '';
        this.isSavingFacture = false;
        this.router.navigate(['/achat'], { queryParams: { tab: 'factures' } });
      },
      error: err => {
        this.isSavingFacture = false;
        const status = err?.status;
        const detail = err?.error?.message || err?.error?.error || err?.message || 'Erreur inconnue';
        if (status === 401)      this.errorMessage = '⚠️ Session expirée. Reconnectez-vous.';
        else if (status === 403) this.errorMessage = '⚠️ Accès refusé (403).';
        else if (status === 0)   this.errorMessage = '⚠️ Serveur inaccessible (port 8099).';
        else                     this.errorMessage = `[HTTP ${status}] ${detail}`;
      }
    });
  }

  // ── Enregistrer la retenue seulement (indépendant de la facture) ──────

  onSubmitRetenueSeulement(): void {
    if (this.retenueForm.invalid) { this.retenueForm.markAllAsTouched(); return; }
    if (this.totalHT <= 0) {
      this.errorMessage = '⚠️ Le montant brut est 0. Vérifiez que les lignes d\'articles ont des prix corrects.';
      return;
    }
    const tauxVal = +this.retenueForm.get('tauxRetenue')!.value || 0;
    if (tauxVal <= 0) {
      this.errorMessage = '⚠️ Le taux de retenue doit être supérieur à 0.';
      return;
    }
    this.isSavingRetenue = true; this.errorMessage = ''; this.successRetenueMessage = '';
    const rv = this.retenueForm.value;
    const req = {
      dateRetenue:   rv.dateRetenue,
      lieuRetenue:   rv.lieuRetenue,
      fournisseurId: this.headerForm.get('fournisseurId')!.value,
      lignes: [{
        numeroFacture: this.headerForm.get('numeroFacture')!.value,
        montantBrut:   this.totalHT,
        tauxRetenue:   tauxVal,
        ordre: 1
      }]
    };
    this.factureAchatService.createRetenue(req).subscribe({
      next: retenue => {
        this.savedRetenueId = retenue?.id ?? null;
        this.isSavingRetenue = false;
        this.successRetenueMessage = 'La retenue à la source a été enregistrée avec succès.';
      },
      error: err => {
        this.isSavingRetenue = false;
        const status = err?.status;
        const body   = err?.error;
        let detail: string;
        if (body?.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
          // GlobalExceptionHandler validation errors: { data: { field: "message", ... } }
          detail = Object.entries(body.data as Record<string, string>)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ');
        } else {
          detail = body?.message || body?.error || err?.message || 'Erreur inconnue';
        }
        if (status === 0) this.errorMessage = '⚠️ Serveur inaccessible (port 8099).';
        else              this.errorMessage = `⚠️ Erreur retenue [HTTP ${status}] ${detail}`;
      }
    });
  }

  printFacture(): void {
    if (this.savedFactureId)
      this.factureAchatService.downloadFacturePdf(this.savedFactureId, this.savedFactureNum);
  }

  printRetenue(): void {
    if (this.savedRetenueId) this.factureAchatService.downloadRetenuePdf(this.savedRetenueId);
  }

  annuler(): void {
    if (confirm('Annuler la saisie ? Les données seront perdues.'))
      this.router.navigate(['/achat']);
  }

  // ── Helpers UI ────────────────────────────────────────────────────────

  fournisseurLabel(id: number): string {
    const f = this.fournisseurs.find(f => f.id === id);
    return f ? `${f.raisonSociale} (${f.matricule})` : '';
  }

  ligneFg(i: number): FormGroup { return this.lignesArray.at(i) as FormGroup; }

  trackByIndex(i: number): number { return i; }

  // ── Certificate helpers ───────────────────────────────────────────────

  readonly cniBoxes = new Array(8).fill(0);

  get company() { return environment.company; }

  get matriculeChars(): string[] {
    return environment.company.matriculeFiscal.split('');
  }

  get etablissementChars(): string[] {
    return environment.company.numeroEtab.split('');
  }

  get fournisseurSelectionne(): Fournisseur | null {
    const id = this.headerForm.get('fournisseurId')?.value;
    return id ? (this.fournisseurs.find(f => f.id === id) ?? null) : null;
  }

  get fournisseurMatriculeChars(): string[] {
    return (this.fournisseurSelectionne?.matricule ?? '').split('');
  }

  get fournisseurMatriculeCharsPadded(): string[] {
    const m = (this.fournisseurSelectionne?.matricule ?? '').padEnd(9, ' ');
    return m.slice(0, 9).split('');
  }

  get currentYearChars(): string[] {
    return new Date().getFullYear().toString().split('');
  }
}
