import React, { useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonIcon,
} from '@ionic/react';
import { languageOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { saveLanguagePreference } from '../i18n/config';

interface LanguageSwitcherProps {
  onLanguageChange?: (lng: string) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ onLanguageChange }) => {
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const handleLanguageChange = (event: CustomEvent) => {
    const lng = event.detail.value;
    setSelectedLanguage(lng);
    saveLanguagePreference(lng);
    
    if (onLanguageChange) {
      onLanguageChange(lng);
    }
  };

  return (
    <IonItem>
      <IonIcon slot="start" icon={languageOutline} color="primary" />
      <IonLabel>Language / ภาษา</IonLabel>
      <IonSelect
        value={selectedLanguage}
        onIonChange={handleLanguageChange}
        interface="action-sheet"
        style={{ maxWidth: '120px' }}
      >
        <IonSelectOption value="th">ไทย</IonSelectOption>
        <IonSelectOption value="en">English</IonSelectOption>
      </IonSelect>
    </IonItem>
  );
};

export default LanguageSwitcher;
