import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApplicationsService } from '../../../core/services/applications.service';
import { ResumesService } from '../../../core/services/resumes.service';

@Component({
  selector: 'app-application-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './application-form.html',
  styleUrl: './application-form.scss',
})
export class ApplicationForm {
  private readonly fb = inject(FormBuilder);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly resumesService = inject(ResumesService);
  private readonly router = inject(Router);

  // BehaviorSubject-backed, emits synchronously on subscribe, so this is
  // already populated by the time the form below reads it for a default.
  protected readonly resumeVersions = toSignal(this.resumesService.getResumeVersions(), {
    initialValue: [],
  });

  protected readonly form = this.fb.nonNullable.group({
    company: ['', Validators.required],
    position: ['', Validators.required],
    jobDescription: ['', Validators.required],
    appliedDate: [this.today(), Validators.required],
    notes: [''],
    resumeVersionId: [this.defaultResumeVersionId()],
  });

  protected readonly submitting = signal(false);

  protected onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    const { resumeVersionId, ...rest } = this.form.getRawValue();

    this.applicationsService
      .createApplication({ ...rest, resumeVersionId: resumeVersionId || undefined })
      .subscribe({
        next: (created) => {
          this.router.navigate(['/applications', created.applicationId]);
        },
        error: () => {
          this.submitting.set(false);
        },
      });
  }

  private defaultResumeVersionId(): string {
    return this.resumeVersions().find((v) => v.isDefault)?.resumeVersionId ?? '';
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
