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
  IonList,
} from '@ionic/react';
import {
  personOutline,
  mailOutline,
  phonePortraitOutline,
  logOutOutline,
  settingsOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Profile.scss';

const Profile: React.FC = () => {
  const history = useHistory();
  
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+66 123 456 789',
  };

  const handleLogout = () => {
    console.log('Logout');
    history.push('/home');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
          <IonButton fill="clear" slot="end">
            <IonIcon slot="icon-only" icon={settingsOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="profile-header">
          <IonAvatar>
            <img src="https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff" alt="Profile" />
          </IonAvatar>
          <h1>{user.name}</h1>
          <p>Member since 2024</p>
        </div>

        <IonCard className="profile-info-card">
          <IonCardContent>
            <IonList lines="none">
              <IonItem>
                <IonIcon slot="start" icon={mailOutline} color="primary" />
                <IonLabel>
                  <h2>Email</h2>
                  <p>{user.email}</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon slot="start" icon={phonePortraitOutline} color="primary" />
                <IonLabel>
                  <h2>Phone</h2>
                  <p>{user.phone}</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon slot="start" icon={shieldCheckmarkOutline} color="primary" />
                <IonLabel>
                  <h2>Verification Status</h2>
                  <p>Pending</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        <div className="profile-actions">
          <IonCard className="action-card">
            <IonCardContent>
              <IonItem button detail>
                <IonIcon slot="start" icon={personOutline} color="primary" />
                <IonLabel>Edit Profile</IonLabel>
              </IonItem>
              <IonItem button detail>
                <IonIcon slot="start" icon={shieldCheckmarkOutline} color="primary" />
                <IonLabel>Verification</IonLabel>
              </IonItem>
              <IonItem button detail>
                <IonIcon slot="start" icon={settingsOutline} color="primary" />
                <IonLabel>Settings</IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>

          <IonButton expand="block" color="danger" onClick={handleLogout} className="logout-btn">
            <IonIcon slot="start" icon={logOutOutline} />
            Logout
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
