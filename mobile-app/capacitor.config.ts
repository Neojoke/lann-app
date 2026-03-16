import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lann.app',
  appName: 'Lann - Loan App',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1E3A8A',
      showSpinner: true,
      spinnerColor: '#D4AF37'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1E3A8A'
    }
  }
};

export default config;
