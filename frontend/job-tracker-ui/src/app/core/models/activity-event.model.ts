export type ActivityEventType =
  | 'created'
  | 'status_changed'
  | 'note_added'
  | 'resume_uploaded'
  | 'follow_up_reminder';

export interface ActivityEvent {
  eventId: string;
  userId: string;
  applicationId: string;
  type: ActivityEventType;
  timestamp: string;
  details?: string;
}
