import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ResumeSource, ResumeVersion } from '../models/resume-version.model';

export interface UploadResumeInput {
  file: File;
  source: ResumeSource;
  label?: string;
  changeNotes?: string;
}

// Single seed version so the library isn't empty on first load. resumeKey is
// blank here (no real file behind it) — Download is only meaningful for
// versions uploaded during the session, via URL.createObjectURL().
const MOCK_RESUME_VERSIONS: ResumeVersion[] = [
  {
    resumeVersionId: '1',
    userId: 'mock-user',
    fileName: 'resume-base.pdf',
    resumeKey: '',
    uploadedAt: '2026-06-01T09:00:00.000Z',
    source: 'manual',
    label: 'Base resume',
    isDefault: true,
  },
];

@Injectable({ providedIn: 'root' })
export class ResumesService {
  // Same BehaviorSubject-backed mock-store pattern as ApplicationsService:
  // every method returns an Observable so Phase 3 can swap in real
  // HttpClient calls without touching Profile.
  private readonly resumeVersions$ = new BehaviorSubject<ResumeVersion[]>(MOCK_RESUME_VERSIONS);

  getResumeVersions(): Observable<ResumeVersion[]> {
    return this.resumeVersions$.asObservable();
  }

  uploadResume(input: UploadResumeInput): Observable<ResumeVersion> {
    const isFirstVersion = this.resumeVersions$.value.length === 0;

    const newVersion: ResumeVersion = {
      resumeVersionId: crypto.randomUUID(),
      userId: 'mock-user',
      fileName: input.file.name,
      // Blob URL gives a genuinely working Download in this session; it's
      // in-memory only and resets on reload, same limitation as the mock
      // ApplicationsService. Phase 3 replaces this with a real S3 key.
      resumeKey: URL.createObjectURL(input.file),
      uploadedAt: new Date().toISOString(),
      source: input.source,
      label: input.label,
      changeNotes: input.changeNotes,
      isDefault: isFirstVersion,
    };

    this.resumeVersions$.next([...this.resumeVersions$.value, newVersion]);
    return of(newVersion);
  }

  setDefault(resumeVersionId: string): Observable<void> {
    const updated = this.resumeVersions$.value.map((version) => ({
      ...version,
      isDefault: version.resumeVersionId === resumeVersionId,
    }));
    this.resumeVersions$.next(updated);
    return of(undefined);
  }

  deleteResumeVersion(resumeVersionId: string): Observable<void> {
    const target = this.resumeVersions$.value.find((v) => v.resumeVersionId === resumeVersionId);
    let remaining = this.resumeVersions$.value.filter((v) => v.resumeVersionId !== resumeVersionId);

    // If the deleted version was the default, promote the most recently
    // uploaded remaining version so there's always a default when possible.
    if (target?.isDefault && remaining.length > 0) {
      const mostRecent = [...remaining].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
      remaining = remaining.map((v) => ({
        ...v,
        isDefault: v.resumeVersionId === mostRecent.resumeVersionId,
      }));
    }

    this.resumeVersions$.next(remaining);
    return of(undefined);
  }
}
