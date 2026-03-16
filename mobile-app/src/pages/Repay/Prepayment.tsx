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
  IonProgressBar,
} from '@ionic/react';
import {
  walletOutline,
  trendingUpOutline,
  checkmarkCircleOutline,
  cashOutline,
  calendarOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RepayService } from '../../services/repay.service';

const Prepayment: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();
  const [presentToast] = useIonToast();
  const repayService = new RepayService();

  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(true);
  const [loanId, setLoanId] = useState<string>('');
  const [earlyRepaymentAmount, setEarlyRepaymentAmount] = useState<number>(0);
  const [originalAmount, setOriginalAmount] = useState<number>(0);
  const [remainingPrincipal, setRemainingPrincipal] = useState<number>(0);
  const [interestSaved, setInterestSaved] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('loanId');
    if (id) {
      setLoanId(id);
      calculateEarlyRepayment(id);
    } else {
      presentToast({
        message: 'Invalid loan ID',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
      history.push('/repay-schedule');
    }
  }, [location, history, presentToast]);

  const calculateEarlyRepayment = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        history.push('/login');
        return;
      }

      const response = await repayService.calculateEarlyRepayment(token, id);
      if (response.success) {
        setEarlyRepaymentAmount(response.early_settlement_amount);
        setOriginalAmount(response.original_amount || 0);
        setRemainingPrincipal(response.remaining_principal || 0);
        setInterestSaved(response.interest_saved || 0);
        setDueDate(response.due_date || '');
      }
    } catch (error: any) {
      presentToast({
        message: error.message || 'Failed to calculate early repayment',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleConfirm = async () => {
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

      const response = await repayService.makeEarlyRepayment(token, loanId);
      
      if (response.success) {
        presentToast({
          message: 'Early repayment successful! Your loan has been settled.',
          duration: 3000,
          position: 'top',
          color: 'success',
        });
        history.push('/home');
      }
    } catch (error: any) {
      presentToast({
        message: error.message || 'Early repayment failed',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  if (calculating) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/repay-schedule" />
            </IonButtons>
            <IonTitle>Early Repayment</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding ion-text-center">
          <IonSpinner name="crescent" size="large" />
          <p>Calculating early repayment amount...</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/repay-schedule" />
          </IonButtons>
          <IonTitle>Early Repayment</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="prepayment-content">
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonTitle size="large">Early Repayment</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="prepayment-container">
          {/* 免费提前还款提示 */}
          <IonCard className="free-notice-card">
            <IonCardContent>
              <div className="notice-header">
                <IonIcon icon={checkmarkCircleOutline} color="success" size="large" />
                <h3>No Prepayment Penalty!</h3>
              </div>
              <IonText color="medium">
                <p>You can repay your loan early at any time without any additional fees or penalties.</p>
              </IonText>
            </IonCardContent>
          </IonCard>

          {/* 节省利息 */}
          <IonCard className="savings-card">
            <IonCardHeader>
              <IonCardSubtitle>
                <IonIcon icon={trendingUpOutline} slot="start" color="success" />
                Interest Saved
              </IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="savings-display">
                <span className="savings-amount">฿{interestSaved.toFixed(2)}</span>
                <IonText color="success">
                  <small>By repaying early, you save this amount in interest</small>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>

          {/* 还款详情 */}
          <IonCard className="details-card">
            <IonCardHeader>
              <IonCardSubtitle>
                <IonIcon icon={walletOutline} slot="start" />
                Repayment Details
              </IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="detail-row">
                <IonText color="medium">Original Loan Amount</IonText>
                <IonText>฿{originalAmount.toLocaleString()}</IonText>
              </div>
              <div className="detail-row">
                <IonText color="medium">Remaining Principal</IonText>
                <IonText>฿{remainingPrincipal.toLocaleString()}</IonText>
              </div>
              <div className="detail-row">
                <IonText color="medium">Interest Saved</IonText>
                <IonText color="success">-฿{interestSaved.toFixed(2)}</IonText>
              </div>
              <div className="detail-divider" />
              <div className="detail-row total">
                <IonText>Early Settlement Amount</IonText>
                <IonText color="primary">
                  <strong>฿{earlyRepaymentAmount.toLocaleString()}</strong>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>

          {/* 贷款信息 */}
          <IonCard className="loan-info-card">
            <IonCardContent>
              <div className="info-row">
                <IonIcon icon={calendarOutline} color="medium" />
                <div>
                  <IonText color="medium">
                    <small>Original Due Date</small>
                  </IonText>
                  <p>{dueDate ? new Date(dueDate).toLocaleDateString('th-TH') : 'N/A'}</p>
                </div>
              </div>
              <div className="info-row">
                <IonIcon icon={cashOutline} color="medium" />
                <div>
                  <IonText color="medium">
                    <small>Payment Method</small>
                  </IonText>
                  <p>Same as regular repayment</p>
                </div>
              </div>
              <div className="info-row">
                <IonIcon icon={informationCircleOutline} color="medium" />
                <div>
                  <IonText color="medium">
                    <small>Processing Time</small>
                  </IonText>
                  <p>Instant settlement</p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* 进度条 */}
          <IonCard className="progress-card">
            <IonCardContent>
              <div className="progress-header">
                <IonText color="medium">Loan Repayment Progress</IonText>
                <IonText color="primary">
                  <strong>100%</strong>
                </IonText>
              </div>
              <IonProgressBar value={1} color="success" />
              <IonText color="success">
                <small>After early repayment, your loan will be fully settled</small>
              </IonText>
            </IonCardContent>
          </IonCard>

          {/* 确认按钮 */}
          <div className="prepayment-actions">
            <IonButton
              expand="block"
              className="confirm-btn"
              onClick={handleConfirm}
              disabled={loading || earlyRepaymentAmount <= 0}
            >
              {loading ? (
                <>
                  <IonSpinner name="crescent" size="small" />
                  {' '}Processing...
                </>
              ) : (
                <>
                  <IonIcon slot="start" icon={checkmarkCircleOutline} />
                  Confirm Early Repayment (฿{earlyRepaymentAmount.toLocaleString()})
                </>
              )}
            </IonButton>
            
            <IonButton
              expand="block"
              fill="clear"
              onClick={() => history.push('/repay-schedule')}
              color="medium"
            >
              Cancel
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Prepayment;
