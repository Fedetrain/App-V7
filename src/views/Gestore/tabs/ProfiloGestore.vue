<template>
    <ion-page>
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Profilo</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content>
        <div class="div-button">
    
          <ion-button class="button" router-link="/cliente/tabs/tab3/visualizzaProfilo" router-direction="forward">
          Visualizza profilo
        </ion-button>
        <ion-button class="button-notifiche" @click="gestisciNotifiche">
          Attiva notifiche
        </ion-button>
          
          <ion-button class="button-logout" @click="logout">Logout</ion-button>
      </div>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup>
  import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonButton } from '@ionic/vue';
  import { getAuth, signOut } from "firebase/auth";
  import { useRouter } from 'vue-router';
  import { PushNotifications} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';


import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

  const router = useRouter();
  const db =getFirestore();

  const auth = getAuth();
  
  
  const logout= async ()=>{
  
    signOut(auth).then(() => {
      router.replace('/login');
  }).catch((error) => {
    // An error happened.
  });
  }

  const gestisciNotifiche = async () => {
  try {
    console.log('prima')
    const permStatus = await LocalNotifications.checkPermissions();

    const permissionStatus = await LocalNotifications.requestPermissions();
    console.log('dopo')


    if (permissionStatus.receive !== 'granted') {
      alert("Le notifiche non sono abilitate. Si prega di attivarle dalle impostazioni.");

      if (Capacitor.isNative) {
        Plugins.Browser.open({ url: 'app-settings:' });
      }
      return; 
    }

    // Registrazione per le notifiche
    await LocalNotifications.register();

    // Ascoltatore per le notifiche push ricevute
    LocalNotifications.addListener('pushNotificationReceived', (notification) => {
      const notificationId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);

      // Invia una notifica locale dopo la ricezione di una notifica push
      LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: notification.title,
            body: notification.body,
            schedule: { at: new Date(Date.now() + 1000) }, // Mostra dopo 1 secondo
            sound: 'default', // Suono di default
          },
        ],
      });
    });

    // Ascoltatore per le azioni delle notifiche push
    LocalNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    });

    // Ascoltatore per la registrazione del dispositivo per le notifiche push
    LocalNotifications.addListener('registration', (token) => {
      updateNotificationToken(token.value);  // Funzione per aggiornare il token
    });

  } catch (error) {
    console.error("Errore durante la gestione delle notifiche:", error);
    alert("Si è verificato un errore durante la gestione delle notifiche.");
  }
};

const updateNotificationToken = async (token) => {
  try {
    const user = getAuth().currentUser;
    if (!user) {
      return;
    }
    const userId = user.uid;

    const userDocRef = doc(db, "Gestore", userId);

    await setDoc(userDocRef, {
      notificationToken: token // Aggiungi o aggiorna il campo 'notificationToken'
    }, { merge: true });

  } catch (error) {
    console.error("Error updating token: ", error);
  }
};
  </script>
  
  <style>
  
    .div-button{
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .button{
      margin-top: 40px;
      height: 50px;
    }
  
  </style>