import {inject, Injectable} from '@angular/core';
import {delay, map, Observable, of} from 'rxjs';
import {SchoolBranding, ExamResult, GalleryAlbum, PricingPlan, CampusAmenity} from '../models/showcase';
import {SchoolService} from './school.service';
import {
  MOCK_EXAM_RESULTS,
  MOCK_GALLERY_ALBUMS,
  MOCK_PRICING_PLANS,
  MOCK_CAMPUS_AMENITIES,
} from './mocks/showcase-mock-data';

const MOCK_LATENCY_MS = 300;

/**
 * Contenu vitrine de l'école (branding étendu, résultats d'examens, galerie, tarifs).
 * `getBranding()` est branché sur le vrai backend (identity-service) ; les autres
 * méthodes restent mockées en attendant un backend dédié — l'interface
 * Observable-based reste inchangée quand elles seront remplacées par de vrais appels HttpClient.
 */
@Injectable({
  providedIn: 'root',
})
export class ShowcaseContentService {
  private schoolService = inject(SchoolService);

  getBranding(tenantId: string): Observable<SchoolBranding> {
    return this.schoolService.getPublicSchoolInfo(tenantId).pipe(
      map(school => ({
        coverUrl: school.coverUrl,
        description: school.description,
        secondaryColor: school.secondaryColor,
        accentColor: school.accentColor,
        foundedYear: school.foundedYear,
        studentCount: school.studentCount,
        values: school.values,
        stats: school.stats,
        socialLinks: school.socialLinks,
      }))
    );
  }

  getExamResults(tenantId: string): Observable<ExamResult[]> {
    return of(MOCK_EXAM_RESULTS).pipe(delay(MOCK_LATENCY_MS));
  }

  getGalleryAlbums(tenantId: string): Observable<GalleryAlbum[]> {
    return of(MOCK_GALLERY_ALBUMS).pipe(delay(MOCK_LATENCY_MS));
  }

  getPricingPlans(tenantId: string): Observable<PricingPlan[]> {
    return of(MOCK_PRICING_PLANS).pipe(delay(MOCK_LATENCY_MS));
  }

  getCampusAmenities(tenantId: string): Observable<CampusAmenity[]> {
    return of(MOCK_CAMPUS_AMENITIES).pipe(delay(MOCK_LATENCY_MS));
  }
}
