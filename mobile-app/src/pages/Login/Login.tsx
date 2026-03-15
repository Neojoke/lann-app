import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonItem,
  IonIcon,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  useIonToast,
} from '@ionic/react';
import { callOutline, keypadOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { AuthService } from '../services/auth.service';

const LoginPage: React.FC = () => {
  const history = useHistory();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showSendOtp, setShowSendOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [presentToast] = useIonToast();

  const authService = new AuthService();

  // 验证手机号格式 (+66 开头，共 12 位)
  const isValidPhone = (value: string) => {
    return /^\+66\d{9}$/.test(value);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setShowSendOtp(value.length >= 12);
  };

  const sendOtp = async () => {
    if (!isValidPhone(phone)) {
      presentToast({
        message: 'เบอร์โทรศัพท์ไม่ถูกต้อง (格式：+66XXXXXXXXX)',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
      return;
    }

    setSendingOtp(true);
    try {
      const response = await authService.sendOtp(phone);
      
      if (response.success) {
        presentToast({
          message: `ส่ง OTP เรียบร้อยแล้ว (测试 OTP: ${response.debug?.otp})`,
          duration: 3000,
          position: 'top',
          color: 'success',
        });

        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      presentToast({
        message: 'ส่ง OTP ล้มเหลว',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleLogin = async () => {
    if (!isValidPhone(phone)) {
      presentToast({
        message: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
      return;
    }

    if (otp.length !== 6) {
      presentToast({
        message: 'กรุณากรอก OTP 6 หลัก',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyOtp(phone, otp);
      
      if (response.success) {
        presentToast({
          message: 'เข้าสู่ระบบสำเร็จ',
          duration: 2000,
          position: 'top',
          color: 'success',
        });

        // 跳转到首页
        history.push('/home');
      }
    } catch (error) {
      presentToast({
        message: 'เข้าสู่ระบบล้มเหลว',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>เข้าสู่ระบบ</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="login-content">
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonTitle size="large">เข้าสู่ระบบ</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="login-container">
          <div className="logo-section">
            <h1>Lann</h1>
            <p>ง่าย รวดเร็ว ปลอดภัย</p>
          </div>

          <div className="form-section">
            <IonItem className="input-item">
              <IonIcon icon={callOutline} slot="start" />
              <IonLabel position="floating">เบอร์โทรศัพท์</IonLabel>
              <IonInput
                type="tel"
                placeholder="+66"
                inputmode="tel"
                value={phone}
                onIonInput={(e) => handlePhoneChange(e.detail.value || '')}
              />
            </IonItem>

            {showSendOtp && (
              <div className="otp-actions">
                <IonButton
                  fill="clear"
                  onClick={sendOtp}
                  disabled={sendingOtp || countdown > 0}
                >
                  {sendingOtp
                    ? 'กำลังส่ง...'
                    : countdown > 0
                    ? `ส่งใหม่ (${countdown}s)`
                    : 'ส่ง OTP'}
                </IonButton>
              </div>
            )}

            <IonItem className="input-item">
              <IonIcon icon={keypadOutline} slot="start" />
              <IonLabel position="floating">รหัส OTP</IonLabel>
              <IonInput
                type="text"
                maxlength={6}
                inputmode="numeric"
                value={otp}
                onIonInput={(e) => setOtp(e.detail.value || '')}
              />
            </IonItem>

            <IonButton
              expand="block"
              className="submit-btn"
              onClick={handleLogin}
              disabled={!isValidPhone(phone) || otp.length !== 6 || loading}
            >
              {loading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
            </IonButton>

            <div className="register-link">
              <p>
                ยังไม่มีบัญชี?{' '}
                <a href="/register" onClick={(e) => { e.preventDefault(); history.push('/register'); }}>
                  ลงทะเบียน
                </a>
              </p>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
