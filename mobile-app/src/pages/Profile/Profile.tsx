import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonPage,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonProgressBar,
  IonText,
  useIonToast,
  IonSpinner,
} from '@ionic/react';
import {
  personOutline,
  mailOutline,
  phonePortraitOutline,
  checkmarkCircleOutline,
  chevronForward,
  chevronBack,
  walletOutline,
  documentTextOutline,
  businessOutline,
  locationOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserService, UserProfile } from '../../services/user.service';
import LanguageSelector from '../../components/LanguageSelector';
import './Profile.scss';

const Profile: React.FC = () => {
  const history = useHistory();
  const { t, i18n } = useTranslation();
  const [presentToast] = useIonToast();
  const userService = new UserService();

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  const steps = [
    { title: t('profile.step1'), icon: personOutline },
    { title: t('profile.step2'), icon: locationOutline },
    { title: t('profile.step3'), icon: businessOutline },
    { title: t('profile.step4'), icon: walletOutline },
  ];

  useEffect(() => {
    loadUserProfile();
  }, []);

  // 当语言改变时，更新步骤标题
  useEffect(() => {
    const handleLanguageChange = () => {
      // 强制重新渲染
      setCurrentStep(prev => prev);
    };
    
    // 监听语言变化
    const unsubscribe = () => {
      // 清理函数
    };
    
    return unsubscribe;
  }, [i18n.language]);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        history.push('/login');
        return;
      }

      const response = await userService.getProfile(token);
      if (response.success) {
        setUser(response.user);
        setFormData(response.user);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // 基本信息
        if (!formData.name || !formData.email || !formData.phone) {
          presentToast({
            message: t('profile.fillBasicInfo'),
            duration: 2000,
            position: 'top',
            color: 'warning',
          });
          return false;
        }
        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email || '')) {
          presentToast({
            message: t('profile.validEmail'),
            duration: 2000,
            position: 'top',
            color: 'warning',
          });
          return false;
        }
        // 电话格式验证（泰国）
        const phoneRegex = /^0[0-9]{9}$/;
        if (!phoneRegex.test(formData.phone || '')) {
          presentToast({
            message: t('profile.validPhone'),
            duration: 2000,
            position: 'top',
            color: 'warning',
          });
          return false;
        }
        break;
      case 1: // 联系信息
        if (!formData.address || !formData.city || !formData.zip_code) {
          presentToast({
            message: t('profile.fillContactInfo'),
            duration: 2000,
            position: 'top',
            color: 'warning',
          });
          return false;
        }
        break;
      case 2: // 工作信息
        if (!formData.employment_status || !formData.monthly_income || !formData.employer_name) {
          presentToast({
            message: t('profile.fillWorkInfo'),
            duration: 2000,
            position: 'top',
            color: 'warning',
          });
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await submitProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      history.push('/home');
    }
  };

  const submitProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        history.push('/login');
        return;
      }

      const response = await userService.updateProfile(token, formData);
      if (response.success) {
        setUser(response.user);
        presentToast({
          message: t('profile.updateSuccess'),
          duration: 2000,
          position: 'top',
          color: 'success',
        });
        
        // 如果信用评估未完成，跳转到信用申请页面
        if (!response.user.credit_score) {
          history.push('/credit-apply');
        } else {
          history.push('/credit-status');
        }
      }
    } catch (error: any) {
      presentToast({
        message: error.message || t('profile.updateFailed'),
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {steps.map((step, index) => (
        <div key={index} className={`step-item ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}>
          <div className="step-icon">
            {index < currentStep ? (
              <IonIcon icon={checkmarkCircleOutline} />
            ) : (
              <IonIcon icon={step.icon} />
            )}
          </div>
          <div className="step-label">{step.title}</div>
        </div>
      ))}
      <div className="step-progress">
        <IonProgressBar value={(currentStep + 1) / steps.length} color="primary" />
      </div>
    </div>
  );

  const renderBasicInfo = () => (
    <IonCard className="profile-form-card">
      <IonCardContent>
        <IonItem>
          <IonIcon slot="start" icon={personOutline} color="primary" />
          <IonLabel position="stacked">{t('profile.name')}</IonLabel>
          <IonInput
            value={formData.name || ''}
            onIonChange={(e) => updateFormData('name', e.detail.value)}
            placeholder={t('profile.namePlaceholder')}
          />
        </IonItem>
        <IonItem>
          <IonIcon slot="start" icon={mailOutline} color="primary" />
          <IonLabel position="stacked">{t('profile.email')}</IonLabel>
          <IonInput
            type="email"
            value={formData.email || ''}
            onIonChange={(e) => updateFormData('email', e.detail.value)}
            placeholder={t('profile.emailPlaceholder')}
          />
        </IonItem>
        <IonItem>
          <IonIcon slot="start" icon={phonePortraitOutline} color="primary" />
          <IonLabel position="stacked">{t('profile.phone')}</IonLabel>
          <IonInput
            type="tel"
            value={formData.phone || ''}
            onIonChange={(e) => updateFormData('phone', e.detail.value)}
            placeholder={t('profile.phonePlaceholder')}
          />
        </IonItem>
      </IonCardContent>
    </IonCard>
  );

  const renderContactInfo = () => (
    <IonCard className="profile-form-card">
      <IonCardContent>
        <IonItem>
          <IonIcon slot="start" icon={documentTextOutline} color="primary" />
          <IonLabel position="stacked">{t('profile.idCard')}</IonLabel>
          <IonInput
            value={formData.id_card || ''}
            onIonChange={(e) => updateFormData('id_card', e.detail.value)}
            placeholder={t('profile.idCardPlaceholder')}
            maxlength={13}
          />
        </IonItem>
        <IonItem>
          <IonIcon slot="start" icon={locationOutline} color="primary" />
          <IonLabel position="stacked">{t('profile.address')}</IonLabel>
          <IonInput
            value={formData.address || ''}
            onIonChange={(e) => updateFormData('address', e.detail.value)}
            placeholder={t('profile.addressPlaceholder')}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">{t('profile.city')}</IonLabel>
          <IonSelect
            value={formData.city || ''}
            onIonChange={(e) => updateFormData('city', e.detail.value)}
            placeholder={t('profile.cityPlaceholder')}
          >
            <IonSelectOption value="bangkok">{t('profile.cities.bangkok')}</IonSelectOption>
            <IonSelectOption value="chiangmai">{t('profile.cities.chiangmai')}</IonSelectOption>
            <IonSelectOption value="phuket">{t('profile.cities.phuket')}</IonSelectOption>
            <IonSelectOption value="pattaya">{t('profile.cities.pattaya')}</IonSelectOption>
            <IonSelectOption value="khonkaen">{t('profile.cities.khonkaen')}</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">{t('profile.zipCode')}</IonLabel>
          <IonInput
            type="text"
            value={formData.zip_code || ''}
            onIonChange={(e) => updateFormData('zip_code', e.detail.value)}
            placeholder={t('profile.zipCodePlaceholder')}
            maxlength={5}
          />
        </IonItem>
      </IonCardContent>
    </IonCard>
  );

  const renderWorkInfo = () => (
    <IonCard className="profile-form-card">
      <IonCardContent>
        <IonItem>
          <IonLabel position="stacked">{t('profile.employmentStatus')}</IonLabel>
          <IonSelect
            value={formData.employment_status || ''}
            onIonChange={(e) => updateFormData('employment_status', e.detail.value)}
            placeholder={t('profile.employmentStatusPlaceholder')}
          >
            <IonSelectOption value="employed_fulltime">{t('profile.employmentStatuses.employed_fulltime')}</IonSelectOption>
            <IonSelectOption value="employed_parttime">{t('profile.employmentStatuses.employed_parttime')}</IonSelectOption>
            <IonSelectOption value="self_employed">{t('profile.employmentStatuses.self_employed')}</IonSelectOption>
            <IonSelectOption value="business_owner">{t('profile.employmentStatuses.business_owner')}</IonSelectOption>
            <IonSelectOption value="freelance">{t('profile.employmentStatuses.freelance')}</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonIcon slot="start" icon={walletOutline} color="primary" />
          <IonLabel position="stacked">{t('profile.monthlyIncome')}</IonLabel>
          <IonInput
            type="number"
            value={formData.monthly_income || ''}
            onIonChange={(e) => updateFormData('monthly_income', Number(e.detail.value))}
            placeholder={t('profile.monthlyIncomePlaceholder')}
          />
        </IonItem>
        <IonItem>
          <IonIcon slot="start" icon={businessOutline} color="primary" />
          <IonLabel position="stacked">{t('profile.employerName')}</IonLabel>
          <IonInput
            value={formData.employer_name || ''}
            onIonChange={(e) => updateFormData('employer_name', e.detail.value)}
            placeholder={t('profile.employerNamePlaceholder')}
          />
        </IonItem>
        <IonItem>
          <IonIcon slot="start" icon={phonePortraitOutline} color="primary" />
          <IonLabel position="stacked">{t('profile.employerPhone')}</IonLabel>
          <IonInput
            type="tel"
            value={formData.employer_phone || ''}
            onIonChange={(e) => updateFormData('employer_phone', e.detail.value)}
            placeholder={t('profile.employerPhonePlaceholder')}
          />
        </IonItem>
      </IonCardContent>
    </IonCard>
  );

  const renderCreditPreview = () => {
    if (!formData.employment_status || !formData.monthly_income) {
      return (
        <IonCard className="profile-form-card">
          <IonCardContent>
            <IonText color="medium">
              <p>{t('profile.fillWorkInfoFirst')}</p>
            </IonText>
          </IonCardContent>
        </IonCard>
      );
    }

    return (
      <IonCard className="profile-form-card">
        <IonCardContent>
          <h3>{t('profile.creditPreview')}</h3>
          <p>{t('profile.creditPreviewDesc')}</p>
          <IonItem>
            <IonLabel>{t('profile.monthlyIncome')}</IonLabel>
            <IonText color="primary">฿{formData.monthly_income?.toLocaleString()}</IonText>
          </IonItem>
          <IonItem>
            <IonLabel>{t('profile.employmentStatus')}</IonLabel>
            <IonText>{formData.employment_status}</IonText>
          </IonItem>
        </IonCardContent>
      </IonCard>
    );
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('profile.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{steps[currentStep].title}</IonTitle>
          {currentStep === 0 && (
            <IonButtons slot="end">
              <LanguageSelector />
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="profile-wizard">
          {renderStepIndicator()}
          
          <div className="profile-form-content">
            {currentStep === 0 && renderBasicInfo()}
            {currentStep === 1 && renderContactInfo()}
            {currentStep === 2 && renderWorkInfo()}
            {currentStep === 3 && renderCreditPreview()}
          </div>

          <div className="profile-actions">
            <IonButton expand="block" fill="outline" onClick={handleBack} className="back-btn">
              <IonIcon slot="start" icon={chevronBack} />
              {currentStep === 0 ? t('profile.cancel') : t('profile.back')}
            </IonButton>
            <IonButton 
              expand="block" 
              onClick={handleNext} 
              className="next-btn"
              disabled={loading}
            >
              {currentStep === steps.length - 1 ? (
                <>
                  {loading ? <IonSpinner name="crescent" /> : t('profile.submit')}
                </>
              ) : (
                <>
                  {t('profile.next')}
                  <IonIcon slot="end" icon={chevronForward} />
                </>
              )}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
