import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome',
  imports: [CommonModule, RouterLink],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  // Catalogue d'articles (mock) pour la page d'accueil
  articles = [
    {
      id: 1,
      name: 'Aliment démarrage poulet',
      description: 'Formule optimisée pour la phase de démarrage, riche en protéines et vitamines.',
      category: 'Alimentation',
      price: 65,
      unit: 'sac 25 kg',
      isFavorite: true,
      inCart: false,
      imageUrl: 'assets/images/products/aliment-demarrage.jpg'
    },
    {
      id: 2,
      name: 'Aliment croissance',
      description: 'Équilibre parfait entre croissance rapide et santé du cheptel.',
      category: 'Alimentation',
      price: 60,
      unit: 'sac 25 kg',
      isFavorite: false,
      inCart: false,
      imageUrl: 'assets/images/products/aliment-croissance.jpg'
    },
    {
      id: 3,
      name: 'Litière copeaux de bois',
      description: 'Litière absorbante de haute qualité pour un environnement propre et sain.',
      category: 'Matériel',
      price: 18,
      unit: 'ballot',
      isFavorite: false,
      inCart: false,
      imageUrl: 'assets/images/products/litiere-copeaux.jpg'
    },
    {
      id: 4,
      name: 'Kit désinfection bâtiment',
      description: 'Pack complet de désinfectants homologués pour la biosécurité.',
      category: 'Hygiène',
      price: 120,
      unit: 'kit',
      isFavorite: false,
      inCart: false,
      imageUrl: 'assets/images/products/kit-desinfection.jpg'
    }
  ];

  selectedArticle: any | null = null;

  constructor(private router: Router) {}

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToSignin(): void {
    this.router.navigate(['/signin']);
  }

  toggleFavorite(article: any): void {
    article.isFavorite = !article.isFavorite;
  }

  toggleCart(article: any): void {
    article.inCart = !article.inCart;
  }

  openArticleDetails(article: any): void {
    this.selectedArticle = article;
  }

  closeArticleDetails(): void {
    this.selectedArticle = null;
  }
}
