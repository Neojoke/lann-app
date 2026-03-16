import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonIcon,
  IonLabel,
  IonInput,
  IonButton,
  useIonToast,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { keypadOutline, callOutline, timeOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const OTPVerify: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();
  const [presentToast] = useIonToast();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [phone, setPhone] = useState('');

  // 从路由参数获取手机号
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const phoneNumber = params.get('phone');
    if (phoneNumber) {
      setPhone(phoneNumber);
    } else {
      // 如果没有传手机号，返回登录页
      history.push('/login');
    }
  }, [location, history]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setLoading(true);
    // 模拟发送 OTP
    setTimeout(() => {
      setLoading(false);
      setCountdown(60);
      presentToast({
        message: t('login.otpSent'),
        duration: 2000,
        position: 'top',
        color: 'success',
      });
    }, 1000);
  };

  const handleVerify = async () => {
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
    
    // 模拟验证 OTP
    setTimeout(() => {
      setLoading(false);
      
      // 测试 OTP: 123456
      if (otp === '123456') {
        presentToast({
          message: t('login.loginSuccess'),
          duration: 2000,
          position: 'top',
          color: 'success',
        });
        
        // 保存登录状态
        localStorage.setItem('auth_token', 'mock_token_' + Date.now());
        localStorage.setItem('user', JSON.stringify({
          id: 'user_mock',
          phone,
          name: 'User',
        }));
        
        history.push('/home');
      } else {
        presentToast({
          message: 'Invalid OTP. Please use 123456 for testing.',
          duration: 2000,
          position: 'top',
          color: 'danger',
        });
      }
    }, 1500);
  };

  const handleForgotPassword = () => {
    presentToast({
      message: 'Please contact customer service for password recovery',
      duration: 2000,
      position: 'top',
      color: 'medium',
    });
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>{t('login.otpLabel')}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="otp-verify-content">
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonTitle size="large">{t('login.otpLabel')}</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="otp-verify-container">
          {/* 图标和标题 */}
          <div className="verify-header">
            <div className="verify-icon">
              <IonIcon icon={keypadOutline} />
            </div>
            <h2>{t('login.otpLabel')}</h2>
            <IonText color="medium">
              <p>We sent a 6-digit code to</p>
              <p className="phone-number">{phone}</p>
            </IonText>
          </div>

          {/* OTP 输入框 */}
          <IonCard className="otp-input-card">
            <IonCardContent>
              <IonItem className="otp-input-item">
                <IonIcon icon={keypadOutline} slot="start" color="primary" />
                <IonLabel position="floating">Verification Code</IonLabel>
                <IonInput
                  type="text"
                  maxlength={6}
                  inputmode="numeric"
                  pattern="[0-9]*"
                  value={otp}
                  onIonInput={(e) => setOtp(e.detail.value || '')}
                  class="otp-input"
                />
              </IonItem>
            </IonCardContent>
          </IonCard>

          {/* 重发 OTP */}
          <div className="resend-section">
            <IonText color="medium">
              <p>Didn't receive the code?</p>
            </IonText>
            <IonButton
              fill="clear"
              onClick={handleResendOTP}
              disabled={countdown > 0 || loading}
            >
              {countdown > 0 ? (
                <>
                  <IonIcon icon={timeOutline} slot="start" />
                  Resend ({countdown}s)
                </>
              ) : (
                <>
                  <IonIcon icon={callOutline} slot="start" />
                  Resend OTP
                </>
              )}
            </IonButton>
          </div>

          {/* 验证按钮 */}
          <div className="verify-actions">
            <IonButton
              expand="block"
              className="verify-btn"
              onClick={handleVerify}
              disabled={otp.length !== 6 || loading}
            >
              {loading ? (
                <>
                  <IonSpinner name="crescent" size="small" />
                  {' '}Verifying...
                </>
              ) : (
                <>
                  <IonIcon slot="start" icon={checkmarkCircleOutline} />
                  Verify
                </>
              )}
            </IonButton>

            <IonButton
              expand="block"
              fill="clear"
              className="forgot-btn"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </IonButton>
          </div>

          {/* 测试提示 */}
          <IonCard className="test-hint-card">
            <IonCardContent>
              <IonText color="medium">
                <small>
                  <strong>Test Mode:</strong> Use OTP <strong>123456</strong> for testing
                </small>
              </IonText>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OTPVerify;
