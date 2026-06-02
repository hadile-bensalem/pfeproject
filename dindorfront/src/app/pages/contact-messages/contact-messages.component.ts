import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ContactMessage {
  id:          number;
  nom:         string;
  email:       string;
  message:     string;
  lu:          boolean;
  dateEnvoi:   string;
}

@Component({
  selector: 'app-contact-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-messages.component.html',
  styleUrl: './contact-messages.component.css'
})
export class ContactMessagesComponent implements OnInit {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/contact-messages`;

  messages:         ContactMessage[] = [];
  filteredMessages: ContactMessage[] = [];
  searchTerm        = '';
  isLoading         = true;
  selected:         ContactMessage | null = null;

  get nonLus(): number {
    return this.messages.filter(m => !m.lu).length;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.http.get<any>(this.base).subscribe({
      next: r => { this.messages = r.data ?? []; this.applyFilter(); this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredMessages = term
      ? this.messages.filter(m =>
          m.nom.toLowerCase().includes(term) ||
          m.email.toLowerCase().includes(term) ||
          m.message.toLowerCase().includes(term))
      : [...this.messages];
  }

  open(msg: ContactMessage): void {
    this.selected = msg;
    if (!msg.lu) {
      this.http.patch<any>(`${this.base}/${msg.id}/lu`, {}).subscribe({
        next: () => { msg.lu = true; }
      });
    }
  }

  close(): void {
    this.selected = null;
  }

  supprimer(msg: ContactMessage, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Supprimer le message de ${msg.nom} ?`)) return;
    this.http.delete<any>(`${this.base}/${msg.id}`).subscribe({
      next: () => {
        this.messages = this.messages.filter(m => m.id !== msg.id);
        this.applyFilter();
        if (this.selected?.id === msg.id) this.selected = null;
      }
    });
  }

  repondre(email: string): void {
    window.open(`mailto:${email}`, '_blank');
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleString('fr-TN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
