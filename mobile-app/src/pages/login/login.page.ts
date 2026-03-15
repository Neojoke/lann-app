import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

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
    private apiService: ApiService,
    private alertController: AlertController,
    private toastController: ToastController
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
    const phone = this.loginForm.get('phone')?.value;
    
    try {
      const result = await this.apiService.sendOtp(phone).toPromise();
      
      if (result.success) {
        const toast = await this.toastController.create({
          message: 'OTP sent! Check console for test code (123456)',
          duration: 3000,
          position: 'top',
          color: 'success',
        });
        toast.present();
        
        this.sendingOtp = false;
        this.countdown = result.expiresIn || 60;
        this.startCountdown();
      }
    } catch (error: any) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: error.error?.message || 'Failed to send OTP',
        buttons: ['OK'],
      });
      await alert.present();
      this.sendingOtp = false;
    }
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
      const { phone, otp } = this.loginForm.value;
      const result = await this.apiService.verifyOtp(phone, otp).toPromise();
      
      if (result.success) {
        const toast = await this.toastController.create({
          message: 'Login successful!',
          duration: 2000,
          position: 'top',
          color: 'success',
        });
        toast.present();
        
        await toast.onDidDismiss();
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      const alert = await this.alertController.create({
        header: 'Login Failed',
        message: error.error?.message || 'Invalid OTP',
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.loading = false;
    }
  }
}
