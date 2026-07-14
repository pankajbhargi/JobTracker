import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationsService } from '../../core/services/applications.service';
import { ApplicationStatus } from '../../core/models/application.model';

interface StatCard {
  label: string;
  value: number;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly applicationsService = inject(ApplicationsService);

  // toSignal subscribes to the Observable once and exposes the latest
  // value as a signal, so the template can read applications() directly
  // instead of using the async pipe. initialValue avoids `undefined`
  // during the first tick before the Observable emits.
  protected readonly applications = toSignal(this.applicationsService.getApplications(), {
    initialValue: [],
  });

  // computed() re-derives stats only when `applications` actually changes,
  // rather than recalculating on every change-detection cycle.
  protected readonly stats = computed<StatCard[]>(() => {
    const apps = this.applications();
    const countByStatus = (status: ApplicationStatus) =>
      apps.filter((app) => app.status === status).length;

    return [
      { label: 'Total Applications', value: apps.length, icon: 'work_outline' },
      { label: 'Applied', value: countByStatus('applied'), icon: 'send' },
      { label: 'Interviewing', value: countByStatus('interviewing'), icon: 'groups' },
      { label: 'Offers', value: countByStatus('offer'), icon: 'celebration' },
    ];
  });
}
