
import { Injectable } from '@angular/core';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  get config() {
    return environment;
  }

  isProduction(): boolean {
    return environment.production;
  }

  isDevelopment(): boolean {
    return !environment.production;
  }

  getApiUrl(): string {
    return `${environment.apiUrl}/${environment.apiVersion}`;
  }

  isFeatureEnabled(feature: keyof typeof environment.features): boolean {
    return environment.features[feature];
  }
}
