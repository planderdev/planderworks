import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plander.works',
  appName: 'Plander Works',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
