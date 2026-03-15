import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonPage,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { personCircleOutline, cashOutline, documentTextOutline, logInOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Home.scss';

const Home: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>LANN Thailand Loan</IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => history.push('/login')}>
            <IonIcon slot="icon-only" icon={logInOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div className="welcome-section">
          <h1>Welcome to LANN</h1>
          <p>Thailand Digital Loan Platform</p>
        </div>

        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonCard className="action-card" onClick={() => history.push('/register')}>
                <IonCardHeader>
                  <IonIcon icon={personCircleOutline} size="large" />
                  <IonCardTitle>Register</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  Create your account to get started
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="6">
              <IonCard className="action-card">
                <IonCardHeader>
                  <IonIcon icon={cashOutline} />
                  <IonCardTitle>Loans</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  Manage your loans
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6">
              <IonCard className="action-card">
                <IonCardHeader>
                  <IonIcon icon={documentTextOutline} />
                  <IonCardTitle>Documents</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  Upload documents
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <div className="bottom-actions">
          <IonButton expand="block" onClick={() => history.push('/register')}>
            Get Started Now
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
