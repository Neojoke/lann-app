import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonPage,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonIcon,
  IonText,
} from '@ionic/react';
import { arrowBackOutline, mailOutline, lockClosedOutline, personOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Register.scss';

const Register: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: CustomEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log('Register:', formData);
    history.push('/profile');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()}>
            <IonIcon slot="icon-only" icon={arrowBackOutline} />
          </IonButton>
          <IonTitle>{t('register.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div className="register-header">
          <h1>{t('register.createAccount')}</h1>
          <p>{t('register.subtitle')}</p>
        </div>

        <IonCard className="register-card">
          <IonCardContent>
            <IonItem>
              <IonIcon slot="start" icon={personOutline} color="primary" />
              <IonLabel position="floating">{t('register.fullName')}</IonLabel>
              <IonInput
                name="name"
                type="text"
                value={formData.name}
                onIonInput={handleInputChange}
                required
              />
            </IonItem>

            <IonItem>
              <IonIcon slot="start" icon={mailOutline} color="primary" />
              <IonLabel position="floating">{t('register.email')}</IonLabel>
              <IonInput
                name="email"
                type="email"
                value={formData.email}
                onIonInput={handleInputChange}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">{t('register.phone')}</IonLabel>
              <IonInput
                name="phone"
                type="tel"
                value={formData.phone}
                onIonInput={handleInputChange}
                required
              />
            </IonItem>

            <IonItem>
              <IonIcon slot="start" icon={lockClosedOutline} color="primary" />
              <IonLabel position="floating">{t('register.password')}</IonLabel>
              <IonInput
                name="password"
                type="password"
                value={formData.password}
                onIonInput={handleInputChange}
                required
              />
            </IonItem>

            <IonItem>
              <IonIcon slot="start" icon={lockClosedOutline} color="primary" />
              <IonLabel position="floating">{t('register.confirmPassword')}</IonLabel>
              <IonInput
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onIonInput={handleInputChange}
                required
              />
            </IonItem>

            <div className="terms-section">
              <IonText color="medium">
                <p>{t('register.terms')}</p>
              </IonText>
            </div>

            <IonButton expand="block" onClick={handleSubmit} className="submit-btn">
              {t('register.createAccount')}
            </IonButton>

            <div className="login-section">
              <IonText color="medium">
                {t('register.hasAccount')}{' '}
                <a href="#" onClick={() => history.push('/login')}>
                  {t('register.signIn')}
                </a>
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Register;
