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
import { arrowBackOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';
import './Login.scss';

const Login: React.FC = () => {
  const history = useHistory();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e: CustomEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log('Login:', formData);
    history.push('/profile');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()}>
            <IonIcon slot="icon-only" icon={arrowBackOutline} />
          </IonButton>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue</p>
        </div>

        <IonCard className="login-card">
          <IonCardContent>
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

            <div className="forgot-password">
              <IonText color="primary">
                <a href="#">Forgot Password?</a>
              </IonText>
            </div>

            <IonButton expand="block" onClick={handleSubmit} className="submit-btn">
              Sign In
            </IonButton>

            <div className="register-section">
              <IonText color="medium">
                Don't have an account?{' '}
                <a href="#" onClick={() => history.push('/register')}>
                  Sign Up
                </a>
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Login;
