import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  userName = 'User';
  currentLang = 'en';
  hasActiveLoan = false;
  availableCredit = 20000;

  constructor(
    private router: Router,
    private translate: TranslateService
  ) {
    // 默认使用英语
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit() {
    // 加载用户信息
    this.loadUserInfo();
  }

  loadUserInfo() {
    // TODO: 从服务加载真实用户数据
    const savedUser = localStorage.getItem('userName');
    if (savedUser) {
      this.userName = savedUser;
    }
  }

  toggleLanguage() {
    this.currentLang = this.currentLang === 'en' ? 'th' : 'en';
    this.translate.use(this.currentLang);
    localStorage.setItem('preferredLang', this.currentLang);
  }

  goToBorrow() {
    this.router.navigate(['/borrow']);
  }

  goToMyLoans() {
    // TODO: 导航到借款记录页面
    console.log('Navigate to my loans');
  }

  goToRepay() {
    this.router.navigate(['/repay']);
  }

  goToSettings() {
    // TODO: 导航到设置页面
    console.log('Navigate to settings');
  }

  goToSupport() {
    // TODO: 导航到客服页面
    console.log('Navigate to support');
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
