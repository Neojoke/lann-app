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
import { useTranslation } from 'react-i18next';
// Temporarily commented out for build
// import { AuthService } from '../services/auth.service';

const LoginPage: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const [presentToast] = useIonToast();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showSendOtp, setShowSendOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  // Temporarily commented out
  // const authService = new AuthService();

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
        message: t('login.invalidPhone'),
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
      return;
    }

    setSendingOtp(true);
    // Mock OTP for development
    presentToast({
      message: t('login.otpSent'),
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
    setSendingOtp(false);
  };

  const handleLogin = async () => {
    if (!isValidPhone(phone)) {
      presentToast({
        message: t('login.invalidPhone'),
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
      return;
    }

    if (otp.length !== 6) {
      presentToast({
        message: t('login.enterOtp'),
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
      return;
    }

    setLoading(true);
    // Mock login for development
    localStorage.setItem('auth_token', 'mock_token_' + Date.now());
    localStorage.setItem('user', JSON.stringify({ id: 'user_mock', phone, name: 'User' }));
    
    presentToast({
      message: t('login.loginSuccess'),
      duration: 2000,
      position: 'top',
      color: 'success',
    });

    // 跳转到首页
    history.push('/home');
    setLoading(false);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>{t('login.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="login-content">
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonTitle size="large">{t('login.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="login-container">
          <div className="logo-section">
            <h1>Lann</h1>
            <p>{t('login.subtitle')}</p>
          </div>

          <div className="form-section">
            <IonItem className="input-item">
              <IonIcon icon={callOutline} slot="start" />
              <IonLabel position="floating">{t('login.phoneLabel')}</IonLabel>
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
                    ? t('login.sendingOtp')
                    : countdown > 0
                    ? t('login.resendOtp', { count: countdown })
                    : t('login.sendOtp')}
                </IonButton>
              </div>
            )}

            <IonItem className="input-item">
              <IonIcon icon={keypadOutline} slot="start" />
              <IonLabel position="floating">{t('login.otpLabel')}</IonLabel>
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
              {loading ? t('login.loggingIn') : t('login.login')}
            </IonButton>

            <div className="register-link">
              <p>
                {t('login.noAccount')}{' '}
                <a href="/register" onClick={(e) => { e.preventDefault(); history.push('/register'); }}>
                  {t('login.register')}
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
