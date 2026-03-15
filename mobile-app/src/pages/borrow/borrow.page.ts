import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-borrow',
  templateUrl: './borrow.page.html',
  styleUrls: ['./borrow.page.scss'],
})
export class BorrowPage implements OnInit {
  minAmount = 1000;
  maxAmount = 50000;
  amount = 5000;
  
  durationOptions = [7, 14, 21, 30];
  selectedDays = 14;
  
  interestRate = 1.0;
  interest = 0;
  totalRepayment = 0;
  
  agreedToTerms = false;
  loading = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.calculateRepayment();
  }

  selectDuration(days: number) {
    this.selectedDays = days;
    this.calculateRepayment();
  }

  calculateRepayment() {
    this.interest = this.amount * (this.interestRate / 100) * this.selectedDays;
    this.totalRepayment = this.amount + this.interest;
  }

  async submitLoan() {
    if (!this.agreedToTerms) {
      const alert = await this.alertController.create({
        header: 'Terms Required',
        message: 'Please agree to the loan terms to continue',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    this.loading = true;

    try {
      const response = await this.apiService.createLoan(this.amount, this.selectedDays).toPromise();
      
      if (response.success) {
        const toast = await this.toastController.create({
          message: 'Loan approved! Fund will be transferred soon.',
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
        header: 'Loan Failed',
        message: error.error?.message || 'Failed to process loan',
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.loading = false;
    }
  }
}
