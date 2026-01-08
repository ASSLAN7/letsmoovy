import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.letsmoovy.app',
  appName: 'MOOVY',
  webDir: 'dist'
  // Für Entwicklung mit Live-Reload, diesen Block wieder aktivieren:
  // server: {
  //   url: 'https://35a82236-dd91-4113-bd4b-b9702c566baf.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // }
};

export default config;
