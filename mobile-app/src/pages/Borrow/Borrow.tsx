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
  IonRange,
  IonButton,
  useIonToast,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { documentTextOutline, walletOutline, alertCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoanService } from '../../services/loan.service';
import { UserService, CreditStatusResponse } from '../../services/user.service';

const BorrowPage: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const [amount, setAmount] = useState(5000);
  const [selectedDays, setSelectedDays] = useState(14);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingCredit, setCheckingCredit] = useState(true);
  const [creditStatus, setCreditStatus] = useState<CreditStatusResponse | null>(null);
  const [presentToast] = useIonToast();

  const loanService = new LoanService();
  const userService = new UserService();

  const durationOptions = [7, 14, 21, 30];
  const minAmount = 1000;
  
  // 根据信用额度动态设置最大借款金额
  const maxAmount = creditStatus?.credit_available || 50000;

  const { interest, totalRepayment } = loanService.calculateInterest(amount, selectedDays);

  useEffect(() => {
    checkCreditStatus();
  }, []);

  const checkCreditStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        history.push('/login');
        return;
      }

      const response = await userService.getCreditStatus(token);
      if (response.success) {
        setCreditStatus(response);
        
        // 检查是否有可用额度
        if (!response.credit_available || response.credit_available <= 0) {
          presentToast({
            message: t('borrow.noCreditLimit'),
            duration: 3000,
            position: 'top',
            color: 'warning',
          });
        }
      }
    } catch (error) {
      console.error('Failed to check credit status:', error);
    } finally {
      setCheckingCredit(false);
    }
  };

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      presentToast({
        message: t('borrow.acceptTermsFirst'),
        duration: 2000,
        position: 'top',
        color: 'warning',
      });
      return;
    }

    // 检查借款金额是否超过可用额度
    if (creditStatus && amount > creditStatus.credit_available) {
      presentToast({
        message: t('borrow.exceedLimit'),
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
      return;
    }

    // 跳转到确认页面
    history.push(`/loan-confirm?amount=${amount}&days=${selectedDays}`);
  };

  if (checkingCredit) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('borrow.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding ion-text-center">
          <IonSpinner name="crescent" size="large" />
          <p>{t('borrow.checkingCredit')}</p>
        </IonContent>
      </IonPage>
    );
  }

  if (!creditStatus || creditStatus.status !== 'approved' || !creditStatus.credit_available || creditStatus.credit_available <= 0) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>{t('borrow.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding borrow-no-credit">
          <IonIcon icon={alertCircleOutline} size="large" color="warning" />
          <h2>{t('borrow.noCreditLimit')}</h2>
          <IonText color="medium">
            <p>{t('borrow.noCreditLimitDesc')}</p>
          </IonText>
          <IonButton expand="block" onClick={() => history.push('/credit-status')}>
            {t('borrow.viewCreditStatus')}
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={() => history.push('/profile')}>
            {t('borrow.improveProfile')}
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{t('borrow.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="borrow-content">
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonTitle size="large">{t('borrow.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="borrow-container">
          {/* 可用额度提示 */}
          <section className="credit-limit-banner">
            <IonCard className="limit-banner-card">
              <IonCardContent>
                <div className="limit-banner-content">
                  <IonIcon icon={walletOutline} size="large" color="primary" />
                  <div className="limit-banner-text">
                    <IonText color="medium">{t('borrow.availableLimit')}</IonText>
                    <h3>฿{creditStatus.credit_available.toLocaleString()}</h3>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </section>
          {/* 借款金额 */}
          <section className="amount-section">
            <h2>{t('borrow.amount')}</h2>
            <div className="amount-display">
              <span className="currency">฿</span>
              <span className="amount">{amount.toLocaleString()}</span>
            </div>
            <IonRange
              min={minAmount}
              max={maxAmount}
              step={1000}
              value={amount}
              onIonChange={(e) => setAmount(Number(e.detail.value))}
              color="primary"
            >
              <span slot="start">฿{minAmount.toLocaleString()}</span>
              <span slot="end">฿{maxAmount.toLocaleString()}</span>
            </IonRange>
          </section>

          {/* 借款期限 */}
          <section className="duration-section">
            <h2>{t('borrow.duration')}</h2>
            <div className="duration-options">
              {durationOptions.map((days) => (
                <IonCard
                  key={days}
                  className={`duration-card ${selectedDays === days ? 'selected' : ''}`}
                  onClick={() => setSelectedDays(days)}
                >
                  <IonCardContent>
                    <div className="duration-content">
                      <span className="duration-days">{days}</span>
                      <span className="duration-label">{t('borrow.days')}</span>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          </section>

          {/* 还款详情 */}
          <section className="repayment-section">
            <IonCard className="repayment-card">
              <IonCardHeader>
                <IonCardSubtitle>{t('borrow.repaymentDetails')}</IonCardSubtitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="repayment-details">
                  <div className="detail-row">
                    <span>{t('borrow.principal')}</span>
                    <span>฿{amount.toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span>{t('borrow.interest')}</span>
                    <span>฿{interest.toFixed(2)}</span>
                  </div>
                  <div className="detail-row total">
                    <span>{t('borrow.totalRepayment')}</span>
                    <span>฿{totalRepayment.toFixed(2)}</span>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </section>

          {/* 条款同意 */}
          <section className="terms-section">
            <IonItem>
              <IonIcon icon={documentTextOutline} slot="start" />
              <IonLabel>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                {' '}{t('borrow.acceptTerms')}
              </IonLabel>
            </IonItem>
          </section>

          {/* 提交按钮 */}
          <section className="action-section">
            <IonButton
              expand="block"
              className="submit-btn"
              onClick={handleSubmit}
              disabled={!agreedToTerms || loading}
            >
              {loading ? t('borrow.processing') : t('borrow.confirmBorrow')}
            </IonButton>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BorrowPage;
