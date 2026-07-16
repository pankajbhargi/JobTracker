import { Injectable, signal } from '@angular/core';
import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  updateUserAttributes,
} from 'aws-amplify/auth';
// https://aws-amplify.github.io/amplify-js/api/
// https://docs.amplify.aws/angular/frontend/auth/manage-user-sessions/

export interface AuthUser {
  username: string;
  email: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signal so components (header, guards) can react to auth state changes.
  // null = signed out.
  readonly currentUser = signal<AuthUser | null>(null);

  constructor() {
    // on service creation (e.g. page refresh while already logged in),
    // check whether a session already exists and populate currentUser.
    this.loadCurrentUser().catch((error) => {
      console.error('No user logged in');
    });
    // Hint: getCurrentUser() throws if nobody is signed in — wrap in try/catch
    // and call loadCurrentUser() below on success.
  }

  /**
   * Starts Cognito sign-up. Our User Pool requires email verification,
   * so the result's nextStep will be 'CONFIRM_SIGN_UP' — the caller
   * should route the user to enter the code they were emailed.
   */
  async register(email: string, password: string): Promise<void> {
    const { isSignUpComplete, userId, nextStep } = await signUp({
      username: email,
      password: password,
      options: {
        userAttributes: {
          email: email
        },
      }
    });
    // Console log the outputs from signUp call
    console.log('isSignUpComplete:', isSignUpComplete);
    console.log('userId:', userId);
    console.log('nextStep:', nextStep);
  }

  /** Confirms the 6-digit code Cognito emailed after register(). */
  async confirmRegistration(email: string, code: string): Promise<boolean> {
    const { isSignUpComplete, nextStep } = await confirmSignUp({
      username: email,
      confirmationCode: code
    });
    // Console log the outputs from confirmSignUp call
    console.log('isSignUpComplete:', isSignUpComplete);
    console.log('nextStep:', nextStep);
    return isSignUpComplete;
  }

  async login(email: string, password: string): Promise<void> {
    await signIn({
      username: email,
      password: password,
    });
    await this.loadCurrentUser();
  }

  async logout(): Promise<void> {
    await signOut();
    this.currentUser.set(null);
  }

  /**
   * Used by the route guard (next step) to decide whether to allow
   * navigation. Should never throw — resolve false if there's no session.
   */
  async isAuthenticated(): Promise<boolean> {
    // call fetchAuthSession() and check whether it has valid tokens
    // (session.tokens is undefined when signed out).
    const session = await fetchAuthSession();
    if (!session || !session.tokens) {
      return false;
    }
    return true
  }

  /**
   * Used by the HTTP interceptor (later step) to attach the
   * Authorization header on API calls.
   */
  async getIdToken(): Promise<string | null> {
    // return session.tokens?.idToken?.toString() from fetchAuthSession(), or null if signed out.
    const session = await fetchAuthSession();
    if (!session || !session.tokens || !session.tokens.idToken) {
      return null;
    }
    return session.tokens.idToken.toString();
  }

  /**
   * Updates the standard `name` attribute on the Cognito user, then
   * reflects the change in `currentUser` immediately (optimistic update —
   * updateUserAttributes() doesn't return the new attribute values itself).
   */
  async updateName(name: string): Promise<void> {
    await updateUserAttributes({ userAttributes: { name } });
    const current = this.currentUser();
    if (current) {
      this.currentUser.set({ ...current, name });
    }
  }

  private async loadCurrentUser(): Promise<void> {
    // getCurrentUser() only gives us { username }, which is a random
    // Cognito-generated id here (not the email — see the sign_in_aliases
    // discussion). The real email and name attributes come from
    // fetchUserAttributes() instead.
    const { username } = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    this.currentUser.set({
      username,
      email: attributes.email ?? '',
      name: attributes.name ?? '',
    });
  }
}
