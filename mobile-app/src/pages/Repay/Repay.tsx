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
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
  IonButton,
  useIonToast,
} from '@ionic/react';
import {
  businessOutline,
  storefrontOutline,
  qrCodeOutline,
  walletOutline,
  radioButtonOnOutline,
  radioButtonOffOutline,
  calendarOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RepayService } from '../../services/repay.service';

const RepayPage: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingRepayments, setPendingRepayments] = useState<any[]>([]);
  const [presentToast] = useIonToast();

  const repayService = new RepayService();
  const paymentMethods = repayService.getPaymentMethods();

  useEffect(() => {
    loadPendingRepayments();
  }, []);

  const loadPendingRepayments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        history.push('/login');
        return;
      }

      const response = await repayService.getPendingRepayments(token);
      setPendingRepayments(response.pending);
    } catch (error) {
      console.error('Failed to load pending repayments:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod) {
      presentToast({
        message: t('repay.selectMethodFirst'),
        duration: 2000,
        position: 'top',
        color: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token || pendingRepayments.length === 0) {
        presentToast({
          message: t('repay.noPaymentData'),
          duration: 2000,
          position: 'top',
          color: 'danger',
        });
        return;
      }

      const response = await repayService.createRepayment(
        token,
        pendingRepayments[0].loanId,
        selectedMethod
      );

      if (response.success) {
        presentToast({
          message: t('repay.repaySuccess'),
          duration: 2000,
          position: 'top',
          color: 'success',
        });
        history.push('/home');
      }
    } catch (error) {
      presentToast({
        message: t('repay.repayFailed'),
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (methodId: string) => {
    const icons: any = {
      bank: businessOutline,
      convenience: storefrontOutline,
      promptpay: qrCodeOutline,
      truemoney: walletOutline,
    };
    return icons[methodId] || businessOutline;
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{t('repay.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="repay-content">
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonTitle size="large">{t('repay.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="repay-container">
          {/* 应还金额 */}
          {pendingRepayments.length > 0 && (
            <section className="amount-due-section">
              <IonCard className="amount-card">
                <IonCardHeader>
                  <IonCardSubtitle>{t('repay.amountDue')}</IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="amount-display">
                    <span className="currency">฿</span>
                    <span className="amount">
                      {pendingRepayments[0].total.toLocaleString()}
                    </span>
                  </div>
                  <div className="due-date">
                    <IonIcon icon={calendarOutline} />
                    <span>
                      {t('repay.dueDate')}: {new Date(pendingRepayments[0].dueDate).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </IonCardContent>
              </IonCard>
            </section>
          )}

          {/* 还款方式 */}
          <section className="payment-methods-section">
            <h2>{t('repay.paymentMethods')}</h2>

            {paymentMethods.map((method) => (
              <IonCard
                key={method.id}
                className={`payment-card ${selectedMethod === method.id ? 'selected' : ''}`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <IonCardContent>
                  <div className="payment-row">
                    <IonIcon
                      icon={getMethodIcon(method.id)}
                      className="payment-icon"
                    />
                    <div className="payment-info">
                      <h3>{method.name}</h3>
                      <p>{method.description}</p>
                    </div>
                    <IonIcon
                      icon={selectedMethod === method.id ? radioButtonOnOutline : radioButtonOffOutline}
                      className="radio-icon"
                    />
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </section>

          {/* 支付详情 */}
          {selectedMethod && (
            <section className="payment-details-section">
              <IonCard className="details-card">
                <IonCardHeader>
                  <IonCardTitle>{t('repay.paymentDetails')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {selectedMethod === 'bank' && (
                    <div className="detail-item">
                      <p><strong>{t('repay.bank_detail')}</strong></p>
                    </div>
                  )}
                  {selectedMethod === 'convenience' && (
                    <div className="detail-item">
                      <p><strong>{t('repay.convenience_detail')}</strong></p>
                    </div>
                  )}
                  {selectedMethod === 'promptpay' && (
                    <div className="detail-item">
                      <div className="qr-placeholder">
                        <IonIcon icon={qrCodeOutline} />
                        <p>{t('repay.scanToPay')}</p>
                      </div>
                      <p><strong>{t('repay.promptpay_detail')}</strong></p>
                    </div>
                  )}
                  {selectedMethod === 'truemoney' && (
                    <div className="detail-item">
                      <p><strong>{t('repay.truemoney_detail')}</strong></p>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </section>
          )}

          {/* 提交按钮 */}
          <section className="action-section">
            <IonButton
              expand="block"
              className="submit-btn"
              onClick={handleSubmit}
              disabled={!selectedMethod || loading}
            >
              {loading ? t('repay.processing') : t('repay.confirmRepay')}
            </IonButton>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RepayPage;
