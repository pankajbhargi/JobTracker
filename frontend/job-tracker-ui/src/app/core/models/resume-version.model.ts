export type ResumeSource = 'manual' | 'ai_generated';

export interface ResumeVersion {
  resumeVersionId: string;
  userId: string;
  fileName: string;
  resumeKey: string;
  uploadedAt: string;
  source: ResumeSource;
  label?: string;
  changeNotes?: string;
  isDefault: boolean;
}
