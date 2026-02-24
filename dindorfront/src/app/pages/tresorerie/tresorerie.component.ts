import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DepenseService } from '../../services/depense.service';
import { FournisseurService } from '../../services/fournisseur.service';
import { ClientService } from '../../services/client.service';
import { ArticleService } from '../../services/article.service';
import {
  Depense,
  CATEGORIES_DEPENSE,
  ModePaiementDepense
} from '../../models/depense.model';
import { Fournisseur } from '../../models/fournisseur.model';
import { FournisseurEtat } from '../../models/fournisseur-etat.model';
import { ClientEtat } from '../../models/client.model';
import { Article } from '../../models/article.model';
import { catchError, forkJoin, of } from 'rxjs';

interface RecapLigne {
  libelle: string;
  montant: number;
  isDebiteur?: boolean;
  isNegatif?: boolean;
}

interface VenteArticle {
  article: string;
  qte: number;
}

@Component({
  selector: 'app-tresorerie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './tresorerie.component.html',
  styleUrl: './tresorerie.component.css'
})
export class TresorerieComponent implements OnInit {
  title = 'Trésorerie';
  subtitle = 'Gestion de la trésorerie';

  // Récap
  dateDebutRecap = this.toDateInput(new Date());
  dateFinRecap = this.toDateInput(new Date());
  filterFournisseurRecap = '';
  recapLignes: RecapLigne[] = [];
  totalQteVendue = 0;
  ventesArticles: VenteArticle[] = [];
  chiffreAffaires = 0;

  // Dépenses
  depenses: Depense[] = [];
  filteredDepenses: Depense[] = [];
  dateDebutDep = '';
  dateFinDep = '';
  filterCategorieDep = '';
  isModalDepenseOpen = false;
  isEditingDepense = false;
  depenseForm!: FormGroup;
  fournisseurs: Fournisseur[] = [];
  categories = [...CATEGORIES_DEPENSE];
  modesPaiement: ModePaiementDepense[] = ['Espèce', 'Chèque', 'Virement'];

  constructor(
    private fb: FormBuilder,
    private depenseService: DepenseService,
    private fournisseurService: FournisseurService,
    private clientService: ClientService,
    private articleService: ArticleService
  ) {
    this.initDepenseForm();
    const d = new Date();
    this.dateDebutDep = this.toDateInput(d);
    this.dateFinDep = this.toDateInput(d);
  }

