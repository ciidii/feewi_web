import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  Building2,
  Camera,
  CheckCircle,
  Facebook,
  Globe,
  Info,
  Instagram,
  Linkedin,
  ListChecks,
  LucideAngularModule,
  Mail,
  MessageCircle,
  Palette,
  Phone,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Type,
  Users,
  ExternalLink,
  Youtube
} from 'lucide-angular';
import {SchoolService} from '../../../../core/services/school.service';
import {NotificationService} from '../../../../shared/services/notification.service';
import {School} from '../../../../core/models/school.model';
import {FwPageShellComponent} from '../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../shared/components/button/button.component';
import {ImageUploadFieldComponent} from '../../../../shared/components/image-upload-field/image-upload-field.component';
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
    FwButtonComponent,
    ImageUploadFieldComponent
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
  readonly Palette = Palette;
  readonly Users = Users;
  readonly Sparkles = Sparkles;
  readonly ListChecks = ListChecks;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly Facebook = Facebook;
  readonly Instagram = Instagram;
  readonly Linkedin = Linkedin;
  readonly Youtube = Youtube;
  readonly MessageCircle = MessageCircle;

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
    coverUrl: [{value: '', disabled: !this.canUpdate()}],
    streetAddress: [{value: '', disabled: !this.canUpdate()}],
    city: [{value: '', disabled: !this.canUpdate()}],
    country: [{value: 'Sénégal', disabled: !this.canUpdate()}],
    description: [{value: '', disabled: !this.canUpdate()}],
    secondaryColor: [{value: '#0f172a', disabled: !this.canUpdate()}],
    accentColor: [{value: '#2563eb', disabled: !this.canUpdate()}],
    foundedYear: [{value: null, disabled: !this.canUpdate()}],
    studentCount: [{value: null, disabled: !this.canUpdate()}],
    values: this.fb.array([]),
    stats: this.fb.array([]),
    socialLinks: this.fb.group({
      facebook: [{value: '', disabled: !this.canUpdate()}],
      instagram: [{value: '', disabled: !this.canUpdate()}],
      linkedin: [{value: '', disabled: !this.canUpdate()}],
      youtube: [{value: '', disabled: !this.canUpdate()}],
      whatsapp: [{value: '', disabled: !this.canUpdate()}],
    })
  });

  get valuesArray(): FormArray {
    return this.schoolForm.get('values') as FormArray;
  }

  get statsArray(): FormArray {
    return this.schoolForm.get('stats') as FormArray;
  }

  ngOnInit() {
    this.loadSchoolData();
  }

  async loadSchoolData() {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.schoolService.getMySchool());
      this.school.set(data);
      this.schoolForm.patchValue(data);

      this.valuesArray.clear();
      (data.values ?? []).forEach(v => this.addValue(v));

      this.statsArray.clear();
      (data.stats ?? []).forEach(s => this.addStat(s.label, s.value));
    } catch (err) {
      // Erreur gérée par le service (Notification auto)
    } finally {
      this.isLoading.set(false);
    }
  }

  addValue(value = '') {
    this.valuesArray.push(this.fb.control({value, disabled: !this.canUpdate()}));
  }

  removeValue(index: number) {
    this.valuesArray.removeAt(index);
  }

  addStat(label = '', value = '') {
    this.statsArray.push(this.fb.group({
      label: [{value: label, disabled: !this.canUpdate()}],
      value: [{value, disabled: !this.canUpdate()}],
    }));
  }

  removeStat(index: number) {
    this.statsArray.removeAt(index);
  }

  onLogoUploaded(url: string) {
    this.schoolForm.get('logoUrl')?.setValue(url);
  }

  onCoverUploaded(url: string) {
    this.schoolForm.get('coverUrl')?.setValue(url);
  }

  async onSave() {
    if (this.schoolForm.invalid) {
      this.schoolForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    try {
      const updated = await firstValueFrom(this.schoolService.updateMySchool(this.schoolForm.getRawValue()));
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
