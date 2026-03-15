import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ApiService, User } from '../../services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  user: User | null = null;
  availableCredit = 0;
  totalCredit = 0;
  usedCredit = 0;
  hasActiveLoan = false;
  loans: any[] = [];
  pendingRepayments: any[] = [];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadUserInfo();
    this.loadCreditInfo();
    this.loadLoans();
  }

  ionViewWillEnter() {
    this.loadUserInfo();
    this.loadCreditInfo();
    this.loadLoans();
  }

  async loadUserInfo() {
    try {
      const response = await this.apiService.getUserProfile().toPromise();
      if (response.success) {
        this.user = response.user;
      }
    } catch (error) {
      console.error('Failed to load user info', error);
    }
  }

  async loadCreditInfo() {
    try {
      const response = await this.apiService.getCreditInfo().toPromise();
      if (response.success) {
        this.availableCredit = response.credit.available;
        this.totalCredit = response.credit.total;
        this.usedCredit = response.credit.used;
      }
    } catch (error) {
      console.error('Failed to load credit info', error);
    }
  }

  async loadLoans() {
    try {
      const response = await this.apiService.getLoans().toPromise();
      if (response.success) {
        this.loans = response.loans;
        this.hasActiveLoan = this.loans.some(loan => loan.status === 'active');
      }

      const repaymentsResponse = await this.apiService.getPendingRepayments().toPromise();
      if (repaymentsResponse.success) {
        this.pendingRepayments = repaymentsResponse.pending;
      }
    } catch (error) {
      console.error('Failed to load loans', error);
    }
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Logout',
          handler: () => {
            this.apiService.logout();
            this.router.navigate(['/login']);
          },
        },
      ],
    });
    await alert.present();
  }

  goToBorrow() {
    this.router.navigate(['/borrow']);
  }

  goToRepay() {
    this.router.navigate(['/repay']);
  }

  goToMyLoans() {
    console.log('Navigate to my loans');
  }

  goToSettings() {
    console.log('Navigate to settings');
  }

  goToSupport() {
    console.log('Navigate to support');
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
