<template>
  <ion-page>
    <!-- Loading overlay -->
    <ion-loading 
      :is-open="!finito" 
      message="Caricamento dati..."
      spinner="circles"
      css-class="custom-loading"
    />

    <!-- Toast per messaggi -->
    <ion-toast
      :is-open="!!toastMessage"
      :message="toastMessage"
      :duration="3000"
      @didDismiss="toastMessage = ''"
      position="top"
      css-class="custom-toast"
    />

    <ion-header class="sticky-header">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <BackButton />
        </ion-buttons>
        <ion-title class="header-title">Visualizza Profilo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="finito" class="profile-container">
        <!-- Sezione Informazioni Personali -->
        <section class="profile-section">
          <h2 class="section-title">
            <ion-icon :icon="personCircleOutline" class="section-icon" />
            Informazioni Personali
          </h2>

          <div class="form-grid">
            <FormInput
              inputType="text"
              label="Nome"
              :value="nome"
              placeholder="Nome"
              readonly
              class="input-field"
            />

            <FormInput
              inputType="text"
              label="Cognome"
              :value="cognome"
              placeholder="Cognome"
              readonly
              class="input-field"
            />

            <FormInput
              inputType="email"
              label="Email"
              :value="email"
              placeholder="Email"
              readonly
              class="input-field"
            />

            <FormInput
              inputType="tel"
              label="Telefono"
              :value="cellulare"
              placeholder="Numero di telefono"
              readonly
              class="input-field"
            />
          </div>
        </section>

        <!-- Sezione Indirizzo -->
        <section class="profile-section">
          <h2 class="section-title">
            <ion-icon :icon="locationOutline" class="section-icon" />
            Indirizzo
          </h2>

          <div class="form-grid">
            <FormInput
              inputType="text"
              label="Via"
              :value="via"
              placeholder="Via/Piazza"
              readonly
              class="input-field"
            />

            <FormInput
              inputType="text"
              label="Civico"
              :value="numeroCivico"
              placeholder="Numero Civico"
              readonly
              class="input-field"
            />

            <FormInput
              inputType="text"
              label="Città"
              :value="citta"
              placeholder="Città"
              readonly
              class="input-field"
            />

            <FormInput
              inputType="text"
              label="Provincia"
              :value="provincia"
              placeholder="Provincia"
              readonly
              class="input-field"
            />
          </div>
        </section>

        <!-- Sezione Sicurezza -->
        <section class="security-section">
          <h2 class="section-title">
            <ion-icon :icon="lockClosedOutline" class="section-icon" />
            Sicurezza
          </h2>

          <div class="button-group">
            <ion-button 
              @click="modificaEmail" 
              color="primary" 
              class="action-button"
            >
              <ion-icon slot="start" :icon="mailOutline" />
              Modifica Email
            </ion-button>

            <ion-button 
              @click="modificaPassword" 
              color="primary" 
              class="action-button"
            >
              <ion-icon slot="start" :icon="keyOutline" />
              Modifica Password
            </ion-button>
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { 
  getFirestore, doc, getDoc, updateDoc 
} from 'firebase/firestore';
import { 
  getAuth, updateEmail as updateFirebaseEmail, 
  updatePassword as updateFirebasePassword,
  EmailAuthProvider,
  reauthenticateWithCredential 
} from 'firebase/auth';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButton, IonButtons, IonLoading, IonToast, IonIcon 
} from '@ionic/vue';
import { 
  personCircleOutline, locationOutline, lockClosedOutline,
  mailOutline, keyOutline 
} from 'ionicons/icons';
import { toastController } from '@ionic/vue';
import BackButton from '@/views/Components/BackButton.vue';
import FormInput from '@/views/Components/FormInput.vue';

const store = useStore();
const router = useRouter();
const db = getFirestore();
const auth = getAuth();

// State
const finito = ref(false);
const toastMessage = ref('');
const nome = ref('');
const cognome = ref('');
const email = ref('');
const cellulare = ref('');
const provincia = ref('');
const citta = ref('');
const via = ref('');
const numeroCivico = ref('');
const userRole = ref('');


