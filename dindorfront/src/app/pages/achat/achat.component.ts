import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Article, UNITES_ARTICLE } from '../../models/article.model';
import { ArticleService } from '../../services/article.service';
import { FournisseurService } from '../../services/fournisseur.service';
import { FamilleService } from '../../services/famille.service';
import { OrigineService } from '../../services/origine.service';
import { Fournisseur } from '../../models/fournisseur.model';
import { Famille } from '../../models/famille.model';
import { Origine } from '../../models/origine.model';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../pipes/number-format.pipe';
import { FactureAchatService } from '../../services/facture-achat.service';
import { FactureAchat, FactureAchatRequest, LigneFactureAchatRequest, PaiementAchatRequest } from '../../models/facture-achat.model';
import { TraiteService } from '../../services/traite.service';
import { RetenueSourceService } from '../../services/retenue-source.service';
import { montantEnLettres } from '../../utils/montant-en-lettres';

type FilterBloc = 'non-bloques' | 'bloques' | 'globale';

@Component({
  selector: 'app-achat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CurrencyFormatPipe, NumberFormatPipe],
  templateUrl: './achat.component.html',
  styleUrl: './achat.component.css'
})
export class AchatComponent implements OnInit {
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  fournisseurs: Fournisseur[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  filterBloc: FilterBloc = 'non-bloques';
  sortColumn: keyof Article | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  isModalArticleOpen = false;
  isEditingArticle = false;
  articleForm!: FormGroup;
  articleDuplicateError = '';
  /** Articles ajoutés dans la modale pendant la session (affichés dans un tableau) */
  articlesAddedInModal: Article[] = [];

  unites = [...UNITES_ARTICLE];
  familles: Famille[] = [];
  origines: Origine[] = [];
  isModalFamilleOpen = false;
  isModalOrigineOpen = false;
  isEditingFamille = false;
  isEditingOrigine = false;
  familleForm!: FormGroup;
  origineForm!: FormGroup;

  // ── Factures d'achat ──────────────────────────────────────────────────
  factures: FactureAchat[] = [];
  facturesLoading = false;
  activeTab: 'factures' | 'articles' = 'factures';
  traitesAlert: { numeroFacture: string; fournisseur: string; dateEcheance: string; joursRestants: number }[] = [];

  // ── SAISIE INLINE ─────────────────────────────────────────────────────────
  showSaisiePanel = false;
  saisieHeaderForm!: FormGroup;
  saisieIsSaving = false;
  saisieError = '';
  saisieSuccess = '';
  nextNumeroFacture = '';

  // ── Article picker modal ──────────────────────────────────────────────
  isArticlePickerOpen = false;
  articlePickerRowIdx = -1;
  articlePickerSearch = '';

  get filteredArticlesPicker(): Article[] {
    const term = this.articlePickerSearch.toLowerCase().trim();
    if (!term) return this.articles;
    return this.articles.filter(a =>
      a.codeArticle.toLowerCase().includes(term) ||
      a.designation.toLowerCase().includes(term)
    );
  }

  openArticlePicker(rowIdx: number): void {
    this.articlePickerRowIdx = rowIdx;
    this.articlePickerSearch = '';
    this.isArticlePickerOpen = true;
    setTimeout(() => (document.getElementById('article-picker-search') as HTMLInputElement)?.focus(), 80);
  }

  closeArticlePicker(): void {
    this.isArticlePickerOpen = false;
    this.articlePickerRowIdx = -1;
  }

  selectArticleFromPicker(article: Article): void {
    const rowIdx = this.articlePickerRowIdx;
    this.saisiesLignes.at(rowIdx).patchValue({
      codeArticle: article.codeArticle,
      designation: article.designation,
      puHT: article.prixAchatHT ?? 0,
      tva:  article.tva ?? 0
    });
    this.closeArticlePicker();
    setTimeout(() => this.focusCell(rowIdx, 'qte'), 80);
  }

  // Gardé pour rétro-compatibilité (plus utilisé)
  articleDropdownSearch: (string | undefined)[] = [];
  showArticleDropdowns: boolean[] = [];
  filteredArticlesForRow(_rowIdx: number): Article[] { return []; }
  onArticleFocus(_rowIdx: number): void {}
  onArticleSearchInput(_rowIdx: number, _value: string): void {}
  selectArticleForRow(_rowIdx: number, _article: Article): void {}
  hideArticleDropdown(_rowIdx: number): void {}

  // Paiement — toujours affiché
  saisieWithPaiement = true;
  saisiePaiementForm!: FormGroup;
  fournisseurAvecRS = false;

  get saisieModePaiement(): string {
    return this.saisiePaiementForm?.get('modePaiement')?.value ?? '';
  }

  /** Montant en espèces saisi */
  get saisieMontantEspeces(): number {
    return +(this.saisiePaiementForm?.get('montantEspeces')?.value) || 0;
  }

  /** Montant restant (traite ou crédit) */
  get saisieMontantReste(): number {
    const net = this.saisieStats.netAPayer;
    const mode = this.saisieModePaiement;
    if (mode === 'especes') return 0;
    if (mode === 'especes_traite' || mode === 'especes_credit') {
      return Math.max(0, net - this.saisieMontantEspeces);
    }
    return net; // traite ou credit intégral
  }

  private buildSaisiePaiementForm(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.saisiePaiementForm = this.fb.group({
      modePaiement:       ['especes', Validators.required],
      montantEspeces:     [0, [Validators.min(0)]],
      // Traite
      numeroTraite:       [''],
      ribCompte:          [''],
      tireur:             [''],
      tire:               [''],
      domiciliation:      [''],
      dateCreationTraite: [today],
      dateEcheance:       [today],
      lieuCreation:       ['KSIBET'],
      valeurEn:           ['Dinars Tunisiens'],
      // Crédit
      dateLimiteCredit:   [today]
    });
  }

  syncMontantPaye(): void {
    const mode = this.saisieModePaiement;
    if (mode === 'especes') {
      this.saisiePaiementForm.patchValue({ montantEspeces: +(this.saisieStats.netAPayer.toFixed(3)) });
    }
  }

  onFournisseurChange(): void {
    const id = this.saisieHeaderForm.get('fournisseurId')?.value;
    const found = this.fournisseurs.find(f => f.id === +id);
    this.fournisseurAvecRS = found?.avecRS ?? false;
    this.saisieWithRetenue = found?.avecRS ?? false;
  }

  // Retenue à la source
  saisieWithRetenue = false;
  saisieRetenueForm!: FormGroup;

  get montantRetenu(): number {
    const taux = +(this.saisieRetenueForm?.get('tauxRetenue')?.value) || 0;
    return this.saisieStats.totalHT * taux / 100;
  }

  private buildSaisieRetenueForm(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.saisieRetenueForm = this.fb.group({
      tauxRetenue:  [1.5, [Validators.required, Validators.min(0.001), Validators.max(99)]],
      lieuRetenue:  ['', Validators.required],
      dateRetenue:  [today, Validators.required]
    });
  }

  get saisiesLignes(): FormArray {
    return this.saisieHeaderForm.get('lignes') as FormArray;
  }

  get saisieStats() {
    let totalBrut = 0, totalRemise = 0, totalTVA = 0;
    for (const ctrl of this.saisiesLignes.controls) {
      const v = ctrl.value;
      const qte = +v.quantite || 0;
      const pu  = +v.puHT || 0;
      const rem = +v.remise || 0;
      const tva = +v.tva || 0;
      const brut = qte * pu;
      const remAmt = brut * rem / 100;
      totalBrut   += brut;
      totalRemise += remAmt;
      totalTVA    += (brut - remAmt) * tva / 100;
    }
    const totalHT = totalBrut - totalRemise;
    const timbre  = totalHT > 0 ? 1.000 : 0;
    return { totalBrut, totalRemise, totalHT, totalTVA, timbre, netAPayer: totalHT + totalTVA + timbre };
  }

  getLineMontantHT(i: number): number {
    const v = this.saisiesLignes.at(i).value;
    return (+v.quantite || 0) * (+v.puHT || 0) * (1 - (+v.remise || 0) / 100);
  }

  private buildSaisieHeaderForm(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.saisieHeaderForm = this.fb.group({
      fournisseurId: [null as number | null, Validators.required],
      dateFacture:   [today, Validators.required],
      lignes:        this.fb.array([])
    });
  }

  private buildSaisieLigneGroup(): FormGroup {
    return this.fb.group({
      codeArticle: [''],
      designation: ['', Validators.required],
      quantite:    [1,   [Validators.required, Validators.min(0.001)]],
      puHT:        [0,   [Validators.required, Validators.min(0)]],
      remise:      [0,   [Validators.min(0), Validators.max(100)]],
      tva:         [19,  [Validators.min(0), Validators.max(100)]]
    });
  }

  openSaisieFacture(): void {
    this.showSaisiePanel = true;
    this.saisieError = '';
    this.saisieSuccess = '';
    this.saisieWithPaiement = true;
    this.saisieWithRetenue = false;
    this.fournisseurAvecRS = false;
    const today = new Date().toISOString().slice(0, 10);
    const lignesArr = this.saisieHeaderForm.get('lignes') as FormArray;
    this.saisieHeaderForm.patchValue({ fournisseurId: null, dateFacture: today });
    while (lignesArr.length) lignesArr.removeAt(0);
    this.articleDropdownSearch = [undefined];
    this.showArticleDropdowns = [false];
    lignesArr.push(this.buildSaisieLigneGroup());
    this.buildSaisiePaiementForm();
    this.buildSaisieRetenueForm();
    this.factureAchatService.getNextNumero().subscribe({
      next: n  => this.nextNumeroFacture = n,
      error: () => this.nextNumeroFacture = '—'
    });
    setTimeout(() => {
      document.getElementById('saisie-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.focusCell(0, 'desig');
    }, 120);
  }

  closeSaisiePanel(): void {
    this.showSaisiePanel = false;
    this.saisieError = '';
    this.saisieSuccess = '';
  }

  addSaisieLigne(): void {
    this.saisiesLignes.push(this.buildSaisieLigneGroup());
    const idx = this.saisiesLignes.length - 1;
    this.articleDropdownSearch[idx] = undefined;
    this.showArticleDropdowns[idx] = false;
    setTimeout(() => this.focusCell(idx, 'desig'), 50);
  }

  removeSaisieLigne(i: number): void {
    if (this.saisiesLignes.length > 1) this.saisiesLignes.removeAt(i);
  }

  onArticleCodeEnter(rowIdx: number): void {
    const code = (this.saisiesLignes.at(rowIdx).get('codeArticle')?.value ?? '').trim();
    if (code) {
      const found = this.articles.find(a => a.codeArticle.toLowerCase() === code.toLowerCase());
      if (found) {
        this.saisiesLignes.at(rowIdx).patchValue({
          designation: found.designation,
          puHT: found.prixAchatHT ?? 0,
          tva:  found.tva ?? 0
        });
      }
    }
    this.focusCell(rowIdx, 'desig');
  }

  onCellEnter(rowIdx: number, nextField: string): void {
    this.focusCell(rowIdx, nextField);
  }

  onLastCellEnter(rowIdx: number): void {
    if (rowIdx === this.saisiesLignes.length - 1) {
      this.addSaisieLigne();
    } else {
      this.focusCell(rowIdx + 1, 'code');
    }
  }

  focusCell(rowIdx: number, fieldId: string): void {
    setTimeout(() => {
      const el = document.getElementById(`saisie-${rowIdx}-${fieldId}`) as HTMLInputElement | null;
      if (el) { el.focus(); el.select(); }
    }, 30);
  }

  onSaisieSubmit(): void {
    if (this.saisieHeaderForm.invalid) {
      this.saisieHeaderForm.markAllAsTouched();
      this.saisiesLignes.controls.forEach(c => (c as FormGroup).markAllAsTouched());
      this.saisieError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    if (this.saisieWithPaiement && this.saisiePaiementForm.invalid) {
      this.saisiePaiementForm.markAllAsTouched();
      this.saisieError = 'Veuillez remplir les informations de paiement.';
      return;
    }
    if (this.saisieWithRetenue && this.saisieRetenueForm.invalid) {
      this.saisieRetenueForm.markAllAsTouched();
      this.saisieError = 'Veuillez remplir les informations de retenue à la source.';
      return;
    }
    this.saisieIsSaving = true;
    this.saisieError = '';
    const hv = this.saisieHeaderForm.value;
    const stats = this.saisieStats;

    const pv = this.saisiePaiementForm.value;
    const mode = pv.modePaiement as string;
    const montantEspeces = +pv.montantEspeces || 0;
    const montantReste = this.saisieMontantReste;
    const isTraite = mode === 'traite' || mode === 'especes_traite';
    const isCredit = mode === 'credit' || mode === 'especes_credit';
    // Map frontend → backend enum (case-sensitive: ESPECES / AUTRE + sousMode)
    const backendMode  = mode === 'especes' ? 'ESPECES' : 'AUTRE';
    const backendSous  = mode === 'especes' ? 'TOUT_ESPECES'
                       : isTraite            ? 'ACOMPTE_TRAITE'
                       :                      'ACOMPTE_CREDIT';
    const paiement: PaiementAchatRequest = {
      modePaiement:     backendMode,
      sousMode:         backendSous,
      montantPaye:      mode === 'especes' ? stats.netAPayer : montantEspeces,
      montantReste:     montantReste,
      numeroTraite:     isTraite ? (pv.numeroTraite || undefined) : undefined,
      dateEcheance:     isTraite ? (pv.dateEcheance || undefined) : undefined,
      dateLimiteCredit: isCredit ? (pv.dateLimiteCredit || undefined) : undefined,
      avecRetenue:      this.saisieWithRetenue
    };

    const request: FactureAchatRequest = {
      dateFacture:   hv.dateFacture,
      fournisseurId: hv.fournisseurId,
      lignes: this.saisiesLignes.controls.map((ctrl, i) => {
        const v = ctrl.value;
        return {
          codeArticle:    v.codeArticle || undefined,
          designation:    v.designation,
          quantite:       +v.quantite,
          prixUnitaireHT: +v.puHT,
          remise:         +v.remise || 0,
          tva:            +v.tva || 0,
          ordre: i + 1
        } as LigneFactureAchatRequest;
      }),
      paiement
    };

    this.factureAchatService.create(request).subscribe({
      next: (facture) => {
        const numeroFacture = facture?.numeroFacture ?? this.nextNumeroFacture;
        const fournisseur = this.fournisseurs.find(f => f.id === hv.fournisseurId);
        const tasks: Promise<void>[] = [];

        // ── Enregistrer la traite dans l'état ────────────────────────────
        if (mode === 'traite' || mode === 'especes_traite') {
          const pv2 = this.saisiePaiementForm.value;
          tasks.push(new Promise(resolve => {
            this.traiteService.create({
                ribId: 0,
                fournisseurId: hv.fournisseurId,
                fournisseurNom: fournisseur?.raisonSociale ?? '',
                tireur: pv2.tireur || 'STE DINDOR',
                tire: pv2.tire || '',
                montant: this.saisieMontantReste,
                montantLettres: montantEnLettres(this.saisieMontantReste),
                dateCreation: pv2.dateCreationTraite || new Date().toISOString().slice(0, 10),
                dateEcheance: pv2.dateEcheance || '',
                lieuCreation: pv2.lieuCreation || 'KSIBET',
                domiciliation: pv2.domiciliation || '',
                nomAdresseTire: fournisseur?.raisonSociale ?? '',
                valeurEn: pv2.valeurEn || 'DT',
                statut: 'non_imprimee'
              }).subscribe(() => resolve());
          }));
        }

        // ── Enregistrer la retenue à la source ────────────────────────────
        if (this.saisieWithRetenue && stats.totalHT > 0) {
          const rv = this.saisieRetenueForm.value;
          tasks.push(new Promise(resolve => {
            const retenuePayload = {
              fournisseurId: hv.fournisseurId,
              fournisseurNom: fournisseur?.raisonSociale ?? '',
              fournisseurAdresse: fournisseur?.adresse ?? '',
              fournisseurMatricule: fournisseur?.matricule ?? '',
              fournisseurCodeTVA: fournisseur?.codeTVA ?? '',
              dateRetenue: rv.dateRetenue,
              lot: rv.lieuRetenue || 'KSIBET',
              taux: +rv.tauxRetenue,
              numeroFacture,
              montantBrut: stats.totalHT,
              retenue: stats.totalHT * (+rv.tauxRetenue) / 100,
              montantNet: stats.totalHT - (stats.totalHT * (+rv.tauxRetenue) / 100),
              libelle: `Retenue à la source ${rv.tauxRetenue}%`
            };
            this.retenueSourceService.create(retenuePayload).subscribe({
              next: () => resolve(),
              error: () => resolve()
            });
          }));
        }

        Promise.all(tasks).then(() => {
          this.saisieIsSaving = false;
          const msgs: string[] = ['Facture enregistrée.'];
          if (mode === 'traite' || mode === 'especes_traite') msgs.push('Traite enregistrée dans État.');
          if (this.saisieWithRetenue) msgs.push('Retenue à la source enregistrée dans État.');
          this.saisieSuccess = msgs.join(' ');
          setTimeout(() => { this.closeSaisiePanel(); this.loadFactures(); }, 1800);
        });
      },
      error: err => {
        this.saisieIsSaving = false;
        const body = err?.error;
        const detail = (body?.data && typeof body.data === 'object' && !Array.isArray(body.data))
          ? Object.entries(body.data as Record<string,string>).map(([k,v]) => `${k}: ${v}`).join(' | ')
          : body?.message || err?.message || 'Erreur inconnue';
        this.saisieError = `Erreur [HTTP ${err?.status}] ${detail}`;
      }
    });
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private fournisseurService: FournisseurService,
    private familleService: FamilleService,
    private origineService: OrigineService,
    private factureAchatService: FactureAchatService,
    private traiteService: TraiteService,
    private retenueSourceService: RetenueSourceService
  ) {
    this.buildArticleForm();
    this.buildSaisieHeaderForm();
    this.buildSaisiePaiementForm();
    this.buildSaisieRetenueForm();
    this.buildFamilleForm();
    this.buildOrigineForm();
  }

  private buildFamilleForm(): void {
    this.familleForm = this.fb.group({
      id: [0],
      code: [null as number | null, Validators.required],
      nom: ['', Validators.required]
    });
  }

  private buildOrigineForm(): void {
    this.origineForm = this.fb.group({
      id: [0],
      code: [null as number | null, Validators.required],
      designation: ['', Validators.required]
    });
  }

  private buildArticleForm(): void {
    this.articleForm = this.fb.group({
      id: [0],
      codeArticle: ['', [Validators.required, Validators.maxLength(50)]],
      designation: ['', [Validators.required, Validators.maxLength(500)]],
      unite: ['', Validators.required],
      famille: ['', Validators.required],
      origine: ['', Validators.maxLength(200)],
      // Champs conservés en interne pour l'API (non affichés dans le formulaire)
      prixAchatHT: [0, Validators.min(0)],
      prixVente: [0, Validators.min(0)],
      tva: [0, [Validators.min(0), Validators.max(100)]],
      stock1: [0, Validators.min(0)],
      stock2: [0, Validators.min(0)],
      pump: [0, Validators.min(0)],
      qteNbre: [false],
      autreIndir: [false],
      stockezBlock: [false]
    });
  }

  ngOnInit(): void {
    this.loadArticles();
    this.loadFamillesEtOrigines();
    this.loadFactures();
    this.fournisseurService.getAll().subscribe({
      next: (list) => this.fournisseurs = list ?? []
    });
    // Ouvrir l'onglet demandé (ex: après redirect depuis le wizard)
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'articles') this.activeTab = 'articles';
      else this.activeTab = 'factures';
    });
  }