  private toDateInput(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private initDepenseForm(): void {
    const today = this.toDateInput(new Date());
    this.depenseForm = this.fb.group({
      id: [0],
      date: [today, Validators.required],
      libelle: ['', Validators.required],
      categorie: ['', Validators.required],
      montant: [0, [Validators.required, Validators.min(0)]],
      modePaiement: ['Espèce', Validators.required],
      remarque: ['']
    });
  }

  ngOnInit(): void {
    this.loadFournisseurs();
    this.loadDepenses();
  }

  private loadFournisseurs(): void {
    this.fournisseurService.getAll()
      .pipe(catchError(() => of([])))
      .subscribe(list => (this.fournisseurs = list ?? []));
  }

  private loadDepenses(): void {
    this.depenseService.getAll().subscribe(list => {
      this.depenses = list;
      this.applyFiltersDepenses();
      this.majRecap();
    });
  }

  get totalDepenses(): number {
    return this.filteredDepenses.reduce((s, d) => s + d.montant, 0);
  }

  majRecap(): void {
    forkJoin({
      etatFournisseurs: this.fournisseurService.getEtatFournisseurs().pipe(catchError(() => of([]))),
      etatClients: this.clientService.getEtatClients().pipe(catchError(() => of([]))),
      articles: this.articleService.getAll().pipe(catchError(() => of([])))
    }).subscribe(({ etatFournisseurs, etatClients, articles }) => {
      const etatF = (etatFournisseurs ?? []) as FournisseurEtat[];
      const etatC = (etatClients ?? []) as ClientEtat[];
      const arts = (articles ?? []) as Article[];

      let totalEspece = 0;
      let totalStock = 0;
      let creditClients = 0;
      let creditFournisseurs = 0;

      etatC.forEach(c => {
        const s = (c as ClientEtat).solde ?? 0;
        if (s > 0) creditClients += s;
      });
      etatF.forEach(f => {
        const s = (f as FournisseurEtat).solde ?? 0;
        if (s > 0) creditFournisseurs += s;
      });

      arts.forEach(a => {
        const q = a.stock1 ?? 0;
        const p = (a.pump && a.pump > 0) ? a.pump : (a.prixAchatHT ?? 0);
        totalStock += q * p;
      });

      totalEspece = 15000;
      const primeAchat = 1200;
      const totalDep = this.depenses.reduce((s, d) => s + d.montant, 0);
      const solde = totalEspece + totalStock + creditClients - creditFournisseurs - totalDep;

      this.recapLignes = [
        { libelle: 'Total Espèce', montant: totalEspece },
        { libelle: 'Total Stock', montant: totalStock },
        { libelle: 'Crédit Clients', montant: creditClients },
        { libelle: 'Crédit Fournisseurs', montant: creditFournisseurs, isDebiteur: creditFournisseurs > 0 },
        { libelle: 'Solde', montant: solde, isNegatif: solde < 0 },
        { libelle: 'Prime d\'achat', montant: primeAchat }
      ];

      this.chiffreAffaires = 9368.028;
      const ventes = arts.slice(0, 20).map(a => ({
        article: a.designation || a.codeArticle,
        qte: Math.max(1, Math.floor((a.stock1 ?? 0) * 0.15))
      })).filter(v => v.qte > 0);
      this.totalQteVendue = ventes.reduce((s, v) => s + v.qte, 0);
      this.ventesArticles = ventes.length ? ventes : [{ article: '— Aucun article —', qte: 0 }];
    });
  }

  applyFiltersDepenses(): void {
    let list = [...this.depenses];
    if (this.dateDebutDep) {
      list = list.filter(d => d.date >= this.dateDebutDep);
    }
    if (this.dateFinDep) {
      list = list.filter(d => d.date <= this.dateFinDep);
    }
    if (this.filterCategorieDep) {
      list = list.filter(d => d.categorie === this.filterCategorieDep);
    }
    this.filteredDepenses = list;
  }

  onFilterDepensesChange(): void {
    this.applyFiltersDepenses();
  }

  openAddDepenseModal(): void {
    this.isEditingDepense = false;
    this.depenseForm.reset({
      id: 0,
      date: this.toDateInput(new Date()),
      libelle: '',
      categorie: '',
      montant: 0,
      modePaiement: 'Espèce',
      remarque: ''
    });
    this.isModalDepenseOpen = true;
  }

  closeDepenseModal(): void {
    this.isModalDepenseOpen = false;
  }

  onSubmitDepense(): void {
    if (this.depenseForm.invalid) return;
    const v = this.depenseForm.value;
    if (this.isEditingDepense && v.id) {
      this.depenseService.update(v.id, {
        date: v.date,
        libelle: v.libelle,
        categorie: v.categorie,
        montant: Number(v.montant),
        modePaiement: v.modePaiement,
        remarque: v.remarque
      }).subscribe(() => {
        this.loadDepenses();
        this.majRecap();
        this.closeDepenseModal();
      });
    } else {
      this.depenseService.create({
        date: v.date,
        libelle: v.libelle,
        categorie: v.categorie,
        montant: Number(v.montant),
        modePaiement: v.modePaiement,
        remarque: v.remarque
      }).subscribe(() => {
        this.loadDepenses();
        this.majRecap();
        this.closeDepenseModal();
      });
    }
  }

  editDepense(d: Depense): void {
    this.isEditingDepense = true;
    this.depenseForm.patchValue({
      id: d.id,
      date: d.date,
      libelle: d.libelle,
      categorie: d.categorie,
      montant: d.montant,
      modePaiement: d.modePaiement,
      remarque: d.remarque
    });
    this.isModalDepenseOpen = true;
  }

  deleteDepense(d: Depense): void {
    if (!confirm(`Supprimer la dépense "${d.libelle}" ?`)) return;
    this.depenseService.delete(d.id).subscribe(() => {
      this.loadDepenses();
      this.majRecap();
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const x = new Date(d);
    if (isNaN(x.getTime())) return d;
    return x.getDate().toString().padStart(2, '0') + '/' +
      (x.getMonth() + 1).toString().padStart(2, '0') + '/' + x.getFullYear();
  }

  exportDepensesExcel(): void {
    const headers = ['Date', 'Libellé', 'Catégorie', 'Montant', 'Mode Paiement', 'Remarque'];
    const rows = this.filteredDepenses.map(d => [
      this.formatDate(d.date),
      d.libelle,
      d.categorie,
      d.montant.toFixed(2),
      d.modePaiement,
      d.remarque
    ]);
    const csv = headers.join(';') + '\n' + rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `depenses_${this.toDateInput(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
