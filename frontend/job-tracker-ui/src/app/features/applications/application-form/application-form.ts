import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApplicationsService } from '../../../core/services/applications.service';

@Component({
  selector: 'app-application-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
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
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    company: ['', Validators.required],
    position: ['', Validators.required],
    jobDescription: ['', Validators.required],
    appliedDate: [this.today(), Validators.required],
    notes: [''],
  });

  protected readonly submitting = signal(false);

  protected onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);

    this.applicationsService.createApplication(this.form.getRawValue()).subscribe({
      next: (created) => {
        this.router.navigate(['/applications', created.applicationId]);
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
