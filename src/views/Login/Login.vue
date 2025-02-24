<template>
  <ion-page>
    <ion-header class="auth-header">
      <ion-toolbar color="primary">
        <ion-title class="header-title">Benvenuto</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding auth-content">
      <ion-loading 
        :is-open="isOpenLoading" 
        message="Caricamento..."
        spinner="circular"
        css-class="custom-loading"
      ></ion-loading>

      <div class="auth-card">
        <h1 class="auth-title">Accedi al tuo account</h1>

        <FormInput
          v-model="email"
          required
          inputType="email"
          label="Email"
          placeholder="la.tua@email.com"
          icon-start="mail-outline"
          class="auth-input"
          @update="email=$event"
        />

        <div class="password-wrapper">
          <FormInput
            :inputType="showPassword ? 'text' : 'password'"
            v-model="password"
            required
            label="Password"
            placeholder="••••••••"
            icon-start="lock-closed-outline"
            class="auth-input"
            @update="password = $event"
          />
          <ion-icon
            :icon="showPassword ? eyeOffOutline : eyeOutline"
            @click="togglePasswordVisibility"
            class="password-toggle"
          />
        </div>

        <ion-button 
          class="auth-button primary"
          expand="block"
          @click="loginButtonClick"
          :disabled="isOpenLoading"
        >
          <ion-spinner v-if="isOpenLoading" name="crescent" class="button-spinner" />
          <span v-else>Accedi</span>
        </ion-button>

        <div class="auth-links">
          <p class="link-text" @click="registratiButtonClick">
            Non hai un account? <span style="color: blue;">Registrati</span>
          </p>
          <p class="link-text" @click="presentAlertPasswordDimenticata">
            Password dimenticata?
          </p>
        </div>

        <div class="separator">
          <span class="separator-line"></span>
          <span class="separator-line"></span>
        </div>

        <ion-button
          class="google-button"
          expand="block"
          @click="signInWithGoogle"
          :disabled="isOpenLoading"
        >
          <ion-icon :icon="logoGoogle" class="google-icon" />
          <span>Continua con Google</span>
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { Capacitor } from '@capacitor/core';
import { ref, onMounted } from "vue";
import {
  signInWithRedirect,
  signInWithCredential,
  signInWithCustomToken,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  sendEmailVerification,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { useRouter } from 'vue-router';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { logoGoogle, eyeOutline, planet } from 'ionicons/icons';
import {
  toastController,
  alertController,
  IonToast,
  IonLoading,
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonContent,
  IonSpinner,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  isPlatform
} from '@ionic/vue';
const getAdminEmail = () => {
  return 'appoapplication@gmail.com';
};
import FormInput from "/src/views/Components/FormInput.vue";
import { useStore } from 'vuex';


const store = useStore();
const router = useRouter();
const isOpenLoading = ref(false);
const db = getFirestore();
const provider = new GoogleAuthProvider();
const email = ref("");
const password = ref("");
const error = ref(null);
const auth = getAuth();
const showPassword = ref(false);




const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};


import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const signInWithGoogle = async () => {
  try {
    isOpenLoading.value = true; // Mostra il caricamento

    // Effettua il login con Google tramite Capacitor
    const result = await FirebaseAuthentication.signInWithGoogle();

    if (!result || !result.user || !result.user.uid) {
      throw new Error("Dati utente non validi.");
    }

    console.log("Accesso riuscito con Google:", result);

    // Ottieni le credenziali di Google
    const credential = GoogleAuthProvider.credential(result.credential.idToken);

    // Effettua il login con Firebase utilizzando le credenziali
    const auth = getAuth();
    await signInWithCredential(auth, credential);

    console.log("Utente autenticato con Firebase:", auth.currentUser);

    // Ora `onAuthStateChanged` dovrebbe essere attivato correttamente

    // Nascondi il caricamento
    isOpenLoading.value = false;

  } catch (error) {
    console.error("Errore durante l'accesso con Google:", error.message || error);
    isOpenLoading.value = false; // Nascondi il caricamento in caso di errore
  }
};

