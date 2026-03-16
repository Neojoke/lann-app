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
  IonChip,
  IonBadge,
  IonProgressBar,
} from '@ionic/react';
import {
  walletOutline,
  timeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  cashOutline,
  calendarOutline,
  refreshOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RepayService, RepaymentSchedule, LoanInfo } from '../../services/repay.service';
import { formatDate, formatCountdown } from '../../utils/dateFormat';
import './RepaySchedule.scss';

interface ScheduleItem extends RepaymentSchedule {
  isOverdue: boolean;
  overdueDays: number;
}

const RepaySchedulePage: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  const { t } = useTranslation();
  const repayService = new RepayService();

  const [loading, setLoading] = useState(true);
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<RepaymentSchedule | null>(null);
  const [earlyRepaymentAmount, setEarlyRepaymentAmount] = useState<number>(0);
  const [calculatingEarly, setCalculatingEarly] = useState(false);

  useEffect(() => {
    loadRepaySchedule();
  }, []);

  const loadRepaySchedule = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        history.push('/login');
        return;
      }

      // 获取贷款列表（简化为获取第一笔贷款）
      const loansResponse = await repayService.getLoans(token);
      if (loansResponse.success && loansResponse.loans && loansResponse.loans.length > 0) {
        const loan = loansResponse.loans[0];
        setLoanInfo(loan);
        
        // 获取还款计划
        const scheduleResponse = await repayService.getRepaySchedule(token, loan.id);
        if (scheduleResponse.success && scheduleResponse.schedules) {
          const now = new Date();
          const schedulesWithStatus = scheduleResponse.schedules.map(schedule => {
            const dueDate = new Date(schedule.due_date);
            const isOverdue = !schedule.paid_at && dueDate < now;
            const overdueDays = isOverdue ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            
            return {
              ...schedule,
              isOverdue,
              overdueDays,
            };
          });
          
          setSchedules(schedulesWithStatus);
        }
      }
    } catch (error: any) {
      presentToast({
        message: error.message || t('error'),
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadRepaySchedule();
  };

  const handleRepay = (schedule: RepaymentSchedule) => {
    // 跳转到还款页面
    history.push(`/repay/${schedule.id}`);
  };

  const calculateEarlyRepayment = async () => {
    if (!loanInfo) return;
    
    setCalculatingEarly(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        history.push('/login');
        return;
      }

      const response = await repayService.calculateEarlyRepayment(token, loanInfo.id);
      if (response.success) {
        setEarlyRepaymentAmount(response.early_settlement_amount);
      }
    } catch (error: any) {
      presentToast({
        message: error.message || t('error'),
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setCalculatingEarly(false);
    }
  };

  const handleEarlyRepayment = () => {
    if (earlyRepaymentAmount > 0) {
      // 跳转到提前还款页面
      history.push(`/early-repay/${loanInfo?.id}`);
    }
  };

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'danger';
    if (status === 'paid') return 'success';
    if (status === 'partial') return 'warning';
    return 'medium';
  };

  const getStatusText = (status: string, isOverdue: boolean) => {
    if (isOverdue) return t('overdue');
    return t(status as any) || t('unpaid');
  };

  const getTotalPaid = () => {
    return schedules
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + s.paid_total, 0);
  };

  const getTotalDue = () => {
    return schedules
      .filter(s => s.status !== 'paid')
      .reduce((sum, s) => sum + s.total_amount, 0);
  };

  const getProgress = () => {
    const total = schedules.reduce((sum, s) => sum + s.total_amount, 0);
    const paid = getTotalPaid();
    return total > 0 ? (paid / total) * 100 : 0;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('repay_schedule')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding ion-text-center">
          <IonSpinner name="crescent" size="large" />
          <p>{t('loading')}</p>
        </IonContent>
      </IonPage>
    );
  }

  if (!loanInfo || schedules.length === 0) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>{t('repay_schedule')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <IonIcon icon={checkmarkCircleOutline} size="large" color="success" />
            <h2>{t('all_paid')}</h2>
            <IonText color="medium">
              <p>{t('no_overdue')}</p>
            </IonText>
            <IonButton expand="block" onClick={() => history.push('/home')}>
              {t('back')}
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const overdueSchedules = schedules.filter(s => s.isOverdue);
  const nextUnpaidSchedule = schedules.find(s => s.status !== 'paid' && !s.isOverdue);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{t('repay_schedule')}</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleRefresh}>
              <IonIcon icon={refreshOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="repay-schedule-content">
        {/* 贷款概览 */}
        <IonCard className="loan-overview-card">
          <IonCardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <IonText color="medium">
                  <small>{t('principal')}</small>
                </IonText>
                <h3 style={{ margin: '4px 0' }}>฿{loanInfo.principal.toLocaleString()}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <IonText color="medium">
                  <small>{t('total_repayment')}</small>
                </IonText>
                <h3 style={{ margin: '4px 0' }}>฿{loanInfo.total_repayment.toLocaleString()}</h3>
              </div>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <IonText color="medium">
                  <small>{t('status')}</small>
                </IonText>
                <IonText color="primary">
                  <small>{getProgress().toFixed(0)}%</small>
                </IonText>
              </div>
              <IonProgressBar value={getProgress() / 100} color="primary" />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <IonText color="success">
                {t('paid')}: ฿{getTotalPaid().toLocaleString()}
              </IonText>
              <IonText color="danger">
                {t('unpaid')}: ฿{getTotalDue().toLocaleString()}
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>

        {/* 逾期提示 */}
        {overdueSchedules.length > 0 && (
          <IonCard className="overdue-alert-card">
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IonIcon icon={alertCircleOutline} size="large" color="danger" />
                <div>
                  <IonText color="danger">
                    <strong>{t('overdue')}</strong>
                  </IonText>
                  <IonText color="medium">
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                      {overdueSchedules.length} {t('installment')} {t('overdue_days')}: {overdueSchedules[0].overdueDays}
                    </p>
                  </IonText>
                </div>
              </div>
              <IonButton 
                expand="block" 
                color="danger" 
                onClick={() => handleRepay(overdueSchedules[0])}
                style={{ marginTop: '12px' }}
              >
                {t('repay_now')}
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* 下一期还款 */}
        {nextUnpaidSchedule && !nextUnpaidSchedule.isOverdue && (
          <IonCard className="next-due-card">
            <IonCardHeader>
              <IonCardSubtitle>
                <IonIcon icon={calendarOutline} slot="start" />
                {t('next_due')}
              </IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <IonText color="medium">
                    <small>{t('due_date')}</small>
                  </IonText>
                  <h3 style={{ margin: '4px 0' }}>{formatDate(nextUnpaidSchedule.due_date, 'DD/MM/YYYY')}</h3>
                  <IonText color="primary">
                    <small>{formatCountdown(nextUnpaidSchedule.due_date)}</small>
                  </IonText>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <IonText color="medium">
                    <small>{t('amount_due')}</small>
                  </IonText>
                  <h3 style={{ margin: '4px 0' }}>฿{nextUnpaidSchedule.total_amount.toLocaleString()}</h3>
                </div>
              </div>
              <IonButton 
                expand="block" 
                onClick={() => handleRepay(nextUnpaidSchedule)}
                style={{ marginTop: '12px' }}
              >
                {t('repay_now')}
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* 提前还款试算 */}
        {loanInfo.status === 'active' && (
          <IonCard className="early-repayment-card">
            <IonCardHeader>
              <IonCardSubtitle>
                <IonIcon icon={trendingUpOutline} slot="start" />
                {t('early_repayment')}
              </IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              {earlyRepaymentAmount > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <IonText color="medium">{t('early_settlement_amount')}</IonText>
                    <IonText color="primary">
                      <strong>฿{earlyRepaymentAmount.toLocaleString()}</strong>
                    </IonText>
                  </div>
                  <IonButton 
                    expand="block" 
                    fill="outline"
                    onClick={handleEarlyRepayment}
                    style={{ marginTop: '12px' }}
                  >
                    {t('confirm_borrow')}
                  </IonButton>
                </>
              ) : (
                <IonButton 
                  expand="block" 
                  fill="outline"
                  onClick={calculateEarlyRepayment}
                  disabled={calculatingEarly}
                >
                  {calculatingEarly ? (
                    <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                  ) : (
                    <IonIcon icon={cashOutline} slot="start" />
                  )}
                  {calculatingEarly ? t('loading') : t('early_repayment_calc')}
                </IonButton>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* 还款计划列表 */}
        <IonCard className="schedule-list-card">
          <IonCardHeader>
            <IonCardSubtitle>{t('repay_schedule')}</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            {schedules.map((schedule, index) => (
              <div 
                key={schedule.id}
                className={`schedule-item ${schedule.isOverdue ? 'overdue' : ''} ${schedule.status === 'paid' ? 'paid' : ''}`}
              >
                <div className="schedule-header">
                  <div className="schedule-number">
                    {t('installment')} {schedule.installment_number} {t('of')} {schedule.total_installments}
                  </div>
                  <IonBadge color={getStatusColor(schedule.status, schedule.isOverdue)}>
                    {getStatusText(schedule.status, schedule.isOverdue)}
                  </IonBadge>
                </div>
                
                <div className="schedule-details">
                  <div className="schedule-detail-row">
                    <IonIcon icon={calendarOutline} color="medium" />
                    <IonText color="medium">
                      <small>{formatDate(schedule.due_date, 'DD/MM/YYYY')}</small>
                    </IonText>
                  </div>
                  {schedule.isOverdue && (
                    <div className="schedule-detail-row">
                      <IonIcon icon={alertCircleOutline} color="danger" />
                      <IonText color="danger">
                        <small>{schedule.overdueDays} {t('overdue_days')}</small>
                      </IonText>
                    </div>
                  )}
                </div>
                
                <div className="schedule-amount">
                  <div className="amount-label">
                    <IonText color="medium">
                      <small>{t('amount_due')}</small>
                    </IonText>
                  </div>
                  <div className="amount-value">
                    <IonText color={schedule.status === 'paid' ? 'success' : 'dark'}>
                      <strong>฿{schedule.total_amount.toLocaleString()}</strong>
                    </IonText>
                  </div>
                </div>
                
                {schedule.status !== 'paid' && (
                  <IonButton 
                    expand="block"
                    size="small"
                    onClick={() => handleRepay(schedule)}
                    color={schedule.isOverdue ? 'danger' : 'primary'}
                  >
                    {t('repay_now')}
                  </IonButton>
                )}
                
                {schedule.status === 'paid' && schedule.paid_at && (
                  <div className="paid-info" style={{ marginTop: '8px' }}>
                    <IonText color="success">
                      <small>
                        <IonIcon icon={checkmarkCircleOutline} />
                        {' '}{t('paid')}: {formatDate(schedule.paid_at, 'DD/MM/YYYY')}
                      </small>
                    </IonText>
                  </div>
                )}
              </div>
            ))}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default RepaySchedulePage;