const hasAuthProvider = (providerId) => {
  const user = auth.currentUser;
  return user?.providerData?.some(provider => provider.providerId === providerId);
};
// Funzioni di supporto
const showToast = async (message, color = 'medium') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'top',
    buttons: [{ icon: 'close', role: 'cancel' }]
  });
  await toast.present();
};

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Operazioni di modifica
const modificaEmail = async () => {
  try {
    
    if(hasAuthProvider('google.com')) {
      showToast('Gli utenti che accedono con Google non possono modificare l\'email', 'warning');
      return;
    }

    const nuovaEmail = prompt('Inserisci la nuova email:');    if (!nuovaEmail) return;

    if (!validateEmail(nuovaEmail)) {
      showToast('Formato email non valido', 'danger');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      showToast('Utente non autenticato', 'danger');
      return;
    }

    const currentPassword = prompt('Conferma la tua password corrente:');
    if (!currentPassword) return;

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    await updateFirebaseEmail(user, nuovaEmail);

    const uid = user.uid;
    if (userRole.value === 'Cliente') {
      await updateDoc(doc(db, 'Cliente', uid), { email: nuovaEmail });
    } else if (userRole.value === 'Gestore') {
      await updateDoc(doc(db, 'Gestore', uid), { email: nuovaEmail });
    } else {
      throw new Error('Tipologia utente non riconosciuta');
    }

    email.value = nuovaEmail;
    showToast('Email aggiornata con successo!', 'success');
  } catch (error) {
    console.error('Errore modifica email:', error);
    let message = 'Errore durante l\'aggiornamento dell\'email';
    if (error.code === 'auth/email-already-in-use') {
      message = 'Email già utilizzata da un altro account';
    } else if (error.code === 'auth/requires-recent-login') {
      message = 'Riautenticazione richiesta. Effettua il login nuovamente.';
    }
    showToast(`${message} (${error.code})`, 'danger');
  }
};

const modificaPassword = async () => {
  try {

    if(hasAuthProvider('google.com')) {
      showToast('Gli utenti Google devono modificare la password dal loro account Google', 'warning');
      return;
    }
    const nuovaPassword = prompt('Inserisci la nuova password (min. 6 caratteri):');
    if (!nuovaPassword) return;

    if (nuovaPassword.length < 6) {
      showToast('La password deve contenere almeno 6 caratteri', 'danger');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      showToast('Utente non autenticato', 'danger');
      return;
    }

    const currentPassword = prompt('Conferma la tua password corrente:');
    if (!currentPassword) return;

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    await updateFirebasePassword(user, nuovaPassword);
    showToast('Password aggiornata con successo!', 'success');
  } catch (error) {
    console.error('Errore modifica password:', error);
    let message = 'Errore durante l\'aggiornamento della password';
    if (error.code === 'auth/weak-password') {
      message = 'Password troppo debole (min. 6 caratteri)';
    } else if (error.code === 'auth/requires-recent-login') {
      message = 'Riautenticazione richiesta. Effettua il login nuovamente.';
    }
    showToast(`${message} (${error.code})`, 'danger');
  }
};

// Caricamento dati utente
const caricaDatiUtente = async (userUid) => {
  try {
    const [clienteDoc, gestoreDoc] = await Promise.all([
      getDoc(doc(db, 'Cliente', userUid)),
      getDoc(doc(db, 'Gestore', userUid))
    ]);

    let userData = null;
    if (clienteDoc.exists()) {
      userRole.value = 'Cliente';
      userData = clienteDoc.data();
    } else if (gestoreDoc.exists()) {
      userRole.value = 'Gestore';
      userData = gestoreDoc.data();
    }

    if (!userData) {
      showToast('Profilo non trovato', 'warning');
      return false;
    }

    nome.value = userData.nome || '';
    cognome.value = userData.cognome || '';
    email.value = userData.email || '';
    cellulare.value = userData.cellulare || '';
    provincia.value = userData.provincia || '';
    citta.value = userData.citta || '';
    via.value = userData.via || '';
    numeroCivico.value = userData.numeroCivico?.toString() || '';

    return true;
  } catch (error) {
    console.error('Errore caricamento dati:', error);
    showToast('Errore nel caricamento del profilo', 'danger');
    return false;
  }
};

// Lifecycle Hooks
onMounted(async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      router.push('/login');
      return;
    }

    const success = await caricaDatiUtente(user.uid);
    finito.value = success;
  } catch (error) {
    finito.value = false;
    showToast('Errore inizializzazione profilo', 'danger');
  }
});
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
}

.profile-section {
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 1.4rem;
  margin: 0 0 1.5rem 0;
}

.section-icon {
  margin-right: 12px;
  font-size: 1.8rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.input-field {
  border-radius: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
}

.security-section {
  text-align: center;
  padding: 24px;
}

.button-group {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

.action-button {
  --border-radius: 8px;
  --padding-top: 18px;
  --padding-bottom: 18px;
  font-weight: 500;
}


.custom-loading {
  --background: rgba(255, 255, 255, 0.95);
  --backdrop-opacity: 0.8;
}

.custom-toast {
  --color: white;
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}


</style>