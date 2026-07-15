import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {EnvironmentService} from './environment.service';
import {NotificationService} from '../../shared/services/notification.service';

export interface MyChild {
  studentId: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  status: string;
  currentAcademicYearId: string | null;
  currentLevelId: string | null;
  currentClassId: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class GuardianService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private notificationService = inject(NotificationService);

  private readonly API_URL = `${this.envService.getServiceUrl('student')}/guardians/me`;

  private handleError(message: string) {
    return (error: any) => {
      console.error(error);
      this.notificationService.error(error?.error?.message || message);
      return throwError(() => error);
    };
  }

  getMyChildren(): Observable<MyChild[]> {
    return this.http.get<MyChild[]>(`${this.API_URL}/children`).pipe(
      catchError(this.handleError('Impossible de charger la liste de vos enfants'))
    );
  }
}
