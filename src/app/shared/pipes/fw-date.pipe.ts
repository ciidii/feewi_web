import { Pipe, PipeTransform, LOCALE_ID, inject } from '@angular/core';
import { formatDate } from '@angular/common';

/**
 * Pipe de formatage de date standardisé pour Feewi (Impératif 10)
 * Garantit une cohérence absolue à travers toute l'application.
 */
@Pipe({
  name: 'fwDate',
  standalone: true
})
export class FwDatePipe implements PipeTransform {
  private locale = inject(LOCALE_ID);

  transform(value: any, format: 'short' | 'full' | 'dateTime' | 'monthYear' = 'short'): string {
    if (!value) return '—';

    // Normalisation en objet Date si c'est une string ISO
    const date = new Date(value);
    if (isNaN(date.getTime())) return '—';

    switch (format) {
      case 'full':
        return formatDate(date, 'd MMMM yyyy', this.locale);
      case 'dateTime':
        return formatDate(date, 'd MMMM yyyy à HH:mm', this.locale);
      case 'monthYear':
        return formatDate(date, 'MMMM yyyy', this.locale);
      case 'short':
      default:
        return formatDate(date, 'dd/MM/yyyy', this.locale);
    }
  }
}
