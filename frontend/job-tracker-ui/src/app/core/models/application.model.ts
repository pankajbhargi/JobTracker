export type ApplicationStatus =
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  applicationId: string;
  userId: string;
  company: string;
  position: string;
  jobDescription: string;
  status: ApplicationStatus;
  appliedDate: string;
  followUpDate?: string;
  resumeVersionId?: string;
  notes?: string;
}
