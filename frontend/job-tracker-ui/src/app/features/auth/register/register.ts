import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // 'register' collects email/password; 'confirm' appears once Cognito
  // has emailed a verification code for the new account.
  protected readonly step = signal<'register' | 'confirm'>('register');

  protected readonly registerForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly confirmForm = this.fb.nonNullable.group({
    code: ['', Validators.required],
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected async onRegister(): Promise<void> {
    if (this.registerForm.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    const { email, password } = this.registerForm.getRawValue();

    try {
      await this.authService.register(email, password);
      this.step.set('confirm');
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  protected async onConfirm(): Promise<void> {
    if (this.confirmForm.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    const { email } = this.registerForm.getRawValue();
    const { code } = this.confirmForm.getRawValue();

    try {
      const isConfirmed = await this.authService.confirmRegistration(email, code);
      if (isConfirmed) {
        // Add an alert here to inform the user that their account has been successfully confirmed
        alert('Account Created Successfully! You can now log in with your credentials.');
        await this.router.navigateByUrl('/login');
      }
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
