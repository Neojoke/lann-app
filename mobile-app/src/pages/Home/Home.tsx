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
import { useTranslation } from 'react-i18next';
import './Home.scss';

const Home: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('home.title')}</IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => history.push('/login')}>
            <IonIcon slot="icon-only" icon={logInOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div className="welcome-section">
          <h1>{t('home.welcome')}</h1>
          <p>{t('home.tagline')}</p>
        </div>

        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonCard className="action-card" onClick={() => history.push('/register')}>
                <IonCardHeader>
                  <IonIcon icon={personCircleOutline} size="large" />
                  <IonCardTitle>{t('home.register')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {t('home.registerDesc')}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="6">
              <IonCard className="action-card">
                <IonCardHeader>
                  <IonIcon icon={cashOutline} />
                  <IonCardTitle>{t('home.loans')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {t('home.loansDesc')}
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6">
              <IonCard className="action-card">
                <IonCardHeader>
                  <IonIcon icon={documentTextOutline} />
                  <IonCardTitle>{t('home.documents')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {t('home.documentsDesc')}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <div className="bottom-actions">
          <IonButton expand="block" onClick={() => history.push('/register')}>
            {t('home.getStarted')}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
