<template>
  <ion-page>
    <ion-tabs class="tab-bar">
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" href="/cliente/tabs/tab1">
          <ion-icon  :icon="homeOutline" />
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/cliente/tabs/tab2">
          <ion-icon :icon="calendarOutline" />
          <ion-label>Prenotazioni</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/cliente/tabs/tab3">
          <ion-icon  :icon="personOutline" />
          <ion-label>Profilo</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
      <ion-alert
      :is-open="showAlert"
      header="Permessi notifiche"
      message="Hai rifiutato le notifiche. Non potrai ricevere aggiornamenti importanti."
      buttons="OK"
      @didDismiss="showAlert = false"
    />

    <!-- Alert per rationale -->
    <ion-alert
      :is-open="showRationale"
      header="Importanza delle notifiche"
      message="Le notifiche sono molto importanti perché ti permettono di ricevere comunicazioni riguardo le tue prenotazioni. Vuoi attivare le notifiche ora?"
      :buttons="[
        { text: 'Annulla', role: 'cancel', handler: () => showRationale = false },
        { text: 'Attiva', handler: requestNotificationPermission }
      ]"
    />
      <!-- Popover per i contatti -->
      <ion-popover :is-open="mostraPopover" @ionPopoverDidDismiss="mostraPopover = false">
        <div class="popover-content">
          <h3 class="popover-title">📞 Area Contatti</h3>
          <p class="popover-description">
            La nostra app è in via di sviluppo e saremo lieti di accogliere qualsiasi segnalazione.
          </p>
          <ion-item>
            <ion-label position="stacked">Segnalazione</ion-label>
            <ion-input v-model="segnalazione" placeholder="Scrivi qui la tua segnalazione" clear-input></ion-input>
          </ion-item>
          <ion-button expand="full" @click="inviaSegnalazione" class="submit-button">
            Invia Segnalazione
          </ion-button>
        </div>
      </ion-popover>
    </ion-tabs>
    <ion-fab class="custom-fab" vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="togglePopover">
          <ion-icon aria-hidden="true" :icon="chatbubbleSharp" />
        </ion-fab-button>
      </ion-fab>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { 
  IonLoading, IonToast, IonPopover, IonTabBar, IonTabButton, IonTabs, 
  IonLabel, IonIcon, IonPage, IonRouterOutlet, IonFab, IonFabButton, 
  IonItem, IonTextarea, IonButton, IonAlert, alertController,IonInput
} from '@ionic/vue';
import { toastController } from '@ionic/vue';
import { homeOutline, calendarOutline, personOutline, chatbubbleSharp } from 'ionicons/icons';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getAuth } from "firebase/auth";
import { App } from '@capacitor/app';
import { useStore } from 'vuex';

const store = useStore();
const loading = ref(false);
const toastMessage = ref('');
const mostraPopover = ref(false);
const segnalazione = ref('');
const db = getFirestore();
const showAlert = ref(false);
const alertMessage = ref('');
const alertButtons = ref(['OK']);
const categoriaNegozio = store.getters.getCategoriaNegozio;
let backButtonPressedOnce = false;
const exitAppTimeout = ref(null);

// Variabili per le notifiche
const notificationPermission = ref('default');
const showRationale = ref(false);

// Funzione per presentare un Toast
const presentToast = async (message, color = 'medium') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: 'top',
    cssClass: 'custom-toast',
    buttons: [{ icon: 'close', role: 'cancel' }]
  });
  await toast.present();
};

const togglePopover = () => {
  mostraPopover.value = !mostraPopover.value;
};

const inviaSegnalazione = async () => {
  if (!segnalazione.value.trim()) {
    presentToast('Inserisci una segnalazione valida', 'warning');
    return;
  }

  loading.value = true;
  try {
    await addDoc(collection(db, "Segnalazioni"), {
      messaggio: segnalazione.value,
      data: new Date().toISOString(),
      stato: 'inviata'
    });
    
    segnalazione.value = '';
    mostraPopover.value = false;
    presentToast('Segnalazione inviata con successo!', 'success');
  } catch (error) {
    console.error('Errore durante l\'invio:', error);
    presentToast('Errore durante l\'invio. Riprova.', 'danger');
  } finally {
    loading.value = false;
  }
};

const handleAlertDismiss = () => {
  showAlert.value = false;
  alertMessage.value = '';
};

const updateNotificationToken = async (token) => {
  try {
    const user = getAuth().currentUser;
    if (!user) {
      return;
    }
    const userId = user.uid;
    const userDocRef = doc(db, "Cliente", userId);
    await setDoc(userDocRef, { notificationToken: token }, { merge: true });
  } catch (error) {
    console.error("Error updating token: ", error);
  }
};

