import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  username    = '';
  password    = '';
  isLoading   = false;
  errorMessage = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {
    // If already logged in redirect away
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/billing']);
    }
  }

  login(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter username and password.';
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Redirect based on role
        if (res.role === 'Admin') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/billing']);
        }
      },
      error: () => {
        this.isLoading    = false;
        this.errorMessage = 'Invalid username or password. Please try again.';
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
