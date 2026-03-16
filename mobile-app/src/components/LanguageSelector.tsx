import React from 'react';
import { IonSelect, IonSelectOption, IonIcon } from '@ionic/react';
import { languageOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  onLanguageChange?: (lng: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageChange }) => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (event: any) => {
    const newLang = event.detail.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('preferred_language', newLang);
    
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  return (
    <div className="language-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <IonIcon icon={languageOutline} style={{ fontSize: '20px' }} />
      <IonSelect
        value={i18n.language}
        onIonChange={handleLanguageChange}
        interface="action-sheet"
        style={{ width: 'auto', minWidth: '100px' }}
      >
        <IonSelectOption value="th">ไทย</IonSelectOption>
        <IonSelectOption value="en">English</IonSelectOption>
      </IonSelect>
    </div>
  );
};

export default LanguageSelector;
