import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vente.component.html',
  styleUrl: './vente.component.css'
})
export class VenteComponent {
  title = 'Vente';
  subtitle = 'Gestion des ventes';
}
