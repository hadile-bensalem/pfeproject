import { Component, OnInit } from '@angular/core';
import { catchError, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RIB, formatRibDisplay } from '../../models/rib.model';
import { Traite, StatutTraite } from '../../models/traite.model';
import { RibService } from '../../services/rib.service';
import { TraiteService } from '../../services/traite.service';
import { FournisseurService } from '../../services/fournisseur.service';
import { LettreDeChangeService } from '../../services/lettre-de-change.service';
import { RetenueSourceService } from '../../services/retenue-source.service';
import { CertificatRetenueService } from '../../services/certificat-retenue.service';
import { Fournisseur } from '../../models/fournisseur.model';
import { RetenueSource } from '../../models/retenue-source.model';
import { FactureFournisseur } from '../../models/retenue-source.model';
import { montantEnLettres } from '../../utils/montant-en-lettres';

@Component({
  selector: 'app-etat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './etat.component.html',
  styleUrl: './etat.component.css'
})
export class EtatComponent implements OnInit {
  ribs: RIB[] = [];
  traites: Traite[] = [];
  fournisseurs: Fournisseur[] = [];
  filteredTraites: Traite[] = [];
  searchTerm = '';
  filterRib = '';
  filterFournisseur = '';
  filterStatut: StatutTraite | '' = '';

  activeTab: 'traites' | 'retenues' = 'traites';
  ribModalView: 'list' | 'form' = 'list';
  isModalTraiteOpen = false;
  isModalRibOpen = false;
  isModalRibEdit = false;
  ribForm!: FormGroup;
  traiteForm!: FormGroup;
  ribListForSelect: { value: string; label: string; rib: RIB }[] = [];
  ribFormMode: 'select' | 'manual' = 'select';
  selectedRibForLink: RIB | null = null;

  retenues: RetenueSource[] = [];
  retenueForm!: FormGroup;
  facturesFournisseur: FactureFournisseur[] = [];

  constructor(
    private fb: FormBuilder,
    private ribService: RibService,
    private traiteService: TraiteService,
    private fournisseurService: FournisseurService,
    private lettreDeChangeService: LettreDeChangeService,
    private retenueSourceService: RetenueSourceService,
    private certificatRetenueService: CertificatRetenueService
  ) {
    this.buildRibForm();
    this.buildTraiteForm();
    this.buildRetenueForm();
  }

  private buildRibForm(): void {
    this.ribForm = this.fb.group({
      id: [0],
      codeEtablissement: ['', Validators.required],
      codeAgence: ['', Validators.required],
      numeroCompte: ['', Validators.required],
      domiciliation: ['', Validators.required]
    });
  }

  private buildTraiteForm(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.traiteForm = this.fb.group({
      ribSelect: [''],
      ribManual: [''],
      fournisseurId: [null as number | null, Validators.required],
      tireur: ['', Validators.required],
      tire: [''],
      montant: [0, [Validators.required, Validators.min(0)]],
      montantLettres: [''],
      dateCreation: [today, Validators.required],
      dateEcheance: [today, Validators.required],
      lieuCreation: [''],
      domiciliation: [''],
      nomAdresseTire: [''],
      valeurEn: ['DT']
    });
    this.traiteForm.get('montant')?.valueChanges.subscribe(v => {
      const lettres = montantEnLettres(Number(v) || 0);
      this.traiteForm.patchValue({ montantLettres: lettres }, { emitEvent: false });
    });
  }

  private buildRetenueForm(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.retenueForm = this.fb.group({
      fournisseurId: [null as number | null, Validators.required],
      dateRetenue: [today, Validators.required],
      lot: ['KSIBET'],
      taux: [1, [Validators.required, Validators.min(0), Validators.max(100)]],
      numeroFacture: [''],
      montantBrut: [0, [Validators.required, Validators.min(0)]],
      retenue: [0],
      montantNet: [0],
      libelle: ['Retenue à la source marché (1%)']
    });
    this.retenueForm.get('montantBrut')?.valueChanges.subscribe(() => this.onMontantOrTauxChangeRetenue());
    this.retenueForm.get('taux')?.valueChanges.subscribe(() => this.onMontantOrTauxChangeRetenue());
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.ribService.getAll().subscribe(ribs => {
      this.ribs = ribs;
      this.ribListForSelect = ribs.map(r => ({
        value: formatRibDisplay(r),
        label: `${formatRibDisplay(r)} - ${r.domiciliation}`,
        rib: r
      }));
    });
    this.traiteService.getAll().subscribe(t => {
      this.traites = t;
      this.applyFilters();
    });
    this.fournisseurService.getAll().pipe(catchError(() => of([]))).subscribe(f => {
      this.fournisseurs = f ?? [];
    });
    this.retenueSourceService.getAll().subscribe(r => (this.retenues = r));
  }

