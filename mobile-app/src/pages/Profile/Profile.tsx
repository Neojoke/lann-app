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
import { UserService, UserProfile } from '../../services/user.service';
import './Profile.scss';

const Profile: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  const userService = new UserService();

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  const steps = [
    { title: '基本信息', icon: personOutline },
    { title: '联系信息', icon: locationOutline },
    { title: '工作信息', icon: businessOutline },
    { title: '信用评估', icon: walletOutline },
  ];

  useEffect(() => {
    loadUserProfile();
  }, []);

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
            message: '请填写完整基本信息',
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
            message: '请输入有效的邮箱地址',
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
            message: '请输入有效的电话号码（10 位数字）',
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
            message: '请填写完整联系信息',
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
            message: '请填写完整工作信息',
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
          message: '信息更新成功',
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
        message: error.message || '更新失败',
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
          <IonLabel position="stacked">姓名</IonLabel>
          <IonInput
            value={formData.name || ''}
            onIonChange={(e) => updateFormData('name', e.detail.value)}
            placeholder="请输入姓名"
          />
        </IonItem>
        <IonItem>
          <IonIcon slot="start" icon={mailOutline} color="primary" />
          <IonLabel position="stacked">邮箱</IonLabel>
          <IonInput
            type="email"
            value={formData.email || ''}
            onIonChange={(e) => updateFormData('email', e.detail.value)}
            placeholder="example@email.com"
          />
        </IonItem>
        <IonItem>
          <IonIcon slot="start" icon={phonePortraitOutline} color="primary" />
          <IonLabel position="stacked">电话</IonLabel>
          <IonInput
            type="tel"
            value={formData.phone || ''}
            onIonChange={(e) => updateFormData('phone', e.detail.value)}
            placeholder="0123456789"
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
          <IonLabel position="stacked">身份证号</IonLabel>
          <IonInput
            value={formData.id_card || ''}
            onIonChange={(e) => updateFormData('id_card', e.detail.value)}
            placeholder="13 位身份证号码"
            maxlength={13}
          />
        </IonItem>
        <IonItem>
          <IonIcon slot="start" icon={locationOutline} color="primary" />
          <IonLabel position="stacked">详细地址</IonLabel>
          <IonInput
            value={formData.address || ''}
            onIonChange={(e) => updateFormData('address', e.detail.value)}
            placeholder="街道地址"
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">城市</IonLabel>
          <IonSelect
            value={formData.city || ''}
            onIonChange={(e) => updateFormData('city', e.detail.value)}
            placeholder="选择城市"
          >
            <IonSelectOption value="bangkok">曼谷 (Bangkok)</IonSelectOption>
            <IonSelectOption value="chiangmai">清迈 (Chiang Mai)</IonSelectOption>
            <IonSelectOption value="phuket">普吉 (Phuket)</IonSelectOption>
            <IonSelectOption value="pattaya">芭堤雅 (Pattaya)</IonSelectOption>
            <IonSelectOption value="khonkaen">孔敬 (Khon Kaen)</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">邮政编码</IonLabel>
          <IonInput
            type="text"
            value={formData.zip_code || ''}
            onIonChange={(e) => updateFormData('zip_code', e.detail.value)}
            placeholder="邮政编码"
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
          <IonLabel position="stacked">就业状态</IonLabel>
          <IonSelect
            value={formData.employment_status || ''}
            onIonChange={(e) => updateFormData('employment_status', e.detail.value)}
            placeholder="选择就业状态"
          >
            <IonSelectOption value="employed_fulltime">全职员工</IonSelectOption>
            <IonSelectOption value="employed_parttime">兼职员工</IonSelectOption>
            <IonSelectOption value="self_employed">自雇人士</IonSelectOption>
            <IonSelectOption value="business_owner">企业主</IonSelectOption>
            <IonSelectOption value="freelance">自由职业</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonIcon slot="start" icon={walletOutline} color="primary" />
          <IonLabel position="stacked">月收入 (฿)</IonLabel>
          <IonInput
            type="number"
            value={formData.monthly_income || ''}
            onIonChange={(e) => updateFormData('monthly_income', Number(e.detail.value))}
            placeholder="月收入"
          />
        </IonItem>
        <IonItem>
          <IonIcon slot="start" icon={businessOutline} color="primary" />
          <IonLabel position="stacked">公司名称</IonLabel>
          <IonInput
            value={formData.employer_name || ''}
            onIonChange={(e) => updateFormData('employer_name', e.detail.value)}
            placeholder="公司名称"
          />
        </IonItem>
        <IonItem>
          <IonIcon slot="start" icon={phonePortraitOutline} color="primary" />
          <IonLabel position="stacked">公司电话</IonLabel>
          <IonInput
            type="tel"
            value={formData.employer_phone || ''}
            onIonChange={(e) => updateFormData('employer_phone', e.detail.value)}
            placeholder="公司电话"
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
              <p>请先填写工作信息以进行信用评估</p>
            </IonText>
          </IonCardContent>
        </IonCard>
      );
    }

    // 这里可以显示预估的信用评分
    return (
      <IonCard className="profile-form-card">
        <IonCardContent>
          <h3>信用评估预览</h3>
          <p>根据您的信息，系统将自动评估您的信用等级和额度</p>
          <IonItem>
            <IonLabel>月收入</IonLabel>
            <IonText color="primary">฿{formData.monthly_income?.toLocaleString()}</IonText>
          </IonItem>
          <IonItem>
            <IonLabel>就业状态</IonLabel>
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
            <IonTitle>个人资料</IonTitle>
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
              {currentStep === 0 ? '取消' : '上一步'}
            </IonButton>
            <IonButton 
              expand="block" 
              onClick={handleNext} 
              className="next-btn"
              disabled={loading}
            >
              {currentStep === steps.length - 1 ? (
                <>
                  {loading ? <IonSpinner name="crescent" /> : '提交'}
                </>
              ) : (
                <>
                  下一步
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
