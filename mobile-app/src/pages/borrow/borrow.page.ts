import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

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
  
  interestRate = 1.0; // 日利率 1%
  interest = 0;
  totalRepayment = 0;
  
  agreedToTerms = false;
  loading = false;

  constructor(
    private router: Router,
    private translate: TranslateService
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
    if (!this.agreedToTerms) return;

    this.loading = true;

    try {
      // TODO: 调用借款 API
      console.log('Submit loan:', {
        amount: this.amount,
        days: this.selectedDays,
        interest: this.interest,
        totalRepayment: this.totalRepayment,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // 跳转到成功页面
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Loan error:', error);
    } finally {
      this.loading = false;
    }
  }
}
