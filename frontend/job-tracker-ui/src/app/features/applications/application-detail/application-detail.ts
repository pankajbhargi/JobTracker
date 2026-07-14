import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApplicationsService } from '../../../core/services/applications.service';
import { ApplicationStatus } from '../../../core/models/application.model';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
];

@Component({
  selector: 'app-application-detail',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './application-detail.html',
  styleUrl: './application-detail.scss',
})
export class ApplicationDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly fb = inject(FormBuilder);

  protected readonly statusOptions = STATUS_OPTIONS;

  private readonly applicationId = this.route.snapshot.paramMap.get('id')!;

  protected readonly application = toSignal(
    this.applicationsService.getApplication(this.applicationId),
  );

  protected readonly editForm = this.fb.nonNullable.group({
    status: ['applied' as ApplicationStatus, Validators.required],
    jobDescription: ['', Validators.required],
    notes: [''],
  });

  protected readonly submitting = signal(false);
  protected readonly saved = signal(false);

  constructor() {
    // effect() re-runs whenever a signal it reads changes. Here it reacts
    // to `application` arriving (or changing elsewhere) and seeds the edit
    // form with the current status/jobDescription.
    effect(() => {
      const app = this.application();
      if (app) {
        this.editForm.setValue({
          status: app.status,
          jobDescription: app.jobDescription,
          notes: app.notes || ''
        });
      }
    });
  }

  protected onSave(): void {
    if (this.editForm.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.saved.set(false);

    this.applicationsService.updateApplication(this.applicationId, this.editForm.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.saved.set(true);
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }
}