const signInWithGoogle1 = async () => {
  try {
    const googleUser = await GoogleAuth.signIn();

    const idToken = googleUser.authentication.idToken;
    const credential = GoogleAuthProvider.credential(idToken);

    const firebaseUser = await signInWithCredential(auth, credential);
    
  } catch (error) {
    await presentToast("Errore durante il login con Google", 'danger');
  }
};

onMounted(() => {
  isOpenLoading.value = true;
  const platform = Capacitor.getPlatform();

  const clientIds = {
    web: '175265749386-k0nlogvpf9ir30pufoabdahae9a813a0.apps.googleusercontent.com',
    ios: '175265749386-j707k56685qvrn37bqllhala7gig0imp.apps.googleusercontent.com',
    android: '175265749386-k0nlogvpf9ir30pufoabdahae9a813a0.apps.googleusercontent.com',
  };

/*   GoogleAuth.initialize({
    clientId: clientIds[platform] || clientIds.web,
    scopes: ['profile', 'email'],
    grantOfflineAccess: platform !== 'web'
  }); */

});

const loginButtonClick = async () => {
  isOpenLoading.value = true;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    
    if (!userCredential.user.emailVerified) {
      await presentAlertEmailDiVerifica();
      await signOut(auth);
      return;
    }

  } catch (error) {
    const message = {
      'auth/invalid-credential': 'Credenziali non valide',
      'auth/too-many-requests': 'Troppi tentativi falliti',
      'auth/user-not-found': 'Utente non trovato',
      'auth/wrong-password': 'Password errata'
    }[error.code] || 'Errore durante il login';
    
    await presentToast(message, 'danger');
  } finally {
    isOpenLoading.value = false;
  }
};

const registratiButtonClick = () => {
  router.push('/registrazione/sceltaUtilizzoRegistrazione');
};

async function presentToast(message, color = 'primary') {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color,
    cssClass: 'custom-toast',
    buttons: [{ icon: 'close', role: 'cancel' }]
  });
  await toast.present();
}

const presentAlertEmailDiVerifica = async () => {
  const alert = await alertController.create({
    header: 'Verifica Email',
    message: 'Devi verificare la tua email prima di accedere. Vuoi ricevere di nuovo il link?',
    buttons: [
      { text: 'Annulla', role: 'cancel' },
      {
        text: 'Invia',
        handler: async () => {
          try {
            await sendEmailVerification(auth.currentUser);
            await presentToast('Email di verifica inviata', 'success');
          } catch (error) {
            console.error('Resend error:', error);
            await presentToast('Errore nell\'invio dell\'email', 'danger');
          }
        }
      }
    ]
  });
  await alert.present();
};

const presentAlertPasswordDimenticata = async () => {
  const alert = await alertController.create({
    header: 'Recupero Password',
    inputs: [{ name: 'email', type: 'email', placeholder: 'Inserisci email' }],
    buttons: [
      { text: 'Annulla', role: 'cancel' },
      {
        text: 'Recupera',
        handler: async (data) => {
          if (!data.email) {
            await presentToast('Inserisci un\'email valida', 'warning');
            return;
          }
          
          try {
            await sendPasswordResetEmail(auth, data.email);
            await presentToast('Email di recupero inviata', 'success');
          } catch (error) {
            console.error('Password reset error:', error);
            await presentToast('Errore nel recupero password', 'danger');
          }
        }
      }
    ]
  });
  await alert.present();
};

const checkIfNegozioIsAccettato = async (uid) => {
  try {
    const q = query(collection(db, 'Negozi'), where('proprietarioUid', '==', uid));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      await presentToast('Attendi che la tua registrazione sia confermata', 'warning');
      return false;
    }

    const negozioData = snapshot.docs[0].data();
    const allowedCategories = ["Servizi di estetica e bellezza", "Alimentari e cibo"];
    
    if (allowedCategories.includes(negozioData.categoriaNegozio)) {
      store.dispatch('setCategoriaNegozio', negozioData.categoriaNegozio);
      return true;
    }
    
    await presentToast('Categoria negozio non valida', 'warning');
    return false;
  } catch (error) {
    console.error('Negozio check error:', error);
    await presentToast('Errore controllo negozio', 'danger');
    return false;
  }
};

