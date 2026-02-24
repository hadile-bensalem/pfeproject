import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-facture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facture.component.html',
  styleUrl: './facture.component.css'
})
export class FactureComponent {
  title = 'Facture';
  subtitle = 'Gestion des factures';
}
