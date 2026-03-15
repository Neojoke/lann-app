import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-repay',
  templateUrl: './repay.page.html',
  styleUrls: ['./repay.page.scss'],
})
export class RepayPage implements OnInit {
  paymentMethods = [
    { id: 'bank', name: 'Bank Transfer', icon: 'business', description: 'Transfer via mobile banking' },
    { id: 'convenience', name: 'Convenience Store', icon: 'storefront', description: 'Pay at 7-11 or FamilyMart' },
    { id: 'promptpay', name: 'PromptPay', icon: 'qr-code-outline', description: 'Scan QR code to pay' },
    { id: 'truemoney', name: 'TrueMoney Wallet', icon: 'wallet', description: 'TrueMoney Wallet' },
  ];

  selectedMethod: string | null = null;
  loading = false;
  pendingRepayments: any[] = [];
  totalDue = 0;
  dueDate = '';

  constructor(
    private router: Router,
    private apiService: ApiService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadPendingRepayments();
  }

  async loadPendingRepayments() {
    try {
      const response = await this.apiService.getPendingRepayments().toPromise();
      if (response.success && response.pending.length > 0) {
        this.pendingRepayments = response.pending;
        this.totalDue = response.pending[0].total;
        this.dueDate = response.pending[0].dueDate;
      }
    } catch (error) {
      console.error('Failed to load repayments', error);
    }
  }

  selectMethod(methodId: string) {
    this.selectedMethod = methodId;
  }

  async submitRepayment() {
    if (!this.selectedMethod) {
      const alert = await this.alertController.create({
        header: 'Select Payment Method',
        message: 'Please select a payment method',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    this.loading = true;

    try {
      const loanId = this.pendingRepayments[0]?.loanId || 'loan_demo';
      const response = await this.apiService.createRepayment(loanId, this.selectedMethod).toPromise();
      
      if (response.success) {
        const toast = await this.toastController.create({
          message: 'Repayment successful!',
          duration: 3000,
          position: 'top',
          color: 'success',
        });
        toast.present();
        
        await toast.onDidDismiss();
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      const alert = await this.alertController.create({
        header: 'Repayment Failed',
        message: error.error?.message || 'Failed to process repayment',
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.loading = false;
    }
  }
}
