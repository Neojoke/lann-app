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
  IonIcon,
  IonText,
  IonSpinner,
  IonButton,
  useIonToast,
  IonProgressBar,
} from '@ionic/react';
import {
  checkmarkCircleOutline,
  timeOutline,
  alertCircleOutline,
  walletOutline,
  calendarOutline,
  downloadOutline,
  shareOutline,
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoanService, LoanStatus as LoanStatusType } from '../../services/loan.service';

const LoanStatus: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();
  const [presentToast] = useIonToast();
  const loanService = new LoanService();

  const [loading, setLoading] = useState(true);
  const [loanId, setLoanId] = useState<string>('');
  const [status, setStatus] = useState<LoanStatusType | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('loanId');
    if (id) {
      setLoanId(id);
      loadLoanStatus(id);
    } else {
      // 如果没有 loanId，获取最近的贷款
      loadLatestLoan();
    }
  }, [location]);

  const loadLoanStatus = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        history.push('/login');
        return;
      }

      const response = await loanService.getLoanStatus(token, id);
      if (response.success) {
        setStatus(response.loan);
      }
    } catch (error: any) {
      presentToast({
        message: error.message || 'Failed to load loan status',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLatestLoan = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        history.push('/login');
        return;
      }

      const response = await loanService.getLoans(token);
      if (response.success && response.loans && response.loans.length > 0) {
        const latestLoan = response.loans[0];
        setLoanId(latestLoan.id);
        setStatus(latestLoan);
      }
    } catch (error: any) {
      presentToast({
        message: error.message || 'Failed to load loans',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    presentToast({
      message: 'Contract downloaded (mock)',
      duration: 2000,
      position: 'top',
      color: 'success',
    });
  };

  const handleShare = () => {
    presentToast({
      message: 'Share feature (mock)',
      duration: 2000,
      position: 'top',
      color: 'medium',
    });
  };

  const getStatusIcon = () => {
    if (!status) return null;
    
    switch (status.status) {
      case 'approved':
      case 'disbursed':
        return { icon: checkmarkCircleOutline, color: 'success' };
      case 'pending':
        return { icon: timeOutline, color: 'warning' };
      case 'rejected':
        return { icon: alertCircleOutline, color: 'danger' };
      default:
        return { icon: timeOutline, color: 'medium' };
    }
  };

  const getStatusText = () => {
    if (!status) return '';
    
    switch (status.status) {
      case 'approved':
        return 'Approved';
      case 'disbursed':
        return 'Disbursed';
      case 'pending':
        return 'Processing';
      case 'rejected':
        return 'Rejected';
      default:
        return status.status;
    }
  };

  const statusIcon = getStatusIcon();

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Loan Status</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding ion-text-center">
          <IonSpinner name="crescent" size="large" />
          <p>{t('common.loading')}</p>
        </IonContent>
      </IonPage>
    );
  }

  if (!status) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Loan Status</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <IonIcon icon={alertCircleOutline} size="large" color="medium" />
            <h2>No Loan Found</h2>
            <IonText color="medium">
              <p>You haven't applied for a loan yet</p>
            </IonText>
            <IonButton expand="block" onClick={() => history.push('/borrow')}>
              Apply for Loan
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const dueDate = new Date(status.created_at);
  dueDate.setDate(dueDate.getDate() + status.duration_days);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Loan Status</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="loan-status-content">
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonTitle size="large">Loan Status</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="loan-status-container">
          {/* 状态图标 */}
          <div className="status-header">
            {statusIcon && (
              <div className={`status-icon ${statusIcon.color}`}>
                <IonIcon icon={statusIcon.icon} />
              </div>
            )}
            <h2>{getStatusText()}</h2>
            <IonText color="medium">
              <p>Loan ID: {loanId}</p>
            </IonText>
          </div>

          {/* 进度条 */}
          <IonCard className="progress-card">
            <IonCardContent>
              <div className="progress-steps">
                <div className={`step ${['pending', 'approved', 'disbursed'].includes(status.status) ? 'active' : ''} ${['approved', 'disbursed'].includes(status.status) ? 'completed' : ''}`}>
                  <IonIcon icon={timeOutline} />
                  <span>Applied</span>
                </div>
                <div className={`step ${['approved', 'disbursed'].includes(status.status) ? 'active' : ''} ${status.status === 'disbursed' ? 'completed' : ''}`}>
                  <IonIcon icon={checkmarkCircleOutline} />
                  <span>Approved</span>
                </div>
                <div className={`step ${status.status === 'disbursed' ? 'active completed' : ''}`}>
                  <IonIcon icon={walletOutline} />
                  <span>Disbursed</span>
                </div>
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
                <IonText color="medium">Loan Amount</IonText>
                <IonText>
                  <strong>฿{status.principal.toLocaleString()}</strong>
                </IonText>
              </div>
              <div className="detail-row">
                <IonText color="medium">Duration</IonText>
                <IonText>
                  <strong>{status.duration_days} {t('borrow.days')}</strong>
                </IonText>
              </div>
              <div className="detail-row">
                <IonText color="medium">Interest Rate</IonText>
                <IonText>
                  <strong>1% / day</strong>
                </IonText>
              </div>
              <div className="detail-row">
                <IonText color="medium">Total Repayment</IonText>
                <IonText color="primary">
                  <strong>฿{status.total_repayment.toLocaleString()}</strong>
                </IonText>
              </div>
              <div className="detail-divider" />
              <div className="detail-row">
                <IonIcon icon={calendarOutline} color="medium" />
                <IonText color="medium">Due Date</IonText>
                <IonText>
                  <strong>{dueDate.toLocaleDateString('th-TH')}</strong>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>

          {/* 还款信息 */}
          {status.status === 'disbursed' && (
            <IonCard className="repayment-card">
              <IonCardHeader>
                <IonCardSubtitle>
                  <IonIcon icon={walletOutline} slot="start" color="primary" />
                  Repayment Information
                </IonCardSubtitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="repayment-info">
                  <IonText color="medium">Amount Due</IonText>
                  <h3>฿{status.total_repayment.toLocaleString()}</h3>
                  <IonProgressBar value={1} color="success" />
                  <IonText color="success">
                    <small>Funds have been disbursed to your account</small>
                  </IonText>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* rejected 提示 */}
          {status.status === 'rejected' && (
            <IonCard className="rejected-card">
              <IonCardContent>
                <IonText color="danger">
                  <p>Your loan application was not approved. Please improve your credit profile and try again.</p>
                </IonText>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => history.push('/credit-status')}
                  style={{ marginTop: '12px' }}
                >
                  View Credit Status
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {/* 操作按钮 */}
          <div className="status-actions">
            {status.status === 'disbursed' && (
              <>
                <IonButton
                  expand="block"
                  onClick={() => history.push('/repay-schedule')}
                  className="repay-btn"
                >
                  <IonIcon slot="start" icon={walletOutline} />
                  View Repayment Schedule
                </IonButton>
                <div className="secondary-actions">
                  <IonButton
                    fill="outline"
                    onClick={handleDownload}
                  >
                    <IonIcon slot="start" icon={downloadOutline} />
                    Download Contract
                  </IonButton>
                  <IonButton
                    fill="outline"
                    onClick={handleShare}
                  >
                    <IonIcon slot="start" icon={shareOutline} />
                    Share
                  </IonButton>
                </div>
              </>
            )}
            
            {status.status === 'pending' && (
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => history.push('/home')}
              >
                Back to Home
              </IonButton>
            )}
            
            {status.status === 'rejected' && (
              <IonButton
                expand="block"
                onClick={() => history.push('/borrow')}
                color="primary"
              >
                Try Again
              </IonButton>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoanStatus;
