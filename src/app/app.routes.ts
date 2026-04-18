import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { ProductComponent } from './components/product/product.component';
import { BillingComponent } from './components/billing/billing.component';
import { SalesReportComponent } from './components/sales-report/sales-report.component';
import { UserManagementComponent } from './components/user-management/user-management.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'billing', pathMatch: 'full' },
  { path: 'billing',  component: BillingComponent,       canActivate: [authGuard] },
  { path: 'products', component: ProductComponent,        canActivate: [authGuard, adminGuard] },
  { path: 'sales',    component: SalesReportComponent,    canActivate: [authGuard] },
  { path: 'users',    component: UserManagementComponent, canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: 'billing' }
];
