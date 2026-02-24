import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.css'
})
export class ArticlesComponent {
  // Liste simplifiée des articles (peut être reliée plus tard au backend)
  articles = [
    {
      id: 1,
      name: 'Aliment démarrage poulet',
      description: 'Formule optimisée pour la phase de démarrage, riche en protéines et vitamines.',
      category: 'Alimentation',
      price: 65,
      unit: 'sac 25 kg',
      imageUrl: 'assets/images/products/aliment-demarrage.jpg'
    },
    {
      id: 2,
      name: 'Aliment croissance',
      description: 'Équilibre parfait entre croissance rapide et santé du cheptel.',
      category: 'Alimentation',
      price: 60,
      unit: 'sac 25 kg',
      imageUrl: 'assets/images/products/aliment-croissance.jpg'
    },
    {
      id: 3,
      name: 'Litière copeaux de bois',
      description: 'Litière absorbante de haute qualité pour un environnement propre et sain.',
      category: 'Matériel',
      price: 18,
      unit: 'ballot',
      imageUrl: 'assets/images/products/litiere-copeaux.jpg'
    },
    {
      id: 4,
      name: 'Kit désinfection bâtiment',
      description: 'Pack complet de désinfectants homologués pour la biosécurité.',
      category: 'Hygiène',
      price: 120,
      unit: 'kit',
      imageUrl: 'assets/images/products/kit-desinfection.jpg'
    }
  ];

  showModal = false;
  articleForm: FormGroup;

  units = ['Pièce', 'Kg', 'Litre', 'Boîte'];
  families = ['Aliments', 'Matériel', 'Hygiène', 'Divers'];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.articleForm = this.fb.group({
      // Section principale
      designation: ['', [Validators.required, Validators.minLength(3)]],
      codeArticle: ['', Validators.required],
      unite: ['', Validators.required],
      famille: ['', Validators.required],
      origine: [''],
      // Section pricing et marges
      pvScraf: [0, [Validators.required, Validators.min(0)]],
      margeBenef: [0, [Validators.min(0)]],
      tva: [false],
      consoInterne: [0, [Validators.min(0)]],
      pcPublic: [0, [Validators.min(0)]],
      // Section complémentaire
      smMassad: [0, [Validators.min(0)]],
      qiMesdale: [0, [Validators.min(0)]],
      tauxConsommation: [0, [Validators.min(0), Validators.max(100)]],
      special: [false]
    });
  }

  navigateHome(): void {
    this.router.navigate(['/home']);
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.showModal) {
      this.closeModal();
    }
  }

  onAjouter(): void {
    if (this.articleForm.invalid) {
      this.articleForm.markAllAsTouched();
      return;
    }
    const value = this.articleForm.value;
    const nextId = this.articles.length ? Math.max(...this.articles.map(a => a.id)) + 1 : 1;
    this.articles = [
      ...this.articles,
      {
        id: nextId,
        name: value.designation,
        description: value.designation,
        category: value.famille,
        price: value.pvScraf,
        unit: value.unite,
        imageUrl: 'assets/images/products/default-article.jpg'
      }
    ];
    this.articleForm.reset({
      pvScraf: 0,
      margeBenef: 0,
      tva: false,
      consoInterne: 0,
      pcPublic: 0,
      smMassad: 0,
      qiMesdale: 0,
      tauxConsommation: 0,
      special: false
    });
  }

  onEnregistrer(): void {
    // Placeholder pour une future logique de sauvegarde (API)
    if (this.articleForm.invalid) {
      this.articleForm.markAllAsTouched();
      return;
    }
    this.closeModal();
  }

  onSupprimer(): void {
    this.articleForm.reset({
      pvScraf: 0,
      margeBenef: 0,
      tva: false,
      consoInterne: 0,
      pcPublic: 0,
      smMassad: 0,
      qiMesdale: 0,
      tauxConsommation: 0,
      special: false
    });
  }

  onPremier(): void {
    if (this.articles.length) {
      const first = this.articles[0];
      this.articleForm.patchValue({
        designation: first.name,
        codeArticle: `ART-${first.id}`,
        unite: first.unit,
        famille: first.category,
        origine: '',
        pvScraf: first.price,
        margeBenef: 0,
        tva: false,
        consoInterne: 0,
        pcPublic: first.price,
        smMassad: 0,
        qiMesdale: 0,
        tauxConsommation: 0,
        special: false
      });
      this.showModal = true;
    }
  }
}

