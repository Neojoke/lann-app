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
import { UserService, CreditApplyRequest } from '../../services/user.service';
import { CreditService, CreditScoreData, CreditScoreResult } from '../../services/credit.service';
import './CreditApply.scss';

const CreditApply: React.FC = () => {
  const history = useHistory();
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
        message: '信用评估未通过，无法提交申请',
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
          message: '信用申请成功',
          duration: 2000,
          position: 'top',
          color: 'success',
        });
        history.push('/credit-status');
      }
    } catch (error: any) {
      presentToast({
        message: error.message || '申请失败',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const employmentStatusMap: Record<string, string> = {
    employed_fulltime: '全职员工',
    employed_parttime: '兼职员工',
    self_employed: '自雇人士',
    business_owner: '企业主',
    freelance: '自由职业',
  };

  const cityMap: Record<string, string> = {
    bangkok: '曼谷',
    chiangmai: '清迈',
    phuket: '普吉',
    pattaya: '芭堤雅',
    khonkaen: '孔敬',
  };

  if (calculating) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>信用评估</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding ion-text-center credit-calculate">
          <IonSpinner name="crescent" size="large" />
          <h2>正在评估您的信用...</h2>
          <IonText color="medium">
            <p>请稍候，我们正在分析您的信息</p>
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
            <IonTitle>评估结果</IonTitle>
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
              <IonCardSubtitle>信用评分</IonCardSubtitle>
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
                  <IonText color="medium">可用额度</IonText>
                  <h3>฿{creditResult.credit_limit.toLocaleString()}</h3>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard className="breakdown-card">
            <IonCardHeader>
              <IonCardSubtitle>评分详情</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="breakdown-item">
                <span>基础分</span>
                <span>+{creditResult.breakdown.base_score}</span>
              </div>
              <div className="breakdown-item">
                <span>收入评分</span>
                <span>+{creditResult.breakdown.income_score}</span>
              </div>
              <div className="breakdown-item">
                <span>就业评分</span>
                <span>+{creditResult.breakdown.employment_score}</span>
              </div>
              <div className="breakdown-item">
                <span>信息完整度</span>
                <span>+{creditResult.breakdown.completeness_score}</span>
              </div>
              <div className="breakdown-item">
                <span>其他因素</span>
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
                {loading ? <IonSpinner name="crescent" /> : '确认申请额度'}
              </IonButton>
            ) : (
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => history.push('/profile')}
                color="medium"
              >
                完善信息后重试
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
          <IonTitle>信用评估申请</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="credit-apply">
        <div className="apply-header">
          <IonIcon icon={shieldCheckmarkOutline} size="large" color="primary" />
          <h2>申请信用额度</h2>
          <IonText color="medium">
            <p>填写以下信息以获取您的信用评估</p>
          </IonText>
        </div>

        <IonCard className="apply-form-card">
          <IonCardHeader>
            <IonCardSubtitle>
              <IonIcon icon={documentTextOutline} slot="start" />
              身份信息
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="form-item">
              <IonText color="medium">身份证号码</IonText>
              <div className="form-value">{formData.id_card || '未填写'}</div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard className="apply-form-card">
          <IonCardHeader>
            <IonCardSubtitle>
              <IonIcon icon={personOutline} slot="start" />
              联系信息
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="form-item">
              <IonText color="medium">地址</IonText>
              <div className="form-value">{formData.address || '未填写'}</div>
            </div>
            <div className="form-item">
              <IonText color="medium">城市</IonText>
              <div className="form-value">{cityMap[formData.city] || '未填写'}</div>
            </div>
            <div className="form-item">
              <IonText color="medium">邮政编码</IonText>
              <div className="form-value">{formData.zip_code || '未填写'}</div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard className="apply-form-card">
          <IonCardHeader>
            <IonCardSubtitle>
              <IonIcon icon={businessOutline} slot="start" />
              工作信息
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="form-item">
              <IonText color="medium">就业状态</IonText>
              <div className="form-value">
                {employmentStatusMap[formData.employment_status] || '未填写'}
              </div>
            </div>
            <div className="form-item">
              <IonText color="medium">月收入</IonText>
              <div className="form-value">฿{formData.monthly_income?.toLocaleString() || 0}</div>
            </div>
            <div className="form-item">
              <IonText color="medium">公司名称</IonText>
              <div className="form-value">{formData.employer_name || '未填写'}</div>
            </div>
            <div className="form-item">
              <IonText color="medium">公司电话</IonText>
              <div className="form-value">{formData.employer_phone || '未填写'}</div>
            </div>
          </IonCardContent>
        </IonCard>

        <div className="apply-actions">
          <IonButton expand="block" onClick={calculateCredit} className="calculate-btn">
            开始信用评估
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreditApply;
