import { TestBed } from '@angular/core/testing';
import { vi, type Mock } from 'vitest';
import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { AuthService } from './auth.service';

vi.mock('aws-amplify/auth', () => ({
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  fetchAuthSession: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('starts with no current user', () => {
    expect(service.currentUser()).toBeNull();
  });

  describe('register', () => {
    it('calls signUp with the email as username', async () => {
      (signUp as Mock).mockResolvedValue({ nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } });

      await service.register('jane@example.com', 'Password1');

      expect(signUp).toHaveBeenCalledWith({
        username: 'jane@example.com',
        password: 'Password1',
        options: { userAttributes: { email: 'jane@example.com' } },
      });
    });
  });

  describe('confirmRegistration', () => {
    it('calls confirmSignUp with the code', async () => {
      (confirmSignUp as Mock).mockResolvedValue({});

      await service.confirmRegistration('jane@example.com', '123456');

      expect(confirmSignUp).toHaveBeenCalledWith({
        username: 'jane@example.com',
        confirmationCode: '123456',
      });
    });
  });

  describe('login', () => {
    it('signs in and populates currentUser', async () => {
      (signIn as Mock).mockResolvedValue({ isSignedIn: true });
      (getCurrentUser as Mock).mockResolvedValue({ username: 'jane@example.com' });

      await service.login('jane@example.com', 'Password1');

      expect(signIn).toHaveBeenCalledWith({
        username: 'jane@example.com',
        password: 'Password1',
      });
      expect(service.currentUser()).toEqual({
        username: 'jane@example.com',
        email: 'jane@example.com',
      });
    });
  });

  describe('logout', () => {
    it('signs out and clears currentUser', async () => {
      (signIn as Mock).mockResolvedValue({ isSignedIn: true });
      (getCurrentUser as Mock).mockResolvedValue({ username: 'jane@example.com' });
      await service.login('jane@example.com', 'Password1');

      (signOut as Mock).mockResolvedValue(undefined);
      await service.logout();

      expect(signOut).toHaveBeenCalled();
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when a session has tokens', async () => {
      (fetchAuthSession as Mock).mockResolvedValue({ tokens: { idToken: {} } });

      await expect(service.isAuthenticated()).resolves.toBe(true);
    });

    it('returns false when there are no tokens', async () => {
      (fetchAuthSession as Mock).mockResolvedValue({ tokens: undefined });

      await expect(service.isAuthenticated()).resolves.toBe(false);
    });

    it('returns false rather than throwing when fetchAuthSession rejects', async () => {
      (fetchAuthSession as Mock).mockRejectedValue(new Error('no session'));

      await expect(service.isAuthenticated()).resolves.toBe(false);
    });
  });

  describe('getIdToken', () => {
    it('returns the id token string when signed in', async () => {
      (fetchAuthSession as Mock).mockResolvedValue({
        tokens: { idToken: { toString: () => 'jwt-token' } },
      });

      await expect(service.getIdToken()).resolves.toBe('jwt-token');
    });

    it('returns null when signed out', async () => {
      (fetchAuthSession as Mock).mockResolvedValue({ tokens: undefined });

      await expect(service.getIdToken()).resolves.toBeNull();
    });
  });
});
