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
  IonItem,
  IonIcon,
  IonLabel,
  IonRange,
  IonButton,
  useIonToast,
} from '@ionic/react';
import { documentTextOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { LoanService } from '../../services/loan.service';

const BorrowPage: React.FC = () => {
  const history = useHistory();
  const [amount, setAmount] = useState(5000);
  const [selectedDays, setSelectedDays] = useState(14);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [presentToast] = useIonToast();

  const loanService = new LoanService();

  const durationOptions = [7, 14, 21, 30];
  const minAmount = 1000;
  const maxAmount = 50000;

  const { interest, totalRepayment } = loanService.calculateInterest(amount, selectedDays);

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      presentToast({
        message: 'กรุณายอมรับข้อตกลง',
        duration: 2000,
        position: 'top',
        color: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        presentToast({
          message: 'กรุณาเข้าสู่ระบบ',
          duration: 2000,
          position: 'top',
          color: 'danger',
        });
        history.push('/login');
        return;
      }

      const response = await loanService.createLoan(token, amount, selectedDays);
      
      if (response.success) {
        presentToast({
          message: 'กู้เงินสำเร็จ',
          duration: 2000,
          position: 'top',
          color: 'success',
        });
        history.push('/home');
      }
    } catch (error) {
      presentToast({
        message: 'กู้เงินล้มเหลว',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>กู้เงิน</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="borrow-content">
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonTitle size="large">กู้เงิน</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="borrow-container">
          {/* 借款金额 */}
          <section className="amount-section">
            <h2>จำนวนเงิน</h2>
            <div className="amount-display">
              <span className="currency">฿</span>
              <span className="amount">{amount.toLocaleString()}</span>
            </div>
            <IonRange
              min={minAmount}
              max={maxAmount}
              step={1000}
              value={amount}
              onIonChange={(e) => setAmount(Number(e.detail.value))}
              color="primary"
            >
              <span slot="start">฿{minAmount.toLocaleString()}</span>
              <span slot="end">฿{maxAmount.toLocaleString()}</span>
            </IonRange>
          </section>

          {/* 借款期限 */}
          <section className="duration-section">
            <h2>ระยะเวลา</h2>
            <div className="duration-options">
              {durationOptions.map((days) => (
                <IonCard
                  key={days}
                  className={`duration-card ${selectedDays === days ? 'selected' : ''}`}
                  onClick={() => setSelectedDays(days)}
                >
                  <IonCardContent>
                    <div className="duration-content">
                      <span className="duration-days">{days}</span>
                      <span className="duration-label">วัน</span>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          </section>

          {/* 还款详情 */}
          <section className="repayment-section">
            <IonCard className="repayment-card">
              <IonCardHeader>
                <IonCardSubtitle>ยอดชำระรวม</IonCardSubtitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="repayment-details">
                  <div className="detail-row">
                    <span>เงินต้น</span>
                    <span>฿{amount.toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span>ดอกเบี้ย (1%/วัน)</span>
                    <span>฿{interest.toFixed(2)}</span>
                  </div>
                  <div className="detail-row total">
                    <span>ยอดชำระรวม</span>
                    <span>฿{totalRepayment.toFixed(2)}</span>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </section>

          {/* 条款同意 */}
          <section className="terms-section">
            <IonItem>
              <IonIcon icon={documentTextOutline} slot="start" />
              <IonLabel>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                {' '}ยอมรับข้อตกลงและเงื่อนไข
              </IonLabel>
            </IonItem>
          </section>

          {/* 提交按钮 */}
          <section className="action-section">
            <IonButton
              expand="block"
              className="submit-btn"
              onClick={handleSubmit}
              disabled={!agreedToTerms || loading}
            >
              {loading ? 'กำลังดำเนินการ...' : 'ยืนยันการกู้'}
            </IonButton>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BorrowPage;
