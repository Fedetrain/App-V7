import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.federico.traina',
  appName: 'Appò',
  webDir: 'dist',

  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 3000,
      backgroundColor: "#ffffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    LocalNotifications: {
      smallIcon: "icon_notification",
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com",],
    },
    
   /*  GoogleAuth: {
      serverClientId: "175265749386-k0nlogvpf9ir30pufoabdahae9a813a0.apps.googleusercontent.com",
    }, */
  }
  
};

export default config;
