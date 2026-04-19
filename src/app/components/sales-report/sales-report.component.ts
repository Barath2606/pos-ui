import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { Sale } from '../../models/models';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-report.component.html'
})
export class SalesReportComponent implements OnInit {
  sales: Sale[] = [];
  isLoading = false;
  errorMessage = '';
  expandedSaleId: number | null = null;
  searchDate: string = '';

  constructor(private salesService: SalesService) {}

  ngOnInit(): void { this.loadSales(); }

  loadSales(): void {
    this.isLoading = true;
    this.salesService.getAll().subscribe({
      next: (data) => { this.sales = data; this.isLoading = false; },
      error: () => { this.errorMessage = 'Failed to load sales.'; this.isLoading = false; }
    });
  }

  get filteredSales(): Sale[] {
    if (!this.searchDate) return this.sales;
    return this.sales.filter(s => s.saleDate.startsWith(this.searchDate));
  }

  get totalRevenue(): number {
    return this.filteredSales.reduce((sum, s) => sum + s.netAmount, 0);
  }

  get totalTax(): number {
    return this.filteredSales.reduce((sum, s) => sum + s.taxAmount, 0);
  }

  get totalTransactions(): number {
    return this.filteredSales.length;
  }

  toggleExpand(saleId: number): void {
    this.expandedSaleId = this.expandedSaleId === saleId ? null : saleId;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // ── Excel Download ────────────────────────────────────────
  downloadExcel(): void {
    const rows: string[][] = [];

    // Header
    rows.push(['Sale ID', 'Date', 'Product', 'Quantity', 'Unit Price', 'Item Total', 'Subtotal', 'Tax', 'Net Total']);

    this.filteredSales.forEach(sale => {
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach((item, idx) => {
          rows.push([
            idx === 0 ? `#${sale.saleId}` : '',
            idx === 0 ? this.formatDate(sale.saleDate) : '',
            item.productName || '',
            item.quantity.toString(),
            `₹${item.price.toFixed(2)}`,
            `₹${item.total.toFixed(2)}`,
            idx === 0 ? `₹${sale.totalAmount.toFixed(2)}` : '',
            idx === 0 ? `₹${sale.taxAmount.toFixed(2)}` : '',
            idx === 0 ? `₹${sale.netAmount.toFixed(2)}` : ''
          ]);
        });
      } else {
        rows.push([
          `#${sale.saleId}`,
          this.formatDate(sale.saleDate),
          '', '', '', '',
          `₹${sale.totalAmount.toFixed(2)}`,
          `₹${sale.taxAmount.toFixed(2)}`,
          `₹${sale.netAmount.toFixed(2)}`
        ]);
      }
    });

    // Summary row
    rows.push([]);
    rows.push(['', '', '', '', '', 'TOTALS',
      `₹${(this.totalRevenue - this.totalTax).toFixed(2)}`,
      `₹${this.totalTax.toFixed(2)}`,
      `₹${this.totalRevenue.toFixed(2)}`
    ]);

    // Build CSV content (opens in Excel)
    const csvContent = rows.map(r =>
      r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── PDF Download ──────────────────────────────────────────
  downloadPDF(): void {
    const printContent = this.buildPDFHTML();
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(printContent);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }

  private buildPDFHTML(): string {
    const date = new Date().toLocaleString('en-IN');
    const rowsHTML = this.filteredSales.map(sale => {
      const itemsHTML = sale.items?.map(item => `
        <tr class="item-row">
          <td></td><td></td>
          <td>${item.productName || ''}</td>
          <td class="center">${item.quantity}</td>
          <td class="right">₹${item.price.toFixed(2)}</td>
          <td class="right">₹${item.total.toFixed(2)}</td>
          <td></td><td></td><td></td>
        </tr>`).join('') || '';

      return `
        <tr class="sale-row">
          <td><span class="badge">#${sale.saleId}</span></td>
          <td>${this.formatDate(sale.saleDate)}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td class="right">₹${sale.totalAmount.toFixed(2)}</td>
          <td class="right amber">₹${sale.taxAmount.toFixed(2)}</td>
          <td class="right green">₹${sale.netAmount.toFixed(2)}</td>
        </tr>
        ${itemsHTML}`;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sales Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a2535; padding: 30px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #1a2e22; padding-bottom: 16px; }
    .logo { font-size: 20px; font-weight: 700; color: #1a2e22; }
    .logo span { display: block; font-size: 11px; font-weight: 400; color: #64748b; margin-top: 2px; }
    .report-info { text-align: right; font-size: 11px; color: #64748b; }
    .report-info strong { display: block; font-size: 14px; font-weight: 700; color: #1a2535; }
    .stats { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-box { flex: 1; background: #f5f6f8; border-radius: 8px; padding: 12px 16px; border-left: 3px solid; }
    .stat-box.blue { border-color: #3b82f6; }
    .stat-box.green { border-color: #2d9e5f; }
    .stat-box.orange { border-color: #f59e0b; }
    .stat-box .val { font-size: 18px; font-weight: 700; margin-top: 2px; }
    .stat-box .lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-box.blue .val { color: #3b82f6; }
    .stat-box.green .val { color: #2d9e5f; }
    .stat-box.orange .val { color: #f59e0b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #1a2e22; color: #fff; padding: 9px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
    td { padding: 8px 12px; border-bottom: 1px solid #e8ecf0; }
    .sale-row td { background: #fafbfc; font-weight: 500; }
    .item-row td { background: #fff; color: #64748b; font-size: 11px; padding: 5px 12px 5px 24px; }
    .center { text-align: center; }
    .right { text-align: right; }
    .green { color: #2d9e5f; font-weight: 600; }
    .amber { color: #f59e0b; }
    .badge { background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; color: #475569; }
    tfoot td { background: #1a2e22; color: #fff; font-weight: 700; padding: 10px 12px; }
    tfoot td.right { color: #5dd68c; }
    tfoot td.amber { color: #fbbf24; }
    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e8ecf0; padding-top: 12px; }
    @media print { body { padding: 15px; } @page { margin: 1cm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🛒 Smart POS System<span>Point of Sale — Sales Report</span></div>
    <div class="report-info">
      <strong>Sales Report</strong>
      Generated: ${date}<br>
      ${this.searchDate ? 'Date Filter: ' + this.searchDate : 'All Transactions'}<br>
      Total Records: ${this.totalTransactions}
    </div>
  </div>

  <div class="stats">
    <div class="stat-box blue">
      <div class="lbl">Total Transactions</div>
      <div class="val">${this.totalTransactions}</div>
    </div>
    <div class="stat-box green">
      <div class="lbl">Total Revenue</div>
      <div class="val">₹${this.totalRevenue.toFixed(2)}</div>
    </div>
    <div class="stat-box orange">
      <div class="lbl">Tax Collected</div>
      <div class="val">₹${this.totalTax.toFixed(2)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Sale ID</th><th>Date & Time</th><th>Product</th>
        <th class="center">Qty</th><th class="right">Unit Price</th>
        <th class="right">Item Total</th><th class="right">Subtotal</th>
        <th class="right">Tax</th><th class="right">Net Total</th>
      </tr>
    </thead>
    <tbody>${rowsHTML}</tbody>
    <tfoot>
      <tr>
        <td colspan="6" style="text-align:right;">TOTALS</td>
        <td class="right">₹${(this.totalRevenue - this.totalTax).toFixed(2)}</td>
        <td class="right amber">₹${this.totalTax.toFixed(2)}</td>
        <td class="right">₹${this.totalRevenue.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">Smart POS System &nbsp;|&nbsp; Generated on ${date} &nbsp;|&nbsp; Confidential</div>
</body>
</html>`;
  }
}