  loadFactures(): void {
    this.facturesLoading = true;
    this.errorMessage = '';
    this.factureAchatService.getAll().subscribe({
      next: (list) => {
        this.factures = list ?? [];
        this.facturesLoading = false;
        this.checkTraitesEcheances();
      },
      error: (err) => {
        this.facturesLoading = false;
        const status = err?.status;
        if (status === 0) {
          this.errorMessage = '⚠️ Serveur inaccessible. Vérifiez que le backend est démarré sur le port 8099.';
        } else if (status === 401) {
          this.errorMessage = '⚠️ Session expirée. Reconnectez-vous.';
        } else {
          this.errorMessage = `⚠️ Erreur chargement factures [HTTP ${status}].`;
        }
      }
    });
  }

  checkTraitesEcheances(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.traitesAlert = this.factures
      .filter(f => f.paiement?.dateEcheance)
      .map(f => {
        const echeance = new Date(f.paiement!.dateEcheance!);
        echeance.setHours(0, 0, 0, 0);
        const joursRestants = Math.ceil((echeance.getTime() - today.getTime()) / 86400000);
        return {
          numeroFacture: f.numeroFacture,
          fournisseur: f.fournisseurRaisonSociale ?? '',
          dateEcheance: f.paiement!.dateEcheance!,
          joursRestants
        };
      })
      .filter(t => t.joursRestants >= 0 && t.joursRestants <= 7)
      .sort((a, b) => a.joursRestants - b.joursRestants);
  }

