<template>
  <ion-app>
    <ion-router-outlet />
    <ion-loading :is-open="!isOnline" message="Connessione assente..." spinner="crescent" />

  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet} from '@ionic/vue';
import {onMounted,onUnmounted } from 'vue';
import { ref } from 'vue';
// Importa Firebase e Capacitor
import { Capacitor } from '@capacitor/core';
import { initializeApp } from 'firebase/app';
import { indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';


import { registerPlugin } from '@capacitor/core';
const Crashlytics = registerPlugin('Crashlytics');
import {  initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

import { IonLoading } from '@ionic/vue';


const firebaseConfig = {
  firebase:{
    apiKey: "AIzaSyAoeVM4luCHr8Irz-_K1E1aOLQP-2iV858",
    authDomain: "appuntamentiv2.firebaseapp.com",
    projectId: "appuntamentiv2",
    storageBucket: "appuntamentiv2.appspot.com",
    messagingSenderId: "175265749386",
    appId: "1:175265749386:web:ae0cd78f912a9dc9041073",
    measurementId: "G-8239522FZR"
  },
  };

// Lifecycle hook per eseguire codice al montaggio del componente
  // Inizializza Firebase
  const app = initializeApp(firebaseConfig.firebase);
/*   let appCheckKey;

  if (Capacitor.getPlatform() === 'android') {
    appCheckKey = '6LeVyZUqAAAAACGMzUc4gZ_4pyyRLuSeS8NfASIT';
  } else if (Capacitor.getPlatform() === 'ios') {
    appCheckKey = 'LA_TUA_CHIAVE_IOS';
  } else {
    appCheckKey = '6Lfux5UqAAAAAOePwejih1liWEUTNTmboyYS88Qu'; // Se hai anche una configurazione web
  }

  // Configura Firebase App Check con la chiave della piattaforma rilevata
  const appCheck = initializeAppCheck(app,{
    provider: new ReCaptchaV3Provider(appCheckKey),
    isTokenAutoRefreshEnabled: true, // Opzionale: Abilita il rinnovo automatico del token
  }); */

  // Controlla se è una piattaforma nativa usando Capacitor
  if (Capacitor.isNativePlatform()) {
    initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
    });
  }

 const isOnline = ref(navigator.onLine);


  const updateNetworkStatus = () => {
  isOnline.value = navigator.onLine;
};

onMounted(() => {
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', updateNetworkStatus);
  window.removeEventListener('offline', updateNetworkStatus);
});
  
</script>

<style scoped>
/* Aggiungi qui gli stili personalizzati, se necessario */
</style>
