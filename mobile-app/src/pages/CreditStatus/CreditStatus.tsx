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
  IonProgressBar,
  IonButton,
  useIonToast,
} from '@ionic/react';
import {
  walletOutline,
  shieldCheckmarkOutline,
  trendingUpOutline,
  trendingDownOutline,
  timeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  refreshOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserService, CreditStatusResponse } from '../../services/user.service';
import { CreditService } from '../../services/credit.service';
import './CreditStatus.scss';

const CreditStatus: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const [presentToast] = useIonToast();
  const userService = new UserService();
  const creditService = new CreditService();

  const [loading, setLoading] = useState(true);
  const [creditStatus, setCreditStatus] = useState<CreditStatusResponse | null>(null);
  const [grade, setGrade] = useState<string>('');

  useEffect(() => {
    loadCreditStatus();
  }, []);

  const loadCreditStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        history.push('/login');
        return;
      }

      const response = await userService.getCreditStatus(token);
      if (response.success) {
        setCreditStatus(response);
        
        // 根据信用评分计算等级
        const score = response.credit_score;
        if (score >= 750) setGrade('A');
        else if (score >= 650) setGrade('B');
        else if (score >= 550) setGrade('C');
        else if (score >= 450) setGrade('D');
        else setGrade('E');
      }
    } catch (error: any) {
      presentToast({
        message: error.message || t('creditStatus.loadFailed'),
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
    loadCreditStatus();
  };

  const handleBorrow = () => {
    if (!creditStatus || creditStatus.status !== 'approved') {
      presentToast({
        message: t('creditStatus.assessFirst'),
        duration: 2000,
        position: 'top',
        color: 'warning',
      });
      return;
    }
    history.push('/borrow');
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>{t('creditStatus.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding ion-text-center">
          <IonSpinner name="crescent" size="large" />
          <p>{t('creditStatus.loading')}</p>
        </IonContent>
      </IonPage>
    );
  }

  if (!creditStatus) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>{t('creditStatus.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding credit-no-data">
          <IonIcon icon={alertCircleOutline} size="large" color="medium" />
          <h2>{t('creditStatus.noCreditRecord')}</h2>
          <IonText color="medium">
            <p>{t('creditStatus.noCreditRecordDesc')}</p>
          </IonText>
          <IonButton expand="block" onClick={() => history.push('/profile')}>
            {t('creditStatus.goToProfile')}
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  const gradeInfo = creditService.getGradeDescription(grade);
  const utilizationRate = creditStatus.credit_limit > 0 
    ? (creditStatus.credit_used / creditStatus.credit_limit) * 100 
    : 0;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{t('creditStatus.title')}</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleRefresh}>
              <IonIcon icon={refreshOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="credit-status">
        {/* 信用等级卡片 */}
        <div className="grade-header">
          <div className="grade-circle" style={{ borderColor: gradeInfo.color }}>
            <span className="grade-letter" style={{ color: gradeInfo.color }}>
              {grade}
            </span>
          </div>
          <h2>{gradeInfo.title}</h2>
          <div className="status-badge" data-status={creditStatus.status}>
            {creditStatus.status === 'approved' ? (
              <>
                <IonIcon icon={checkmarkCircleOutline} />
                <span>{t('creditStatus.approved')}</span>
              </>
            ) : creditStatus.status === 'pending' ? (
              <>
                <IonIcon icon={timeOutline} />
                <span>{t('creditStatus.pending')}</span>
              </>
            ) : (
              <>
                <IonIcon icon={alertCircleOutline} />
                <span>{t('creditStatus.rejected')}</span>
              </>
            )}
          </div>
        </div>

        {/* 信用评分 */}
        <IonCard className="score-card">
          <IonCardContent>
            <div className="score-header">
              <IonIcon icon={shieldCheckmarkOutline} color="primary" />
              <IonText color="medium">{t('creditStatus.creditScore')}</IonText>
            </div>
            <div className="score-display">
              <span className="score-number">{creditStatus.credit_score}</span>
              <span className="score-max">/ 1000</span>
            </div>
            <IonProgressBar value={creditStatus.credit_score / 1000} color="primary" />
            <div className="score-tips">
              <IonText color="medium">
                <small>{gradeInfo.description}</small>
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>

        {/* 额度信息 */}
        <IonCard className="limit-card">
          <IonCardHeader>
            <IonCardSubtitle>
              <IonIcon icon={walletOutline} slot="start" />
              {t('creditStatus.limitInfo')}
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="limit-grid">
              <div className="limit-item">
                <IonText color="medium">{t('creditStatus.totalLimit')}</IonText>
                <h3>฿{creditStatus.credit_limit.toLocaleString()}</h3>
              </div>
              <div className="limit-item">
                <IonText color="medium">{t('creditStatus.used')}</IonText>
                <h3 className={creditStatus.credit_used > 0 ? 'used' : ''}>
                  ฿{creditStatus.credit_used.toLocaleString()}
                </h3>
              </div>
              <div className="limit-item">
                <IonText color="medium">{t('creditStatus.available')}</IonText>
                <h3 className="available">฿{creditStatus.credit_available.toLocaleString()}</h3>
              </div>
            </div>
            
            <div className="utilization-section">
              <div className="utilization-header">
                <IonText color="medium">{t('creditStatus.utilizationRate')}</IonText>
                <IonText color={utilizationRate > 70 ? 'danger' : 'success'}>
                  {utilizationRate.toFixed(1)}%
                </IonText>
              </div>
              <IonProgressBar 
                value={utilizationRate / 100} 
                color={utilizationRate > 70 ? 'danger' : 'success'} 
              />
              {utilizationRate > 70 && (
                <IonText color="danger">
                  <small>{t('creditStatus.highUtilization')}</small>
                </IonText>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* 信用建议 */}
        <IonCard className="tips-card">
          <IonCardHeader>
            <IonCardSubtitle>
              <IonIcon icon={trendingUpOutline} slot="start" />
              {t('creditStatus.tipsTitle')}
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="tip-item">
              <IonIcon icon={checkmarkCircleOutline} color="success" />
              <IonText>{t('creditStatus.tip1')}</IonText>
            </div>
            <div className="tip-item">
              <IonIcon icon={checkmarkCircleOutline} color="success" />
              <IonText>{t('creditStatus.tip2')}</IonText>
            </div>
            <div className="tip-item">
              <IonIcon icon={checkmarkCircleOutline} color="success" />
              <IonText>{t('creditStatus.tip3')}</IonText>
            </div>
            <div className="tip-item">
              <IonIcon icon={checkmarkCircleOutline} color="success" />
              <IonText>{t('creditStatus.tip4')}</IonText>
            </div>
          </IonCardContent>
        </IonCard>

        {/* 操作按钮 */}
        <div className="status-actions">
          <IonButton 
            expand="block" 
            onClick={handleBorrow}
            disabled={creditStatus.status !== 'approved' || creditStatus.credit_available <= 0}
            className="borrow-btn"
          >
            <IonIcon slot="start" icon={walletOutline} />
            {t('creditStatus.borrowNow')}
          </IonButton>
          
          {creditStatus.status !== 'approved' && (
            <IonButton 
              expand="block" 
              fill="outline"
              onClick={() => history.push('/credit-apply')}
              color="primary"
            >
              {t('creditStatus.reassess')}
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreditStatus;
