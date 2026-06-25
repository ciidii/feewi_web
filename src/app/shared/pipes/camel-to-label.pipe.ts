import {Pipe, PipeTransform} from '@angular/core';

/**
 * Transforme une clé camelCase en label lisible.
 * Ex: "criticalAllergies" → "Critical Allergies"
 * Ex: "emergencyContactName" → "Emergency Contact Name"
 */
@Pipe({
  name: 'camelToLabel',
  standalone: true
})
export class CamelToLabelPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim();
  }
}
