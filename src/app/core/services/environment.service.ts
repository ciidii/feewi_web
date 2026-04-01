import {Inject, Injectable} from '@angular/core';
import {Environment, ENVIRONMENT_CONFIG} from '../../../environments/environment.interface';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  constructor(
    @Inject(ENVIRONMENT_CONFIG) private readonly _config: Environment
  ) {
  }

  get config(): Environment {
    return this._config;
  }

  isProduction(): boolean {
    return this._config.production;
  }

  isDevelopment(): boolean {
    return !this._config.production;
  }

  getApiUrl(): string {
    const {apiUrl, apiVersion} = this._config;
    // Si apiUrl est vide, on utilise une URL relative (utile pour le proxy de dev)
    return apiUrl ? `${apiUrl}/${apiVersion}` : `/${apiVersion}`;
  }

  getServiceUrl(service: keyof Environment['services']): string {
    const servicePath = this._config.services[service];
    const {apiUrl} = this._config;

    // Si le chemin du service commence par /, on vérifie s'il faut préfixer par l'apiUrl
    if (servicePath.startsWith('/')) {
      return apiUrl ? `${apiUrl}${servicePath}` : servicePath;
    }

    return `${this.getApiUrl()}/${servicePath}`;
  }

  isFeatureEnabled(feature: keyof Environment['features']): boolean {
    return this._config.features[feature];
  }

  getLogLevel(): Environment['logLevel'] {
    return this._config.logLevel;
  }
}
