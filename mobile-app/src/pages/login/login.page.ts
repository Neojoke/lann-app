import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  sendingOtp = false;
  showSendOtp = false;
  countdown = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.loginForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^\+66\d{9}$/)]],
      otp: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.loginForm.get('phone')?.valueChanges.subscribe(value => {
      if (value && value.length >= 12) {
        this.showSendOtp = true;
      } else {
        this.showSendOtp = false;
      }
    });
  }

  async sendOtp() {
    if (!this.loginForm.get('phone')?.valid) return;

    this.sendingOtp = true;
    
    // TODO: 调用发送 OTP API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.sendingOtp = false;
    this.countdown = 60;
    this.startCountdown();
  }

  startCountdown() {
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }

  async onSubmit() {
    if (!this.loginForm.valid) return;

    this.loading = true;

    try {
      // TODO: 调用登录 API
      const { phone, otp } = this.loginForm.value;
      console.log('Login:', phone, otp);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 登录成功，跳转到首页
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      this.loading = false;
    }
  }
}
