import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, UserSession } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private SESSION_KEY = 'pos_session';

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        const session: UserSession = {
          token:     res.token,
          fullName:  res.fullName,
          username:  res.username,
          role:      res.role,
          expiresAt: res.expiresAt
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.router.navigate(['/login']);
  }

  getSession(): UserSession | null {
    const data = localStorage.getItem(this.SESSION_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as UserSession;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return this.getSession()?.token ?? null;
  }

  isLoggedIn(): boolean {
    const session = this.getSession();
    if (!session) return false;
    // Check token expiry
    return new Date(session.expiresAt) > new Date();
  }

  getRole(): string {
    return this.getSession()?.role ?? '';
  }

  isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  getFullName(): string {
    return this.getSession()?.fullName ?? '';
  }
}
