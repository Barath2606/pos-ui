import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User, UserCreateRequest, UserUpdateRequest } from '../../models/models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  isLoading     = false;
  showForm      = false;
  isEditMode    = false;
  successMessage = '';
  errorMessage   = '';

  form: any = this.emptyForm();

  constructor(private userService: UserService) {}

  ngOnInit(): void { this.loadUsers(); }

  emptyForm() {
    return { fullName: '', username: '', password: '', role: 'Cashier', isActive: true };
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAll().subscribe({
      next: (data) => { this.users = data; this.isLoading = false; },
      error: () => { this.errorMessage = 'Failed to load users.'; this.isLoading = false; }
    });
  }

  openAddForm(): void {
    this.form = this.emptyForm();
    this.isEditMode = false;
    this.showForm = true;
    this.clearMessages();
  }

  editUser(u: User): void {
    this.form = { userId: u.userId, fullName: u.fullName, username: u.username, password: '', role: u.role, isActive: u.isActive };
    this.isEditMode = true;
    this.showForm = true;
    this.clearMessages();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveUser(): void {
    if (!this.form.fullName || !this.form.role) {
      this.errorMessage = 'Full name and role are required.'; return;
    }
    if (!this.isEditMode && !this.form.password) {
      this.errorMessage = 'Password is required for new users.'; return;
    }

    this.isLoading = true;

    if (this.isEditMode) {
      const payload: UserUpdateRequest = {
        userId: this.form.userId, fullName: this.form.fullName,
        role: this.form.role, isActive: this.form.isActive
      };
      this.userService.update(this.form.userId, payload).subscribe({
        next: () => { this.successMessage = 'User updated!'; this.cancelForm(); this.loadUsers(); },
        error: (e) => { this.errorMessage = e.error?.message || 'Failed to update user.'; this.isLoading = false; }
      });
    } else {
      const payload: UserCreateRequest = {
        fullName: this.form.fullName, username: this.form.username,
        password: this.form.password, role: this.form.role
      };
      this.userService.create(payload).subscribe({
        next: () => { this.successMessage = 'User created!'; this.cancelForm(); this.loadUsers(); },
        error: (e) => { this.errorMessage = e.error?.message || 'Failed to create user.'; this.isLoading = false; }
      });
    }
  }

  deleteUser(id: number): void {
    if (!confirm('Delete this user?')) return;
    this.userService.delete(id).subscribe({
      next: () => { this.successMessage = 'User deleted.'; this.loadUsers(); },
      error: () => { this.errorMessage = 'Failed to delete user.'; }
    });
  }

  cancelForm(): void {
    this.showForm = false; this.form = this.emptyForm();
    this.isEditMode = false; this.isLoading = false;
  }

  clearMessages(): void { this.successMessage = ''; this.errorMessage = ''; }
}
