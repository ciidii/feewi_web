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

  constructor() {
    effect(() => {
      const required = this.permissions();
      const user = this.authService.currentUser();
      
      let hasAccess = false;

      if (user) {
        if (Array.isArray(required)) {
          // Si c'est un tableau, on vérifie si l'utilisateur possède TOUTES les permissions par défaut
          // (On pourrait ajouter un paramètre pour changer en "ANY")
          hasAccess = this.authService.hasAllPermissions(required);
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
