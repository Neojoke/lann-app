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
import './Register.scss';

const Register: React.FC = () => {
  const history = useHistory();
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
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Join LANN Thailand Loan today</p>
        </div>

        <IonCard className="register-card">
          <IonCardContent>
            <IonItem>
              <IonIcon slot="start" icon={personOutline} color="primary" />
              <IonLabel position="floating">Full Name</IonLabel>
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
              <IonLabel position="floating">Email</IonLabel>
              <IonInput
                name="email"
                type="email"
                value={formData.email}
                onIonInput={handleInputChange}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Phone Number</IonLabel>
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
              <IonLabel position="floating">Password</IonLabel>
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
              <IonLabel position="floating">Confirm Password</IonLabel>
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
                <p>
                  By registering, you agree to our{' '}
                  <a href="#">Terms of Service</a> and{' '}
                  <a href="#">Privacy Policy</a>
                </p>
              </IonText>
            </div>

            <IonButton expand="block" onClick={handleSubmit} className="submit-btn">
              Create Account
            </IonButton>

            <div className="login-section">
              <IonText color="medium">
                Already have an account?{' '}
                <a href="#" onClick={() => history.push('/login')}>
                  Sign In
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