async function checkIfDocumentExists(uid) {
  try {
    const [clienteDoc, gestoreDoc, bloccatoDoc] = await Promise.all([
      getDoc(doc(db, "Cliente", uid)),
      getDoc(doc(db, "Gestore", uid)),
      getDoc(doc(db, "ClientiBloccati", uid))
    ]);

    if (bloccatoDoc.exists()) {
      await signOut(auth);
      await presentToast('Account bloccato', 'danger');
      return;
    }

    if (clienteDoc.exists()) {
      await router.replace('/cliente/tabs');
      return;
    }

    if (gestoreDoc.exists()) {
      const negozioValido = await checkIfNegozioIsAccettato(uid);
      negozioValido ? await router.replace('/gestore/tabs') : await signOut(auth);
      isOpenLoading.value=false
      return;
    }

    await router.push('/registrazione/sceltaUtilizzoRegistrazione');
    isOpenLoading.value=false

  } catch (error) {
    isOpenLoading.value=false
    console.error('Document check error:', error);
    await presentToast('Errore controllo documenti', 'danger');
  }
}

auth.onAuthStateChanged(async (user) => {
  isOpenLoading.value = true;
  console.log("🔄 Stato autenticazione cambiato. Controllo utente...");

  try {
    if (!user) {
      console.log("❌ Nessun utente autenticato. Reindirizzamento a /login...");
      await router.replace('/login');
      return;
    }

    console.log("✅ Utente autenticato:", user);

    if (user.email === getAdminEmail()) {
      console.log("👑 Utente admin rilevato. Reindirizzamento a /admin...");
      await router.replace('/admin');
      return;
    }

    if (!user.emailVerified) {
      console.log("📩 Email non verificata. Mostro avviso di verifica...");
      await presentAlertEmailDiVerifica();
      return;
    }

    console.log("🔍 Controllo se il documento utente esiste:", user.uid);
    await checkIfDocumentExists(user.uid);
    console.log("✅ Documento utente trovato o creato con successo.");
  } catch (error) {
    console.error("❌ Errore nello stato di autenticazione:", error);
    await presentToast("Errore di autenticazione", "danger");
  } finally {
    isOpenLoading.value = false;
    console.log("🔽 Caricamento completato.");
    // SplashScreen.hide();
  }
});

// initialize(); // Uncomment per abilitare AdMob
</script>

<style scoped>


.auth-card {
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 16px;
}

/* Elementi del Form */
.auth-title {
  text-align: center;
  margin: 1.5rem 0 2.5rem;
  font-size: 1.8rem;
  font-weight: 600;
}

.password-wrapper {
  position: relative;
  margin-bottom: 1.5rem;

  .password-toggle {
    position: absolute;
    right: 16px;
    bottom: 16px;
    font-size: 1.4rem;
    cursor: pointer;
    z-index: 2;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
    }
  }
}

/* Pulsanti */
.auth-button {
  --border-radius: 12px;
  --padding-top: 1.2rem;
  --padding-bottom: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: transform 0.2s ease;


}

.google-button {
  --border-radius: 12px;
  --padding-top: 1rem;
  --padding-bottom: 1rem;
  font-weight: 500;

  .google-icon {
    font-size: 1.4rem;
    margin-right: 12px;
    color: var(--ion-color-google);
  }
}

/* Link e Separatori */
.auth-links {
  margin: 1.5rem 0;
  text-align: center;
}
.link-text {
    font-size: 0.95rem;
    margin: 0.8rem 0;
    cursor: pointer;

  }
  
  span {
      font-weight: 500;
      transition: opacity 0.2s ease;

    }

.separator {
  display: flex;
  align-items: center;
  margin: 2rem 0;

  &-line {
    flex: 1;
    height: 1px;
    opacity: 0.3;
  }

  &-text {
    padding: 0 1rem;
    font-size: 0.9rem;
  }
}

/* Animazioni e Stati */
.custom-loading {
  --spinner-color: var(--ion-color-primary);
  --background: rgba(255, 255, 255, 0.95);
  --backdrop-opacity: 0.8;
  --width: 120px;
  --height: 120px;
}

.button-spinner {
  color: var(--ion-color-light);
}

/* Media Queries */
@media (max-width: 480px) {
  .auth-card {
    margin: 1rem;
    padding: 1.5rem;
  }

  .auth-title {
    font-size: 1.6rem;
    margin: 1rem 0 2rem;
  }
}
</style>