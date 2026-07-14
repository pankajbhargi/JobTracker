import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ApplicationsService } from '../../core/services/applications.service';

@Component({
  selector: 'app-applications',
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './applications.html',
  styleUrl: './applications.scss',
})
export class Applications {
  private readonly applicationsService = inject(ApplicationsService);
  private readonly router = inject(Router);

  protected readonly applications = toSignal(this.applicationsService.getApplications(), {
    initialValue: [],
  });

  protected readonly displayedColumns = ['company', 'position', 'status', 'appliedDate'];

  protected openApplication(applicationId: string): void {
    this.router.navigate(['/applications', applicationId]);
  }
}
