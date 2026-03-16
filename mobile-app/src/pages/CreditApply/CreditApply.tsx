import React, { useState } from 'react';
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
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  useIonToast,
  IonProgressBar,
} from '@ionic/react';
import {
  shieldCheckmarkOutline,
  walletOutline,
  checkmarkCircleOutline,
  documentTextOutline,
  personOutline,
  businessOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserService, CreditApplyRequest } from '../../services/user.service';
import { CreditService, CreditScoreData, CreditScoreResult } from '../../services/credit.service';
import './CreditApply.scss';

const CreditApply: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const [presentToast] = useIonToast();
  const userService = new UserService();
  const creditService = new CreditService();

  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [creditResult, setCreditResult] = useState<CreditScoreResult | null>(null);
  const [formData, setFormData] = useState<CreditApplyRequest>({
    id_card: '',
    employment_status: '',
    monthly_income: 0,
    employer_name: '',
    employer_phone: '',
    address: '',
    city: '',
    zip_code: '',
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateCredit = () => {
    setCalculating(true);
    
    // 模拟计算延迟
    setTimeout(() => {
      const creditData: CreditScoreData = {
        monthly_income: formData.monthly_income,
        employment_status: formData.employment_status,
        has_id_card: !!formData.id_card,
        has_address: !!formData.address,
        has_employer_info: !!formData.employer_name && !!formData.employer_phone,
        income_verified: false,
      };

      const result = creditService.calculateCreditScore(creditData);
      setCreditResult(result);
      setCalculating(false);
    }, 2000);
  };

  const handleSubmit = async () => {
    if (!creditResult || creditResult.grade === 'E') {
      presentToast({
        message: t('creditApply.assessmentNotPassed'),
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        history.push('/login');
        return;
      }

      const response = await userService.applyForCredit(token, formData);
      
      if (response.success) {
        presentToast({
          message: t('creditApply.submitSuccess'),
          duration: 2000,
          position: 'top',
          color: 'success',
        });
        history.push('/credit-status');
      }
    } catch (error: any) {
      presentToast({
        message: error.message || t('creditApply.submitFailed'),
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const employmentStatusMap: Record<string, string> = {
    employed_fulltime: t('profile.employmentStatuses.employed_fulltime'),
    employed_parttime: t('profile.employmentStatuses.employed_parttime'),
    self_employed: t('profile.employmentStatuses.self_employed'),
    business_owner: t('profile.employmentStatuses.business_owner'),
    freelance: t('profile.employmentStatuses.freelance'),
  };

  const cityMap: Record<string, string> = {
    bangkok: t('profile.cities.bangkok'),
    chiangmai: t('profile.cities.chiangmai'),
    phuket: t('profile.cities.phuket'),
    pattaya: t('profile.cities.pattaya'),
    khonkaen: t('profile.cities.khonkaen'),
  };

  if (calculating) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>{t('creditApply.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding ion-text-center credit-calculate">
          <IonSpinner name="crescent" size="large" />
          <h2>{t('creditApply.assessing')}</h2>
          <IonText color="medium">
            <p>{t('creditApply.assessingDesc')}</p>
          </IonText>
          <IonProgressBar indeterminate color="primary" />
        </IonContent>
      </IonPage>
    );
  }

  if (creditResult) {
    const gradeInfo = creditService.getGradeDescription(creditResult.grade);
    
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>{t('creditApply.resultTitle')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="credit-result">
          <div className="result-header">
            <div className="grade-circle" style={{ borderColor: gradeInfo.color }}>
              <span className="grade-letter" style={{ color: gradeInfo.color }}>
                {creditResult.grade}
              </span>
            </div>
            <h2>{gradeInfo.title}</h2>
            <IonText color="medium">
              <p>{gradeInfo.description}</p>
            </IonText>
          </div>

          <IonCard className="score-card">
            <IonCardHeader>
              <IonCardSubtitle>{t('creditStatus.creditScore')}</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="score-display">
                <span className="score-number">{creditResult.score}</span>
                <span className="score-max">/ 1000</span>
              </div>
              <IonProgressBar value={creditResult.score / 1000} color="primary" />
            </IonCardContent>
          </IonCard>

          <IonCard className="limit-card">
            <IonCardContent>
              <div className="limit-info">
                <IonIcon icon={walletOutline} size="large" color="primary" />
                <div className="limit-details">
                  <IonText color="medium">{t('creditStatus.available')}</IonText>
                  <h3>฿{creditResult.credit_limit.toLocaleString()}</h3>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard className="breakdown-card">
            <IonCardHeader>
              <IonCardSubtitle>{t('creditStatus.tipsTitle')}</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="breakdown-item">
                <span>{t('creditApply.calculating')}</span>
                <span>+{creditResult.breakdown.base_score}</span>
              </div>
              <div className="breakdown-item">
                <span>{t('profile.monthlyIncome')}</span>
                <span>+{creditResult.breakdown.income_score}</span>
              </div>
              <div className="breakdown-item">
                <span>{t('profile.employmentStatus')}</span>
                <span>+{creditResult.breakdown.employment_score}</span>
              </div>
              <div className="breakdown-item">
                <span>{t('creditApply.identityInfo')}</span>
                <span>+{creditResult.breakdown.completeness_score}</span>
              </div>
              <div className="breakdown-item">
                <span>{t('common.info')}</span>
                <span>+{creditResult.breakdown.other_score}</span>
              </div>
            </IonCardContent>
          </IonCard>

          <div className="result-actions">
            {creditResult.grade !== 'E' ? (
              <IonButton
                expand="block"
                onClick={handleSubmit}
                disabled={loading}
                className="submit-credit-btn"
              >
                {loading ? <IonSpinner name="crescent" /> : t('creditApply.confirmApply')}
              </IonButton>
            ) : (
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => history.push('/profile')}
                color="medium"
              >
                {t('creditApply.retryAfterImprove')}
              </IonButton>
            )}
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>{t('creditApply.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="credit-apply">
        <div className="apply-header">
          <IonIcon icon={shieldCheckmarkOutline} size="large" color="primary" />
          <h2>{t('creditApply.applyCredit')}</h2>
          <IonText color="medium">
            <p>{t('creditApply.fillInfoForAssessment')}</p>
          </IonText>
        </div>

        <IonCard className="apply-form-card">
          <IonCardHeader>
            <IonCardSubtitle>
              <IonIcon icon={documentTextOutline} slot="start" />
              {t('creditApply.identityInfo')}
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="form-item">
              <IonText color="medium">{t('creditApply.idCard')}</IonText>
              <div className="form-value">{formData.id_card || t('creditApply.notFilled')}</div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard className="apply-form-card">
          <IonCardHeader>
            <IonCardSubtitle>
              <IonIcon icon={personOutline} slot="start" />
              {t('creditApply.contactInfo')}
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="form-item">
              <IonText color="medium">{t('creditApply.address')}</IonText>
              <div className="form-value">{formData.address || t('creditApply.notFilled')}</div>
            </div>
            <div className="form-item">
              <IonText color="medium">{t('creditApply.city')}</IonText>
              <div className="form-value">{cityMap[formData.city] || t('creditApply.notFilled')}</div>
            </div>
            <div className="form-item">
              <IonText color="medium">{t('creditApply.zipCode')}</IonText>
              <div className="form-value">{formData.zip_code || t('creditApply.notFilled')}</div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard className="apply-form-card">
          <IonCardHeader>
            <IonCardSubtitle>
              <IonIcon icon={businessOutline} slot="start" />
              {t('creditApply.workInfo')}
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="form-item">
              <IonText color="medium">{t('profile.employmentStatus')}</IonText>
              <div className="form-value">
                {employmentStatusMap[formData.employment_status] || t('creditApply.notFilled')}
              </div>
            </div>
            <div className="form-item">
              <IonText color="medium">{t('profile.monthlyIncome')}</IonText>
              <div className="form-value">฿{formData.monthly_income?.toLocaleString() || 0}</div>
            </div>
            <div className="form-item">
              <IonText color="medium">{t('profile.employerName')}</IonText>
              <div className="form-value">{formData.employer_name || t('creditApply.notFilled')}</div>
            </div>
            <div className="form-item">
              <IonText color="medium">{t('profile.employerPhone')}</IonText>
              <div className="form-value">{formData.employer_phone || t('creditApply.notFilled')}</div>
            </div>
          </IonCardContent>
        </IonCard>

        <div className="apply-actions">
          <IonButton expand="block" onClick={calculateCredit} className="calculate-btn">
            {t('creditApply.startAssessment')}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreditApply;
