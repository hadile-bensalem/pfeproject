import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class QrCodeService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/clients`;

  /**
   * Retourne un Blob PNG du QR code du client.
   * Le QR encode l'URL d'accès direct au portail client.
   */
  getQrCodeBlob(clientId: number): Observable<Blob> {
    return this.http.get(
      `${this.base}/${clientId}/qrcode?frontUrl=${window.location.origin}`,
      { responseType: 'blob' }
    );
  }

  /** Convertit le Blob en Data URL (base64) pour l'afficher dans un <img>. */
  blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /** Déclenche le téléchargement du QR code en PNG. */
  downloadQr(blob: Blob, clientNom: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `qr-${clientNom.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