  deleteFacture(id: number, numeroFacture: string): void {
    if (!confirm(`Supprimer la facture ${numeroFacture} ?`)) return;
    this.factureAchatService.delete(id).subscribe({
      next: () => { this.factures = this.factures.filter(f => f.id !== id); },
      error: () => { this.errorMessage = 'Erreur lors de la suppression de la facture.'; }
    });
  }

  printFacture(id: number, numeroFacture: string): void {
    this.factureAchatService.downloadFacturePdf(id, numeroFacture);
  }

  private loadFamillesEtOrigines(): void {
    this.familleService.getAll().subscribe(f => (this.familles = f ?? []));
    this.origineService.getAll().subscribe(o => (this.origines = o ?? []));
  }

  private loadArticles(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.articleService.getAll().subscribe({
      next: (data) => {
        this.articles = data ?? [];
        this.syncArticleCodeCounter();
        this.applyFilterAndSort();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des articles.';
        this.isLoading = false;
      }
    });
  }

  private applyFilterAndSort(): void {
    let list = this.articles.filter(a => {
      if (this.filterBloc === 'bloques') return a.stockezBlock;
      if (this.filterBloc === 'non-bloques') return !a.stockezBlock;
      return true;
    });
    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(a =>
        a.codeArticle.toLowerCase().includes(term) ||
        a.designation.toLowerCase().includes(term) ||
        a.famille.toLowerCase().includes(term)
      );
    }
    if (this.sortColumn) {
      list = [...list].sort((a, b) => {
        const va = a[this.sortColumn as keyof Article];
        const vb = b[this.sortColumn as keyof Article];
        let cmp = 0;
        if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
        else if (typeof va === 'string' && typeof vb === 'string') cmp = va.localeCompare(vb);
        else if (typeof va === 'boolean' && typeof vb === 'boolean') cmp = (va ? 1 : 0) - (vb ? 1 : 0);
        else cmp = String(va ?? '').localeCompare(String(vb ?? ''));
        return this.sortDirection === 'asc' ? cmp : -cmp;
      });
    }
    this.filteredArticles = list;
  }

  get totalValeur(): number {
    return this.filteredArticles.reduce((s, a) => s + this.valeurArticle(a), 0);
  }

  valeurArticle(a: Article): number {
    const qty = a.stock1 ?? 0;
    const prix = (a.pump && a.pump > 0) ? a.pump : (a.prixAchatHT ?? 0);
    return qty * prix;
  }

  onSearchChange(): void {
    this.applyFilterAndSort();
  }

  setFilterBloc(value: FilterBloc): void {
    this.filterBloc = value;
    this.applyFilterAndSort();
  }

  sortBy(column: keyof Article): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilterAndSort();
  }

  private readonly ARTICLE_CODE_KEY = 'dindor_article_code';

  private generateCodeArticle(): string {
    let n = 1;
    try {
      const stored = localStorage.getItem(this.ARTICLE_CODE_KEY);
      if (stored) n = parseInt(stored, 10) + 1;
    } catch {}
    localStorage.setItem(this.ARTICLE_CODE_KEY, n.toString());
    return n.toString();
  }

  private syncArticleCodeCounter(): void {
    let maxCode = 0;
    this.articles.forEach(a => {
      const n = parseInt(String(a.codeArticle || ''), 10);
      if (!isNaN(n) && n > maxCode) maxCode = n;
    });
    try {
      const stored = localStorage.getItem(this.ARTICLE_CODE_KEY);
      const current = stored ? parseInt(stored, 10) : 0;
      if (maxCode >= current) {
        localStorage.setItem(this.ARTICLE_CODE_KEY, maxCode.toString());
      }
    } catch {}
  }

  getNextCodeArticle(): string {
    let n = 0;
    try {
      const stored = localStorage.getItem(this.ARTICLE_CODE_KEY);
      if (stored) n = parseInt(stored, 10);
    } catch {}
    return (n + 1).toString();
  }

  // --- Facture Achat ---
  openFactureAchatModal(): void {
    this.openSaisieFacture();
  }

  closeFactureAchatModal(): void {
    this.closeSaisiePanel();
  }

  // --- Article (Ajout) ---
  openAddArticleModal(): void {
    this.isEditingArticle = false;
    this.articleDuplicateError = '';
    this.articlesAddedInModal = [];
    this.articleForm.reset({
      id: 0,
      codeArticle: this.getNextCodeArticle(),
      designation: '',
      unite: '',
      famille: '',
      origine: '',
      prixAchatHT: 0,
      prixVente: 0,
      tva: 0,
      stock1: 0,
      stock2: 0,
      pump: 0,
      qteNbre: false,
      autreIndir: false,
      stockezBlock: false
    });
    this.isModalArticleOpen = true;
  }

  closeArticleModal(): void {
    this.isModalArticleOpen = false;
    this.articleDuplicateError = '';
    this.articlesAddedInModal = [];
  }

  onViderArticle(): void {
    this.articleForm.patchValue({
      designation: '',
      unite: '',
      famille: '',
      origine: '',
      prixAchatHT: 0,
      prixVente: 0,
      tva: 0,
      stock1: 0,
      stock2: 0,
      pump: 0,
      qteNbre: false,
      autreIndir: false,
      stockezBlock: false
    });
    if (!this.isEditingArticle) {
      this.articleForm.patchValue({ codeArticle: this.getNextCodeArticle() });
    }
    this.articleDuplicateError = '';
  }

  onAjouterArticle(): void {
    if (this.articleForm.invalid) {
      this.articleForm.markAllAsTouched();
      return;
    }
    const v = this.articleForm.value;
    this.articleDuplicateError = '';
    this.articleService.checkDuplicate(v.codeArticle, v.designation, this.isEditingArticle ? v.id : undefined).subscribe({
      next: (r) => {
        if (r.codeExists) {
          this.articleDuplicateError = 'Un article avec ce code existe déjà.';
          return;
        }
        if (r.designationExists) {
          this.articleDuplicateError = 'Un article avec ce nom (désignation) existe déjà. Impossible de saisir deux fois le même article.';
          return;
        }
        this.saveArticle();
      }
    });
  }

  private saveArticle(): void {
    const v = this.articleForm.value;
    const codeFinal = this.isEditingArticle ? v.codeArticle : this.generateCodeArticle();
    const payload: Partial<Article> = {
      codeArticle: codeFinal,
      designation: v.designation,
      unite: v.unite,
      famille: v.famille != null ? String(v.famille) : '',
      origine: v.origine != null ? String(v.origine) : '',
      prixAchatHT: Number(v.prixAchatHT) || 0,
      prixVente: Number(v.prixVente) || 0,
      tva: Number(v.tva) || 0,
      stock1: Number(v.stock1) || 0,
      stock2: Number(v.stock2) || 0,
      pump: Number(v.pump) || 0,
      qteNbre: !!v.qteNbre,
      autreIndir: !!v.autreIndir,
      stockezBlock: !!v.stockezBlock
    };
    if (this.isEditingArticle && v.id) {
      this.articleService.update(v.id, payload).subscribe({
        next: (updated) => {
          const idx = this.articles.findIndex(a => a.id === updated.id);
          if (idx !== -1) this.articles[idx] = updated;
          this.applyFilterAndSort();
          this.closeArticleModal();
        },
        error: (err) => this.errorMessage = err?.error?.message || 'Erreur lors de la mise à jour.'
      });
    } else {
      this.articleService.create(payload).subscribe({
        next: (created) => {
          this.articles = [created, ...this.articles];
          this.applyFilterAndSort();
          this.articlesAddedInModal = [created, ...this.articlesAddedInModal];
          this.onViderArticle();
        },
        error: (err) => this.errorMessage = err?.error?.message || 'Erreur lors de la création.'
      });
    }
  }

  openEditArticle(article: Article): void {
    this.isEditingArticle = true;
    this.articleDuplicateError = '';
    const familleVal = this.familles.find(f => f.code === Number(article.famille) || f.nom === article.famille)?.code ?? article.famille;
    const origineVal = this.origines.find(o => o.code === Number(article.origine) || o.designation === article.origine)?.code ?? article.origine;
    this.articleForm.patchValue({
      id: article.id,
      codeArticle: article.codeArticle,
      designation: article.designation,
      unite: article.unite,
      famille: familleVal,
      origine: origineVal,
      prixAchatHT: article.prixAchatHT,
      prixVente: article.prixVente,
      tva: article.tva ?? 0,
      stock1: article.stock1,
      stock2: article.stock2 ?? 0,
      pump: article.pump ?? 0,
      qteNbre: article.qteNbre ?? false,
      autreIndir: article.autreIndir ?? false,
      stockezBlock: article.stockezBlock ?? false
    });
    this.isModalArticleOpen = true;
  }

  deleteArticle(article: Article, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Supprimer l'article ${article.designation} ?`)) return;
    this.articleService.delete(article.id).subscribe({
      next: () => {
        this.articles = this.articles.filter(a => a.id !== article.id);
        this.applyFilterAndSort();
      },
      error: (err) => this.errorMessage = err?.error?.message || 'Erreur lors de la suppression.'
    });
  }

  quitter(): void {
    this.router.navigate(['/home']);
  }

  initialiser(): void {
    this.searchTerm = '';
    this.filterBloc = 'non-bloques';
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.loadArticles();
  }

  openFamilleModal(): void {
    this.isEditingFamille = false;
    this.familleForm.reset({ id: 0, code: null, nom: '' });
    this.isModalFamilleOpen = true;
  }

  closeFamilleModal(): void {
    this.isModalFamilleOpen = false;
  }

  onSubmitFamille(): void {
    if (this.familleForm.invalid) return;
    const v = this.familleForm.value;
    if (this.isEditingFamille && v.id) {
      this.familleService.update(v.id, { code: Number(v.code), nom: v.nom }).subscribe(() => {
        this.loadFamillesEtOrigines();
        this.familleForm.reset({ id: 0, code: null, nom: '' });
        this.isEditingFamille = false;
      });
    } else {
      this.familleService.create({ code: Number(v.code), nom: v.nom }).subscribe(() => {
        this.loadFamillesEtOrigines();
        this.familleForm.reset({ id: 0, code: null, nom: '' });
      });
    }
  }

  editFamille(f: Famille): void {
    this.isEditingFamille = true;
    this.familleForm.patchValue({ id: f.id, code: f.code, nom: f.nom });
  }

  deleteFamille(f: Famille): void {
    if (!confirm(`Supprimer la famille "${f.nom}" ?`)) return;
    this.familleService.delete(f.id).subscribe(() => this.loadFamillesEtOrigines());
  }

  openOrigineModal(): void {
    this.isEditingOrigine = false;
    this.origineForm.reset({ id: 0, code: null, designation: '' });
    this.isModalOrigineOpen = true;
  }

  closeOrigineModal(): void {
    this.isModalOrigineOpen = false;
  }

  onSubmitOrigine(): void {
    if (this.origineForm.invalid) return;
    const v = this.origineForm.value;
    if (this.isEditingOrigine && v.id) {
      this.origineService.update(v.id, { code: Number(v.code), designation: v.designation }).subscribe(() => {
        this.loadFamillesEtOrigines();
        this.origineForm.reset({ id: 0, code: null, designation: '' });
        this.isEditingOrigine = false;
      });
    } else {
      this.origineService.create({ code: Number(v.code), designation: v.designation }).subscribe(() => {
        this.loadFamillesEtOrigines();
        this.origineForm.reset({ id: 0, code: null, designation: '' });
      });
    }
  }

  editOrigine(o: Origine): void {
    this.isEditingOrigine = true;
    this.origineForm.patchValue({ id: o.id, code: o.code, designation: o.designation });
  }

  deleteOrigine(o: Origine): void {
    if (!confirm(`Supprimer l'origine "${o.designation}" ?`)) return;
    this.origineService.delete(o.id).subscribe(() => this.loadFamillesEtOrigines());
  }

  transfertExcel(): void {
    const rows = this.filteredArticles.map((a, i) => ({
      '#': i + 1,
      'Article': a.codeArticle,
      'Libellé': a.designation,
      'Famille': a.famille,
      'Stock 1': a.stock1,
      'Unité': a.unite,
      'PAHT': a.prixAchatHT,
      'PUMP': a.pump,
      'Valeur': this.valeurArticle(a),
      'Stock 2': a.stock2
    }));
    const csv = ['#', 'Article', 'Libellé', 'Famille', 'Stock 1', 'Unité', 'PAHT', 'PUMP', 'Valeur', 'Stock 2'].join(';') + '\n' +
      rows.map(r => Object.values(r).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `articles_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
