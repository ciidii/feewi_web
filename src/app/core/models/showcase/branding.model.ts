import {SchoolBrandingFields, SchoolSocialLinks, SchoolStat} from '../school.model';

export type {SchoolStat, SchoolSocialLinks};

/**
 * Profil de branding étendu de l'école pour la vitrine publique.
 * Sous-ensemble de `PublicSchoolResponse` (core/models/school.model.ts), assemblé
 * par `ShowcaseContentService.getBranding()`.
 */
export type SchoolBranding = SchoolBrandingFields;
