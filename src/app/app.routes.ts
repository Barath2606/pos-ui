import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductComponent } from './components/product/product.component';
import { BillingComponent } from './components/billing/billing.component';
import { SalesReportComponent } from './components/sales-report/sales-report.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { StockAlertsComponent } from './components/stock-alerts/stock-alerts.component';

export const routes: Routes = [
  { path: 'login',        component: LoginComponent },
  { path: '',             redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',    component: DashboardComponent,      canActivate: [authGuard] },
  { path: 'billing',      component: BillingComponent,        canActivate: [authGuard] },
  { path: 'products',     component: ProductComponent,        canActivate: [authGuard, adminGuard] },
  { path: 'stock-alerts', component: StockAlertsComponent,    canActivate: [authGuard] },
  { path: 'sales',        component: SalesReportComponent,    canActivate: [authGuard] },
  { path: 'users',        component: UserManagementComponent, canActivate: [authGuard, adminGuard] },
  { path: '**',           redirectTo: 'dashboard' }
];