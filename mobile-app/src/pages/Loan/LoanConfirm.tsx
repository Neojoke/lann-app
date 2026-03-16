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
  IonButton,
  useIonToast,
  IonSpinner,
  IonText,
  IonCheckbox,
} from '@ionic/react';
import {
  documentTextOutline,
  walletOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  calendarOutline,
  penOutline,
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoanService } from '../../services/loan.service';

interface LoanDetails {
  amount: number;
  days: number;
  interest: number;
  totalRepayment: number;
}

const LoanConfirm: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();
  const [presentToast] = useIonToast();
  const loanService = new LoanService();

  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null);

  useEffect(() => {
    // 从路由参数获取借款详情
    const params = new URLSearchParams(location.search);
    const amount = parseFloat(params.get('amount') || '0');
    const days = parseInt(params.get('days') || '14');

    if (amount <= 0 || days <= 0) {
      presentToast({
        message: 'Invalid loan details',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
      history.push('/borrow');
      return;
    }

    const { interest, totalRepayment } = loanService.calculateInterest(amount, days);
    setLoanDetails({
      amount,
      days,
      interest,
      totalRepayment,
    });
  }, [location, history, presentToast]);

  const handleConfirm = async () => {
    if (!agreedToTerms || !agreedToPrivacy) {
      presentToast({
        message: 'Please accept the terms and conditions',
        duration: 2000,
        position: 'top',
        color: 'warning',
      });
      return;
    }

    if (!loanDetails) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        presentToast({
          message: t('borrow.pleaseLogin'),
          duration: 2000,
          position: 'top',
          color: 'danger',
        });
        history.push('/login');
        return;
      }

      const response = await loanService.createLoan(
        token,
        loanDetails.amount,
        loanDetails.days
      );

      if (response.success) {
        presentToast({
          message: t('borrow.borrowSuccess'),
          duration: 2000,
          position: 'top',
          color: 'success',
        });
        history.push(`/loan-status?loanId=${response.loan_id}`);
      }
    } catch (error: any) {
      presentToast({
        message: error.message || t('borrow.borrowFailed'),
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!loanDetails) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('borrow.confirmBorrow')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding ion-text-center">
          <IonSpinner name="crescent" size="large" />
          <p>{t('common.loading')}</p>
        </IonContent>
      </IonPage>
    );
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + loanDetails.days);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/borrow" />
          </IonButtons>
          <IonTitle>{t('borrow.confirmBorrow')}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="loan-confirm-content">
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonTitle size="large">{t('borrow.confirmBorrow')}</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="loan-confirm-container">
          {/* 确认标题 */}
          <div className="confirm-header">
            <IonIcon icon={walletOutline} size="large" color="primary" />
            <h2>Confirm Your Loan</h2>
            <IonText color="medium">
              <p>Please review the details carefully</p>
            </IonText>
          </div>

          {/* 借款金额 */}
          <IonCard className="amount-card">
            <IonCardHeader>
              <IonCardSubtitle>
                <IonIcon icon={walletOutline} slot="start" />
                Loan Amount
              </IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="amount-display">
                <span className="currency">฿</span>
                <span className="amount">{loanDetails.amount.toLocaleString()}</span>
              </div>
            </IonCardContent>
          </IonCard>

          {/* 借款详情 */}
          <IonCard className="details-card">
            <IonCardHeader>
              <IonCardSubtitle>
                <IonIcon icon={documentTextOutline} slot="start" />
                Loan Details
              </IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="detail-row">
                <IonText color="medium">Duration</IonText>
                <IonText>
                  <strong>{loanDetails.days} {t('borrow.days')}</strong>
                </IonText>
              </div>
              <div className="detail-row">
                <IonText color="medium">Due Date</IonText>
                <IonText>
                  <strong>{dueDate.toLocaleDateString('th-TH')}</strong>
                </IonText>
              </div>
              <div className="detail-row">
                <IonText color="medium">Interest Rate</IonText>
                <IonText>
                  <strong>1% / day</strong>
                </IonText>
              </div>
              <div className="detail-divider" />
              <div className="detail-row">
                <IonText color="medium">Principal</IonText>
                <IonText>฿{loanDetails.amount.toLocaleString()}</IonText>
              </div>
              <div className="detail-row">
                <IonText color="medium">Interest</IonText>
                <IonText color="danger">฿{loanDetails.interest.toFixed(2)}</IonText>
              </div>
              <div className="detail-row total">
                <IonText>Total Repayment</IonText>
                <IonText color="primary">
                  <strong>฿{loanDetails.totalRepayment.toFixed(2)}</strong>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>

          {/* 电子签约 */}
          <IonCard className="signature-card">
            <IonCardHeader>
              <IonCardSubtitle>
                <IonIcon icon={penOutline} slot="start" />
                E-Signature
              </IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="signature-hint">
                <IonIcon icon={checkmarkCircleOutline} color="success" />
                <IonText color="medium">
                  <small>By confirming, you agree to the loan terms and authorize electronic signature</small>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>

          {/* 条款同意 */}
          <IonCard className="terms-card">
            <IonCardContent>
              <IonItem>
                <IonIcon icon={documentTextOutline} slot="start" color="primary" />
                <IonLabel>
                  <IonCheckbox
                    checked={agreedToTerms}
                    onIonChange={(e) => setAgreedToTerms(e.detail.checked)}
                  />
                  {' '}I have read and accept the{' '}
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Loan Agreement
                  </a>{' '}
                  and{' '}
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Terms of Service
                  </a>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={alertCircleOutline} slot="start" color="primary" />
                <IonLabel>
                  <IonCheckbox
                    checked={agreedToPrivacy}
                    onIonChange={(e) => setAgreedToPrivacy(e.detail.checked)}
                  />
                  {' '}I agree to the{' '}
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </a>{' '}
                  and data processing
                </IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>

          {/* 确认按钮 */}
          <div className="confirm-actions">
            <IonButton
              expand="block"
              className="confirm-btn"
              onClick={handleConfirm}
              disabled={!agreedToTerms || !agreedToPrivacy || loading}
            >
              {loading ? (
                <>
                  <IonSpinner name="crescent" size="small" />
                  {' '}Processing...
                </>
              ) : (
                <>
                  <IonIcon slot="start" icon={checkmarkCircleOutline} />
                  Confirm and Sign
                </>
              )}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoanConfirm;