  get fournisseursFiltres(): Fournisseur[] {
    if (!this.selectedRibForLink || !this.selectedRibForLink.fournisseurIds?.length) {
      return this.fournisseurs;
    }
    return this.fournisseurs.filter(f => this.selectedRibForLink!.fournisseurIds.includes(f.id));
  }

  private applyFilters(): void {
    let list = [...this.traites];
    if (this.filterRib) {
      list = list.filter(t => {
        const r = this.ribs.find(rr => rr.id === t.ribId);
        return r && formatRibDisplay(r).includes(this.filterRib);
      });
    }
    if (this.filterFournisseur) {
      list = list.filter(t => t.fournisseurNom?.toLowerCase().includes(this.filterFournisseur.toLowerCase()));
    }
    if (this.filterStatut) {
      list = list.filter(t => t.statut === this.filterStatut);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(t =>
        t.ordrePaiement?.toLowerCase().includes(term) ||
        t.fournisseurNom?.toLowerCase().includes(term) ||
        t.tireur?.toLowerCase().includes(term)
      );
    }
    this.filteredTraites = list;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  // --- Traite ---
  openAddTraiteModal(): void {
    this.traiteForm.reset({
      ribSelect: '',
      ribManual: '',
      fournisseurId: null,
      tireur: '',
      tire: 'KSIBET',
      montant: 0,
      montantLettres: montantEnLettres(0),
      dateCreation: new Date().toISOString().slice(0, 10),
      dateEcheance: new Date().toISOString().slice(0, 10),
      lieuCreation: 'KSIBET',
      domiciliation: 'BIAT KSIBET EL M.',
      nomAdresseTire: 'STE DINDOR',
      valeurEn: 'DT'
    });
    this.ribFormMode = 'select';
    this.selectedRibForLink = null;
    this.isModalTraiteOpen = true;
  }

  closeTraiteModal(): void {
    this.isModalTraiteOpen = false;
  }

  onRibSelectChange(): void {
    const val = this.traiteForm.get('ribSelect')?.value;
    if (!val) {
      this.selectedRibForLink = null;
      return;
    }
    const opt = this.ribListForSelect.find(o => o.value === val);
    if (opt) {
      this.selectedRibForLink = opt.rib;
      this.traiteForm.patchValue({
        domiciliation: opt.rib.domiciliation,
        ribManual: ''
      });
    }
  }

  onRibManualInput(): void {
    const manual = this.traiteForm.get('ribManual')?.value?.trim();
    if (manual) {
      this.selectedRibForLink = null;
      this.traiteForm.patchValue({ ribSelect: '' });
    }
  }

  onSubmitTraite(): void {
    if (this.traiteForm.invalid) {
      this.traiteForm.markAllAsTouched();
      return;
    }
    const v = this.traiteForm.value;
    let rib: RIB;

    if (this.ribFormMode === 'select' && v.ribSelect) {
      const opt = this.ribListForSelect.find(o => o.value === v.ribSelect);
      if (!opt) return;
      rib = opt.rib;
    } else {
      const manual = String(v.ribManual || '').trim();
      const parts = manual.split('|').map((p: string) => p.trim());
      if (parts.length !== 3) {
        alert('Format RIB attendu : Code Établissement | Code Agence | N° Compte (ex: 08 | 505 | 00027100209688)');
        return;
      }
      const fournisseurId = v.fournisseurId;
      rib = {
        id: 0,
        codeEtablissement: parts[0],
        codeAgence: parts[1],
        numeroCompte: parts[2],
        domiciliation: v.domiciliation || '',
        fournisseurIds: fournisseurId ? [fournisseurId] : []
      };
      this.ribService.save(rib).subscribe(saved => {
        rib = saved;
        this.ribs = [saved, ...this.ribs];
        this.ribListForSelect = [{ value: formatRibDisplay(saved), label: formatRibDisplay(saved) + ' - ' + saved.domiciliation, rib: saved }, ...this.ribListForSelect];
        this.doSaveTraite(rib, v);
      });
      return;
    }
    this.doSaveTraite(rib, v);
  }

  private doSaveTraite(rib: RIB, v: any): void {
    const fournisseur = this.fournisseurs.find(f => f.id === v.fournisseurId);
    this.traiteService.create({
      ribId: rib.id,
      fournisseurId: v.fournisseurId,
      fournisseurNom: fournisseur?.raisonSociale ?? '',
      tireur: v.tireur,
      tire: v.tire || 'KSIBET',
      montant: Number(v.montant) || 0,
      montantLettres: v.montantLettres || montantEnLettres(Number(v.montant) || 0),
      dateCreation: v.dateCreation,
      dateEcheance: v.dateEcheance,
      lieuCreation: v.lieuCreation || '',
      domiciliation: v.domiciliation || rib.domiciliation,
      nomAdresseTire: v.nomAdresseTire || '',
      valeurEn: v.valeurEn || 'DT',
      statut: 'non_imprimee'
    }).subscribe(() => {
      this.loadData();
      this.closeTraiteModal();
    });
  }

  voirTraite(t: Traite): void {
    const rib = this.ribs.find(r => r.id === t.ribId) ?? null;
    this.lettreDeChangeService.openPrintWindow(t, rib, false);
  }

  imprimerTraite(t: Traite): void {
    this.traiteService.setStatut(t.id, 'imprimee').subscribe(() => this.loadData());
    const rib = this.ribs.find(r => r.id === t.ribId) ?? null;
    this.lettreDeChangeService.openPrintWindow(t, rib, true);
  }

  supprimerTraite(t: Traite): void {
    if (!confirm(`Supprimer la traite ${t.ordrePaiement} ?`)) return;
    this.traiteService.delete(t.id).subscribe(() => this.loadData());
  }

  getRibDisplay(ribId: number): string {
    const r = this.ribs.find(rr => rr.id === ribId);
    return r ? formatRibDisplay(r) : '—';
  }

  getStatutLabel(s: StatutTraite): string {
    const m: Record<StatutTraite, string> = {
      non_imprimee: 'Non Imprimée',
      imprimee: 'Imprimée',
      echue: 'Échue'
    };
    return m[s] ?? s;
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const x = new Date(d);
    if (isNaN(x.getTime())) return d;
    return x.getDate().toString().padStart(2, '0') + '/' +
      (x.getMonth() + 1).toString().padStart(2, '0') + '/' + x.getFullYear();
  }

  exportExcel(): void {
    const headers = ['N° Ordre', 'Fournisseur', 'Tireur', 'Montant', 'Date Création', 'Échéance', 'RIB', 'Domiciliation', 'Statut'];
    const rows = this.filteredTraites.map(t => [
      t.ordrePaiement,
      t.fournisseurNom,
      t.tireur,
      t.montant,
      this.formatDate(t.dateCreation),
      this.formatDate(t.dateEcheance),
      this.getRibDisplay(t.ribId),
      t.domiciliation,
      this.getStatutLabel(t.statut)
    ]);
    const csv = headers.join(';') + '\n' + rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `traites_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // --- RIB ---
  openRibModal(): void {
    this.ribModalView = 'list';
    this.isModalRibOpen = true;
  }

  openRibModalForm(): void {
    this.ribForm.reset({ id: 0, codeEtablissement: '', codeAgence: '', numeroCompte: '', domiciliation: '' });
    this.isModalRibEdit = false;
    this.ribModalView = 'form';
  }

  closeRibModal(): void {
    this.isModalRibOpen = false;
    this.ribModalView = 'list';
  }

  onSubmitRib(): void {
    if (this.ribForm.invalid) return;
    const v = this.ribForm.value;
    const existing = this.ribs.find(r => r.id === v.id);
    this.ribService.save({
      id: v.id || 0,
      codeEtablissement: v.codeEtablissement,
      codeAgence: v.codeAgence,
      numeroCompte: v.numeroCompte,
      domiciliation: v.domiciliation,
      fournisseurIds: existing?.fournisseurIds ?? []
    }).subscribe(() => {
      this.loadData();
      this.ribModalView = 'list';
    });
  }

  editRib(rib: RIB): void {
    this.ribForm.patchValue({
      id: rib.id,
      codeEtablissement: rib.codeEtablissement,
      codeAgence: rib.codeAgence,
      numeroCompte: rib.numeroCompte,
      domiciliation: rib.domiciliation
    });
    this.isModalRibEdit = true;
    this.ribModalView = 'form';
  }

  deleteRib(rib: RIB): void {
    if (!confirm(`Supprimer le RIB ${formatRibDisplay(rib)} ?`)) return;
    this.ribService.delete(rib.id).subscribe(() => this.loadData());
  }

  // --- Retenues à la Source ---
  openAddRetenueModal(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.facturesFournisseur = [];
    this.retenueForm.reset({
      fournisseurId: null,
      dateRetenue: today,
      lot: 'KSIBET',
      taux: 1,
      numeroFacture: '',
      montantBrut: 0,
      retenue: 0,
      montantNet: 0,
      libelle: 'Retenue à la source marché (1%)'
    });
  }

  onFournisseurChangeRetenue(): void {
    const id = this.retenueForm.get('fournisseurId')?.value;
    if (!id) {
      this.facturesFournisseur = [];
      this.retenueForm.patchValue({ numeroFacture: '', montantBrut: 0 }, { emitEvent: false });
      this.onMontantOrTauxChangeRetenue();
      return;
    }
    const f = this.fournisseurs.find(x => x.id === id);
    if (f) {
      this.retenueForm.patchValue({
        numeroFacture: '',
        montantBrut: 0
      }, { emitEvent: false });
      this.onMontantOrTauxChangeRetenue();
    }
    this.fournisseurService.getTransactionsByFournisseur(id)
      .pipe(catchError(() => of([])))
      .subscribe(txs => {
        this.facturesFournisseur = (txs as any[]).map(t => ({
          numeroFacture: t.numeroFacture || '',
          montantTotal: t.debit ?? t.credit ?? 0,
          date: t.date || ''
        })).filter(x => x.numeroFacture);
        if (this.facturesFournisseur.length === 0) {
          this.facturesFournisseur = [{ numeroFacture: '— Aucune facture —', montantTotal: 0, date: '' }];
        }
      });
  }

  onFactureChangeRetenue(): void {
    const num = this.retenueForm.get('numeroFacture')?.value;
    const fac = this.facturesFournisseur.find(f => f.numeroFacture === num);
    if (fac && fac.montantTotal > 0) {
      this.retenueForm.patchValue({ montantBrut: fac.montantTotal });
      this.onMontantOrTauxChangeRetenue();
    }
  }

  onMontantOrTauxChangeRetenue(): void {
    const brut = Number(this.retenueForm.get('montantBrut')?.value) || 0;
    const taux = Number(this.retenueForm.get('taux')?.value) || 0;
    const ret = brut * taux / 100;
    const net = brut - ret;
    this.retenueForm.patchValue({ retenue: ret, montantNet: net }, { emitEvent: false });
  }

  private doSubmitRetenue(andPrint: boolean): void {
    if (this.retenueForm.invalid) return;
    const v = this.retenueForm.value;
    const fournisseur = this.fournisseurs.find(f => f.id === v.fournisseurId);
    if (!fournisseur) return;
    const payload = {
      fournisseurId: v.fournisseurId,
      fournisseurNom: fournisseur.raisonSociale,
      fournisseurAdresse: fournisseur.adresse || '',
      fournisseurMatricule: fournisseur.matricule || '',
      fournisseurCodeTVA: fournisseur.codeTVA || '',
      dateRetenue: v.dateRetenue,
      lot: v.lot || 'KSIBET',
      taux: Number(v.taux) || 1,
      numeroFacture: v.numeroFacture || '',
      montantBrut: Number(v.montantBrut) || 0,
      retenue: Number(v.retenue) || 0,
      montantNet: Number(v.montantNet) || 0,
      libelle: v.libelle || 'Retenue à la source marché'
    };
    this.retenueSourceService.create(payload).subscribe(created => {
      this.retenues = [created, ...this.retenues];
      this.openAddRetenueModal();
      if (andPrint) this.certificatRetenueService.openPrintWindow(created, undefined, true);
    });
  }

  onSubmitRetenue(): void {
    this.doSubmitRetenue(false);
  }

  onSubmitRetenueAndPrint(): void {
    this.doSubmitRetenue(true);
  }

  imprimerRetenue(r: RetenueSource): void {
    this.certificatRetenueService.openPrintWindow(r, undefined, true);
  }

  voirRetenue(r: RetenueSource): void {
    this.certificatRetenueService.openPrintWindow(r, undefined, false);
  }

  /**
   * Télécharge le certificat officiel PDF depuis le backend (iText7).
   * Utilisé pour produire le document conforme DGI.
   */
  downloadPdfRetenue(r: RetenueSource): void {
    this.retenueSourceService.downloadPdf(r.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificat-retenue-${r.numeroRetenue}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => alert('Erreur lors de la génération du PDF. Vérifiez que le backend est démarré.')
    });
  }

  supprimerRetenue(r: RetenueSource): void {
    if (!confirm(`Supprimer la retenue ${r.numeroRetenue} ?`)) return;
    this.retenueSourceService.delete(r.id).subscribe(() => {
      this.retenueSourceService.getAll().subscribe(list => (this.retenues = list));
    });
  }

  getNextNumeroRetenue(): string {
    return this.retenueSourceService.getNextNumero();
  }
}
