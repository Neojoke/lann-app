import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-repay',
  templateUrl: './repay.page.html',
  styleUrls: ['./repay.page.scss'],
})
export class RepayPage implements OnInit {
  paymentMethods = [
    { id: 'bank', name: 'repay.bankTransfer', icon: 'business', description: 'Transfer via mobile banking' },
    { id: 'convenience', name: 'repay.convenienceStore', icon: 'storefront', description: 'Pay at 7-11 or FamilyMart' },
    { id: 'promptpay', name: 'repay.promptPay', icon: 'qr-code-outline', description: 'Scan QR code to pay' },
    { id: 'truemoney', name: 'repay.trueMoney', icon: 'wallet', description: 'TrueMoney Wallet' },
  ];

  selectedMethod: string | null = null;
  loading = false;

  constructor(
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  selectMethod(methodId: string) {
    this.selectedMethod = methodId;
  }

  async submitRepayment() {
    if (!this.selectedMethod) return;

    this.loading = true;

    try {
      // TODO: 调用还款 API
      console.log('Submit repayment:', {
        method: this.selectedMethod,
        amount: 5500,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // 跳转到成功页面
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Repayment error:', error);
    } finally {
      this.loading = false;
    }
  }
}
