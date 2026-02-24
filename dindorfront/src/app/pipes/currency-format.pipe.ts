import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals: number = 2, suffix: string = ' DT'): string {
    if (value == null || isNaN(value)) return '—';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value) + suffix;
  }
}
