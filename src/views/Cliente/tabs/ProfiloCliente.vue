<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Profilo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="div-button">
        <!-- Pulsante per visualizzare il profilo -->
        <ion-button class="button" router-link="/cliente/tabs/tab3/visualizzaProfilo" router-direction="forward">
          Visualizza profilo
        </ion-button>
        <ion-button class="button-notifiche" @click="gestisciNotifiche">
          Attiva notifiche
        </ion-button>

        <!-- Pulsante di logout con icona -->
        <ion-button class="button-logout" @click="logout">
          Logout
          <ion-icon slot="end" :icon="logOutOutline"></ion-icon>
        </ion-button>
   
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup >
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/vue';
import { getAuth, signOut } from "firebase/auth";
import { logOutOutline } from "ionicons/icons";
import { useRouter } from 'vue-router';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';


import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';


const db =getFirestore();
const router = useRouter();
const auth = getAuth();

const logout = async () => {
  try {
    await signOut(auth);
    router.replace('/login');
  } catch (error) {
    console.error("Errore durante il logout:", error);
  }
};

// Funzione per gestire le notifiche
const gestisciNotifiche = async () => {
  try {
    // Richiedi permessi per le notifiche locali
    const permissionStatus = await LocalNotifications.requestPermissions();

    // Se i permessi non sono concessi, avvisa l'utente
    if (permissionStatus.receive !== 'granted') {
      alert("Le notifiche non sono abilitate. Si prega di attivarle dalle impostazioni.");
      // Indirizza l'utente alla pagina delle impostazioni dell'app
      // Capacitor può aprire direttamente le impostazioni dell'app
      if (Capacitor.isNative) {
        Plugins.Browser.open({ url: 'app-settings:' });
      }
      return; // Fermiamo l'esecuzione se non vengono concessi i permessi
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
<style scoped>
/* Stili per il layout e i pulsanti */
.div-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.button,
.button-logout,
.button-notifiche {
  margin-top: 20px;
  width: 80%;
  max-width: 300px;
  height: 50px;
  font-weight: bold;
  transition: background-color 0.3s, box-shadow 0.3s;
}

/* Stile per l'icona di logout */
.button-logout ion-icon {
  font-size: 1.2rem;
  margin-left: 8px;
}
</style>
