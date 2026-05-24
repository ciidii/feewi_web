import {Directive, effect, inject, input, TemplateRef, ViewContainerRef} from '@angular/core';
import {AuthService} from '../../core/services/auth.service';

/**
 * Directive structurelle pour masquer/afficher des éléments selon les permissions de l'utilisateur.
 * Usage: *fwHasPermission="'identity:user:write'"
 * Usage: *fwHasPermission="['identity:user:read', 'identity:role:read']"
 */
@Directive({
  selector: '[fwHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  // Input accepte une string ou un tableau de strings
  permissions = input.required<string | string[]>({ alias: 'fwHasPermission' });
  
  // Opérateur logique pour les tableaux : 'ALL' (toutes) ou 'ANY' (au moins une)
  op = input<'ALL' | 'ANY'>('ALL', { alias: 'fwHasPermissionOp' });

  constructor() {
    effect(() => {
      const required = this.permissions();
      const operator = this.op();
      const user = this.authService.currentUser();
      
      let hasAccess = false;

      if (user) {
        if (Array.isArray(required)) {
          hasAccess = operator === 'ANY' 
            ? required.some(p => this.authService.hasPermission(p))
            : this.authService.hasAllPermissions(required);
        } else {
          hasAccess = this.authService.hasPermission(required);
        }
      }

      this.updateView(hasAccess);
    });
  }

  private updateView(hasAccess: boolean) {
    this.viewContainer.clear();
    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
