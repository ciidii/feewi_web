import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  Building2,
  Camera,
  CheckCircle,
  Globe,
  Info,
  LucideAngularModule,
  Mail,
  Phone,
  Save,
  Type,
  ExternalLink
} from 'lucide-angular';
import {SchoolService} from '../../../../core/services/school.service';
import {NotificationService} from '../../../../shared/services/notification.service';
import {School} from '../../../../core/models/school.model';
import {FwPageShellComponent} from '../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../shared/components/button/button.component';
import {firstValueFrom} from 'rxjs';
import {AuthService} from '../../../../core/services/auth.service';
import {HasPermissionDirective} from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-school-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    FwPageShellComponent,
    FwButtonComponent
  ],
  templateUrl: './school-config.component.html',
  styleUrls: ['./school-config.component.scss']
})
export class SchoolConfigComponent implements OnInit {
  private fb = inject(FormBuilder);
  private schoolService = inject(SchoolService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  // Icônes
  readonly Building2 = Building2;
  readonly Type = Type;
  readonly Phone = Phone;
  readonly Mail = Mail;
  readonly Globe = Globe;
  readonly Save = Save;
  readonly Camera = Camera;
  readonly Info = Info;
  readonly ExternalLink = ExternalLink;

  // États
  school = signal<School | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);

  readonly canUpdate = computed(() => this.authService.hasPermission('identity:school:update'));

  schoolForm: FormGroup = this.fb.group({
    name: [{value: '', disabled: !this.canUpdate()}, [Validators.required, Validators.minLength(3)]],
    slogan: [{value: '', disabled: !this.canUpdate()}],
    email: [{value: '', disabled: !this.canUpdate()}, [Validators.required, Validators.email]],
    phone: [{value: '', disabled: !this.canUpdate()}, [Validators.required]],
    logoUrl: [{value: '', disabled: !this.canUpdate()}],
    streetAddress: [{value: '', disabled: !this.canUpdate()}],
    city: [{value: '', disabled: !this.canUpdate()}],
    country: [{value: 'Sénégal', disabled: !this.canUpdate()}]
  });

  ngOnInit() {
    this.loadSchoolData();
  }

  async loadSchoolData() {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.schoolService.getMySchool());
      this.school.set(data);
      this.schoolForm.patchValue(data);
    } catch (err) {
      // Erreur gérée par le service (Notification auto)
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSave() {
    if (this.schoolForm.invalid) {
      this.schoolForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    try {
      const updated = await firstValueFrom(this.schoolService.updateMySchool(this.schoolForm.value));
      this.school.set(updated);
      this.notificationService.success('Paramètres de l\'établissement enregistrés.');
    } catch (err) {
      // Erreur gérée par le service
    } finally {
      this.isSaving.set(false);
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.schoolForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
