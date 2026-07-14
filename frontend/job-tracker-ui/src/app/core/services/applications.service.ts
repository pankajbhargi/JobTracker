import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Application } from '../models/application.model';

// Static sample data standing in for the real API (Phase 3). Every method
// below returns an Observable, matching what HttpClient.get<T>() returns,
// so swapping the body from `of(...)` to a real `this.http.get(...)` call
// later won't require touching any component that consumes this service.
const MOCK_APPLICATIONS: Application[] = [
  {
    applicationId: '1',
    userId: 'mock-user',
    company: 'Acme Corp',
    position: 'Senior Software Engineer',
    jobDescription: 'Responsible for designing and implementing software solutions.',
    status: 'interviewing',
    appliedDate: '2026-06-20',
    followUpDate: '2026-07-18',
    notes: 'Onsite loop scheduled for next week.',
  },
  {
    applicationId: '2',
    userId: 'mock-user',
    company: 'Globex',
    position: 'Cloud Platform Engineer',
    jobDescription: 'Responsible for managing and maintaining cloud infrastructure.',
    status: 'applied',
    appliedDate: '2026-07-01',
  },
  {
    applicationId: '3',
    userId: 'mock-user',
    company: 'Initech',
    position: 'Full Stack Developer',
    jobDescription: 'Responsible for developing and maintaining web applications.',
    status: 'offer',
    appliedDate: '2026-06-05',
    notes: 'Offer received, negotiating start date.',
  },
  {
    applicationId: '4',
    userId: 'mock-user',
    company: 'Umbrella Inc',
    position: 'Backend Engineer',
    jobDescription: 'Responsible for designing and implementing backend solutions.',
    status: 'rejected',
    appliedDate: '2026-05-15',
  },
  {
    applicationId: '5',
    userId: 'mock-user',
    company: 'Hooli',
    position: 'DevOps Engineer',
    jobDescription: 'Responsible for managing and maintaining DevOps processes.',
    status: 'applied',
    appliedDate: '2026-07-10',
  },
];

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  getApplications(): Observable<Application[]> {
    return of(MOCK_APPLICATIONS);
  }

  getApplication(applicationId: string): Observable<Application | undefined> {
    return of(MOCK_APPLICATIONS.find((app) => app.applicationId === applicationId));
  }
}
