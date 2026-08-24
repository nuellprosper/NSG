import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ng.name.nuellstudyguide',
  appName: 'NSG',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'nuellstudyguide.name.ng',
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '780956680320-g2gripd8rmlalln7flapch5el5bijpbb.apps.googleusercontent.com',
      forceCodeForRefreshToken: false
    }
  }
};

export default config;
