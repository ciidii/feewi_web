import {Directive, ElementRef, HostListener, inject, Input} from '@angular/core';
import {MatTooltip} from '@angular/material/tooltip';

@Directive({
  selector: '[fwSmartTooltip]',
  standalone: true,
  hostDirectives: [
    {
      directive: MatTooltip,
      inputs: ['matTooltip: fwSmartTooltip', 'matTooltipPosition: tooltipPosition']
    }
  ]
})
export class SmartTooltipDirective {
  private el = inject(ElementRef);
  private tooltip = inject(MatTooltip);

  @Input() tooltipPosition: 'above' | 'below' | 'left' | 'right' = 'above';

  @HostListener('mouseenter')
  onMouseEnter() {
    const element = this.el.nativeElement;

    // Détection de l'overflow (troncature)
    const isOverflowing = element.scrollWidth > element.offsetWidth;

    if (!isOverflowing) {
      this.tooltip.disabled = true;
    } else {
      this.tooltip.disabled = false;
    }
  }
}