// Funzione per richiedere i permessi delle notifiche (se necessario)
const requestNotificationPermission = async () => {
  try {
    const permissionResult = await PushNotifications.requestPermissions();
    if (permissionResult.receive === 'granted') {
      await PushNotifications.register();
      await setupPushNotifications();
    } else {
      presentToast('Permessi notifiche non concessi', 'warning');
    }
  } catch (error) {
    console.error('Errore durante richiesta permessi notifiche:', error);
  }
};

// Funzione per impostare i listener delle notifiche
const setupPushNotifications = async () => {
  // Listener per errori di registrazione
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Errore di registrazione:', error);
    presentToast('Errore nella registrazione delle notifiche', 'danger');
  });

  
  // Listener per notifiche ricevute
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    const notificationId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
    // Programma una local notification per mostrare i dettagli
    LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: notification.title,
          body: notification.body,
          schedule: { at: new Date(Date.now() + 1000) }, // Mostra dopo 1 secondo
          sound: 'default',
        },
      ],
    });
  });
  
  // Listener per azioni sulla notifica
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Azione notifica eseguita:', notification);
    // Qui puoi implementare logica aggiuntiva se necessario
  });
};

// Funzione per ottenere la piattaforma (iOS, Android o web)
const getPlatform = () => {
  return App.getPlatform ? App.getPlatform() : (window.Capacitor ? window.Capacitor.getPlatform() : 'web');
};

// Funzione per mostrare l'alert che indirizza alle impostazioni
const showPermissionSettingsAlert = async () => {
  const alert = await alertController.create({
    header: 'Permessi richiesti',
    message: 'Attiva le notifiche nelle impostazioni del dispositivo',
    buttons: [
      {
        text: 'Annulla',
        role: 'cancel'
      },
      {
        text: 'Apri impostazioni',
        handler: () => {
          const platform = getPlatform();
          const settingsUrl = platform === 'ios' ? 'app-settings:' : 'settings:';
          App.openUrl({ url: settingsUrl });
        }
      }
    ]
  });
  await alert.present();
};

// Funzione per controllare e gestire i permessi/notifiche
const checkAndHandleNotifications = async () => {
  try {
    const status = await PushNotifications.checkPermissions();
    notificationPermission.value = status.receive;

    if (status.receive === 'granted') {
      // Se i permessi sono già concessi, registra e imposta i listener
      await PushNotifications.register();
      await setupPushNotifications();
    } else if (status.receive === 'prompt') {
      showRationale.value = true;
    } else {
      await showPermissionSettingsAlert();
    }
  } catch (error) {
    console.error('Error handling notifications:', error);
  }
};

onMounted(async () => {
  // Gestione del tasto back
  App.addListener('backButton', async () => {
    if (backButtonPressedOnce) {
      App.exitApp();
    } else {
      backButtonPressedOnce = true;
      presentToast("Premi di nuovo indietro per uscire dall'app");
      exitAppTimeout.value = setTimeout(() => {
        backButtonPressedOnce = false;
      }, 2000);
    }
  });
  
  // Controlla e gestisce i permessi per le notifiche
  await checkAndHandleNotifications();
});

// Listener per l'aggiornamento del token delle notifiche
PushNotifications.addListener('registration', async (token) => {
  try {
    await updateNotificationToken(token.value);
  } catch (error) {
    console.error('Token update failed:', error);
    presentToast('Errore sincronizzazione notifiche', 'danger');
  }
});

// Cleanup dei listener quando il componente viene smontato
onUnmounted(() => {
  PushNotifications.removeAllListeners();
  LocalNotifications.removeAllListeners();
});

const handleBackButton = async () => {
  if (mostraPopover.value) {
    mostraPopover.value = false;
    return;
  }

  // Implementazione migliorata per il tasto back
  if (window.location.pathname === '/gestore/tabs/tab1gestore') {
    await handleDoubleBackExit();
  } else {
    window.history.back();
  }
};

const handleDoubleBackExit = async () => {
  if (!backButtonPressedOnce) {
    backButtonPressedOnce = true;
    presentToast("Premi di nuovo per uscire", 'medium');
    setTimeout(() => { backButtonPressedOnce = false; }, 2000);
  } else {
    App.exitApp();
  }
};
</script>


<style scoped>
.popover-content {
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.popover-title {
  color: #3880ff; /* Colore del titolo */
  font-size: 1.5em; /* Dimensione del font */
  margin-bottom: 10px; /* Margine sotto il titolo */
}

.popover-description {
  margin-bottom: 16px; /* Margine sotto la descrizione */
}

ion-item {
  margin-bottom: 16px;
}

.submit-button {
  background-color: #3880ff; /* Colore del bottone */
  color: white; /* Colore del testo */
}

.submit-button:hover {
  background-color: #3171e2; /* Colore del bottone al passaggio del mouse */
}

.custom-fab {
  margin-bottom: 60px; /* Regola questo valore in base alle tue necessità */
}
</style>
