import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../core/services/auth.service';
import { ResumesService } from '../../core/services/resumes.service';
import { ResumeSource } from '../../core/models/resume-version.model';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatChipsModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly authService = inject(AuthService);
  private readonly resumesService = inject(ResumesService);
  private readonly fb = inject(FormBuilder);

  protected readonly currentUser = this.authService.currentUser;

  // --- Name editing ---
  protected readonly editingName = signal(false);
  protected readonly savingName = signal(false);
  protected readonly nameForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  protected startEditingName(): void {
    this.nameForm.setValue({ name: this.currentUser()?.name ?? '' });
    this.editingName.set(true);
  }

  protected onSaveName(): void {
    if (this.nameForm.invalid || this.savingName()) {
      return;
    }
    this.savingName.set(true);
    this.authService
      .updateName(this.nameForm.getRawValue().name)
      .then(() => {
        this.editingName.set(false);
      })
      .finally(() => {
        this.savingName.set(false);
      });
  }

  // --- Resume library ---
  protected readonly resumeVersions = toSignal(this.resumesService.getResumeVersions(), {
    initialValue: [],
  });

  protected readonly showUploadForm = signal(false);
  protected readonly uploading = signal(false);
  private selectedFile: File | null = null;

  protected readonly uploadForm = this.fb.nonNullable.group({
    label: [''],
    source: ['manual' as ResumeSource, Validators.required],
    changeNotes: [''],
  });

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  protected onUpload(): void {
    if (!this.selectedFile || this.uploadForm.invalid || this.uploading()) {
      return;
    }

    this.uploading.set(true);
    const { label, source, changeNotes } = this.uploadForm.getRawValue();

    this.resumesService
      .uploadResume({
        file: this.selectedFile,
        source,
        label: label || undefined,
        changeNotes: changeNotes || undefined,
      })
      .subscribe({
        next: () => {
          this.uploading.set(false);
          this.showUploadForm.set(false);
          this.uploadForm.reset({ label: '', source: 'manual', changeNotes: '' });
          this.selectedFile = null;
        },
        error: () => {
          this.uploading.set(false);
        },
      });
  }

  protected setDefault(resumeVersionId: string): void {
    this.resumesService.setDefault(resumeVersionId).subscribe();
  }

  protected deleteVersion(resumeVersionId: string): void {
    this.resumesService.deleteResumeVersion(resumeVersionId).subscribe();
  }
}
