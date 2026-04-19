import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ProductService } from './services/product.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  pageTitle = 'Dashboard';
  pageSubtitle = 'Welcome back!';
  currentTime = '';
  lowStockCount = 0;

  private pages: Record<string, { title: string; subtitle: string }> = {
    '/dashboard':    { title: 'Dashboard',    subtitle: 'Overview of your business today' },
    '/billing':      { title: 'Billing / POS', subtitle: 'Create new sales transactions' },
    '/products':     { title: 'Products',      subtitle: 'Manage your product catalogue' },
    '/stock-alerts': { title: 'Stock Alerts',  subtitle: 'Products running low on stock' },
    '/sales':        { title: 'Sales Report',  subtitle: 'View all transactions and revenue' },
    '/users':        { title: 'Users',         subtitle: 'Manage system users and roles' },
  };

  constructor(
    public authService: AuthService,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // Update page title on route change
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const page = this.pages[e.urlAfterRedirects] || { title: 'POS System', subtitle: '' };
      this.pageTitle    = page.title;
      this.pageSubtitle = page.subtitle;
    });

    // Clock
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);

    // Load low stock count
    if (this.authService.isLoggedIn()) {
      this.loadLowStock();
    }
  }

  updateTime(): void {
    this.currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  loadLowStock(): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        this.lowStockCount = products.filter(p => p.stockQuantity <= 5).length;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}