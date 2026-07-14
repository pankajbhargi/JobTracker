import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { Application, ApplicationStatus } from '../models/application.model';

export interface CreateApplicationInput {
  company: string;
  position: string;
  jobDescription: string;
  appliedDate: string;
  notes?: string;
}

export interface UpdateApplicationInput {
  status: ApplicationStatus;
  jobDescription: string;
  notes: string;
}

// Static sample data standing in for the real API (Phase 3).
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
  // BehaviorSubject holds the current in-memory list and replays its latest
  // value to every new subscriber. That's what keeps the listing page and
  // the create/edit screens in sync within a session, without a real
  // backend to refetch from yet — every method here returns an Observable
  // (the same shape HttpClient returns) so Phase 3 can swap the bodies for
  // real HTTP calls without touching any component.
  private readonly applications$ = new BehaviorSubject<Application[]>(MOCK_APPLICATIONS);

  getApplications(): Observable<Application[]> {
    return this.applications$.asObservable();
  }

  getApplication(applicationId: string): Observable<Application | undefined> {
    return this.applications$.pipe(
      map((apps) => apps.find((app) => app.applicationId === applicationId)),
    );
  }

  createApplication(input: CreateApplicationInput): Observable<Application> {
    const newApplication: Application = {
      ...input,
      applicationId: crypto.randomUUID(),
      userId: 'mock-user',
      status: 'applied',
    };
    this.applications$.next([...this.applications$.value, newApplication]);
    return of(newApplication);
  }

  updateApplication(applicationId: string, changes: UpdateApplicationInput): Observable<Application> {
    const updatedList = this.applications$.value.map((app) =>
      app.applicationId === applicationId ? { ...app, ...changes } : app,
    );
    this.applications$.next(updatedList);

    const updated = updatedList.find((app) => app.applicationId === applicationId);
    if (!updated) {
      throw new Error(`Application ${applicationId} not found`);
    }
    return of(updated);
  }
}
