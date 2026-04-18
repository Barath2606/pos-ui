import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/models';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product.component.html'
})
export class ProductComponent implements OnInit {
  products: Product[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isEditMode = false;
  showForm = false;

  form: Partial<Product> = this.emptyForm();

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  emptyForm(): Partial<Product> {
    return { productName: '', price: 0, taxPercentage: 0, stockQuantity: 0 };
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAll().subscribe({
      next: (data) => { this.products = data; this.isLoading = false; },
      error: () => { this.errorMessage = 'Failed to load products.'; this.isLoading = false; }
    });
  }

  openAddForm(): void {
    this.form = this.emptyForm();
    this.isEditMode = false;
    this.showForm = true;
    this.clearMessages();
  }

  editProduct(p: Product): void {
    this.form = { ...p };
    this.isEditMode = true;
    this.showForm = true;
    this.clearMessages();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveProduct(): void {
    if (!this.form.productName || !this.form.price) {
      this.errorMessage = 'Product name and price are required.';
      return;
    }

    this.isLoading = true;

    if (this.isEditMode) {
      this.productService.update(this.form.productId!, this.form).subscribe({
        next: () => {
          this.successMessage = 'Product updated successfully!';
          this.cancelForm();
          this.loadProducts();
        },
        error: () => { this.errorMessage = 'Failed to update product.'; this.isLoading = false; }
      });
    } else {
      this.productService.create(this.form).subscribe({
        next: () => {
          this.successMessage = 'Product added successfully!';
          this.cancelForm();
          this.loadProducts();
        },
        error: () => { this.errorMessage = 'Failed to add product.'; this.isLoading = false; }
      });
    }
  }

  deleteProduct(id: number): void {
    if (!confirm('Are you sure you want to delete this product?')) return;
    this.productService.delete(id).subscribe({
      next: () => { this.successMessage = 'Product deleted.'; this.loadProducts(); },
      error: () => { this.errorMessage = 'Failed to delete product.'; }
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.form = this.emptyForm();
    this.isEditMode = false;
    this.isLoading = false;
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
