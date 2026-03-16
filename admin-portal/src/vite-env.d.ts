/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare module "@ionic/react" {
  import * as React from "react";
  
  export const IonItem: React.FC<any>;
  export const IonLabel: React.FC<any>;
  export const IonInput: React.FC<any>;
  export const IonTextarea: React.FC<any>;
  export const IonSelect: React.FC<any>;
  export const IonSelectOption: React.FC<any>;
  export const IonText: React.FC<any>;
  export const IonIcon: React.FC<any>;
  export const IonCheckbox: React.FC<any>;
  export const IonRadio: React.FC<any>;
  export const IonRadioGroup: React.FC<any>;
  export const IonCard: React.FC<any>;
  export const IonCardHeader: React.FC<any>;
  export const IonCardTitle: React.FC<any>;
  export const IonCardContent: React.FC<any>;
  export const IonBadge: React.FC<any>;
  export const IonButton: React.FC<any>;
  export const IonButtons: React.FC<any>;
  export const IonTable: React.FC<any>;
  export const IonTr: React.FC<any>;
  export const IonTh: React.FC<any>;
  export const IonTd: React.FC<any>;
  export const IonThead: React.FC<any>;
  export const IonTbody: React.FC<any>;
  export const IonPagination: React.FC<any>;
}

declare module "ionicons/icons" {
  export const alertCircleOutline: string;
  export const checkmarkCircleOutline: string;
  export const trendUpOutline: string;
  export const trendDownOutline: string;
  export const cashOutline: string;
  export const peopleOutline: string;
  export const documentTextOutline: string;
  export const timeOutline: string;
  export const arrowUpOutline: string;
  export const arrowDownOutline: string;
  export const ellipsisHorizontalOutline: string;
}
