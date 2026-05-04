import {inject, Injectable} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {RouterStateSnapshot, TitleStrategy} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);
  private currentTitleKey?: string;

  constructor() {
    super();
    // Re-d├®clencher la mise ├á jour du titre quand la langue change
    this.translate.onLangChange.subscribe(() => {
      if (this.currentTitleKey) {
        this.updateBrowserTitle(this.currentTitleKey);
      }
    });
  }

  override updateTitle(routerState: RouterStateSnapshot): void {
    const titleKey = this.buildTitle(routerState);
    this.currentTitleKey = titleKey;

    if (titleKey) {
      this.updateBrowserTitle(titleKey);
    } else {
      this.title.setTitle('Feewi - Gestion ├ëtablissements Scolaires');
    }
  }

  private updateBrowserTitle(key: string): void {
    this.translate.get(key).subscribe(translatedTitle => {
      this.title.setTitle(`Feewi | ${translatedTitle}`);
    });
  }
}
