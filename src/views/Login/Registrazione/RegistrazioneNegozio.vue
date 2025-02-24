<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary"  >
        <ion-title class="ion-text-center">Registra il tuo negozio</ion-title>
        <ion-loading :is-open="isOpenLoading" message="Please wait..." class="loading-spinner"></ion-loading>
        <BackButton></BackButton>

      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list class="registration-form">
      
        <FormInput
            v-model="nomeNegozio" 
            inputType="text"
            label="Nome del negozio"
            placeholder="Inserisci il nome del tuo negozio"
            @update="nomeNegozio=$event"
            autocapitalize="sentences"
        ></FormInput>

        <ion-item class="form-item">
          <ion-label position="stacked">Categoria</ion-label>
          <ion-select
            v-model="categoriaNegozio"
            placeholder="Seleziona Categoria"
            label-placement="floating"
            class="select-field">
            <ion-select-option value="Servizi di estetica e bellezza">Servizi di estetica e bellezza</ion-select-option>
            <ion-select-option value="Alimentari e cibo">Alimentari e cibo</ion-select-option>
          </ion-select>
        </ion-item>

        <FormInput
            v-model="cellulareNegozio" 
            inputType="text"
            label="Cellulare negozio"
            placeholder="Inserisci il cellulare associato al tuo negozio"
            @update="cellulareNegozio=$event"
        ></FormInput>

        <SelectProvinciaCitta @updatecitta="aggiornaCitta" @updateprovincia="aggiornaProvincia">
        </SelectProvinciaCitta>



        <FormInput
            v-model="indirizzoNegozio" 
            inputType="text"
            label="Indirizzo negozio"
            placeholder="Inserisci l indirizzo del tuo negozio"
            @update="indirizzoNegozio=$event"
            autocapitalize="sentences"
        ></FormInput>

        
        <FormInput
            v-model="descrizioneNegozio" 
            inputType="text"
            label="Descrizione del tuo negozio"
            placeholder="Inserisci una descrizione del tuo negozio"
            @update="descrizioneNegozio=$event"
            autocapitalize="sentences"
        ></FormInput>

        <ion-button @click="takePhoto" expand="full" class="photo-button">Scegli una foto</ion-button>

        <!-- Aggiunto uno stile per i campi di input -->
        <ion-item class="form-item">
          <ion-label position="stacked">Foto del negozio</ion-label>
          <img :src="immagineNegozio" alt="Foto del negozio" class="store-image" />
        </ion-item>

        <ion-button @click="registerUser" expand="full" class="register-button">Registrati</ion-button>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.registration-form {
  max-width: 400px;
  margin: auto;
}

.form-item {
  margin-bottom: 16px;
}

/* Stile generale per i campi di input */

/* Stile per il pulsante di selezione della foto */
.photo-button {
  margin-top: 16px;
  background-color: #3498db;
}

/* Stile per l'anteprima dell'immagine del negozio */
.store-image {
  max-width: 100%;
  height: auto;
  margin-top: 16px;
  border-radius: 8px;
}

/* Stile per il pulsante di registrazione */
.register-button {
  margin-top: 24px;
  background-color: #2ecc71;
}

/* Stile per lo spinner di caricamento */
.loading-spinner {
  --ion-color-primary: #3498db;
}
</style>


<script setup>
import {alertController, IonLoading,IonToast,toastController,IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonButton,IonLabel} from '@ionic/vue';
import { ref ,reactive,onMounted} from 'vue';
import {signOut, getAuth, createUserWithEmailAndPassword,sendEmailVerification } from "firebase/auth";
import { getFirestore, collection, addDoc,setDoc,doc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { Camera, CameraResultType,CameraSource } from '@capacitor/camera';
import { getStorage,uploadBytes, getDownloadURL ,ref as storageReference } from "firebase/storage";
import { useStore } from 'vuex';
import BackButton from '/src/views/Components/BackButton.vue';
import FormInput from "/src/views/Components/FormInput.vue";
import SelectProvinciaCitta from "/src/views/Components/SelectProvinciaCitta.vue";





const auth = getAuth();
const router = useRouter();
const db = getFirestore();
const storage = getStorage();
const store = useStore();


const nomeNegozio = ref('');
const categoriaNegozio = ref('');
let provinciaNegozio = ref('');
let cittaNegozio = ref('');
const indirizzoNegozio = ref('');
const cellulareNegozio= ref('');
const descrizioneNegozio = ref('');
const isGoogleLogged=ref(false)
let photo;
const immagineNegozio = ref(''); 
const email=ref('')

const datiRegistrazioneGestore = store.getters.getDatiregistrazioneGestore;


let isOpenLoading=ref(false);

onMounted(() => {
  // Controlla se l'utente è già loggato
  isOpenLoading.value=true
  const user = auth.currentUser;

  if (user) {

    const isGoogle = user.providerData.some(
        (provider) => provider.providerId === 'google.com'
      );
    isGoogleLogged.value = isGoogle;
    // Se l'utente è loggato, compila il form con i suoi dati
    email.value = user.email;
     // Inserisci una stringa asterischi nel campo password
  }else{

    isGoogleLogged.value = false; 
  }
  isOpenLoading.value=false
});


const takePhoto = async () => {
  try {
      photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
      quality: 100,
    });
    immagineNegozio.value = photo.webPath;


  } catch (error) {
    console.error('Errore durante la selezione o il caricamento dell\'immagine:', error);
  }
};

async function uriToBlob(uri) {
  return new Promise((resolve, reject) => {
    try {
      // Fetch the file content using the URI
      fetch(uri)
        .then((response) => response.blob())
        .then((blob) => resolve(blob))
        .catch((error) => reject(error));
    } catch (error) {
      reject(error);
    }
  });
}


async function presentToast(message) {
        const toast = await toastController.create({
          message: message,
          duration: 2000,
        });
        await toast.present();
};      

const registerUser = async () => {
  if(validateShopRegistration()){
  isOpenLoading.value = true;

    try {
      if (isGoogleLogged.value==true){
        await registraUtenteNelDb()
        return
      }
      
      await createUserWithEmailAndPassword(auth, datiRegistrazioneGestore.email, datiRegistrazioneGestore.password)
        .then((userCredential) => {
   

          // L'utente è stato creato con successo
          const user = userCredential.user;
          registraUtenteNelDb(user);

          sendEmailVerification(userCredential.user)
            .then(() => {
              isOpenLoading.value = false;
            })
            .catch((error) => {
              presentToast("Errore durante l'invio dell'email di verifica: " + error.message);
              isOpenLoading.value = false;
            });
        })
        .catch((error) => {
          // Gestisci eventuali errori durante la creazione dell'utente
          console.error("Errore durante la creazione dell'utente:", error.message);
          presentToast("Errore durante la registrazione: " + error.message);
          isOpenLoading.value = false;
        });
    } catch (error) {
      console.error("Errore durante la registrazione:", error.message);
      presentToast("Errore durante la registrazione: " + error.message);
      isOpenLoading.value = false;
    }
  }

};

const registraUtenteNelDb = async (user) => {

  try {
    await setDoc(doc(db, "Gestore",user.uid), {
      email: datiRegistrazioneGestore.email,
      nome: datiRegistrazioneGestore.nome,
      cognome: datiRegistrazioneGestore.cognome,
      cellulare: datiRegistrazioneGestore.cellulare,
      provincia: datiRegistrazioneGestore.provincia,
      citta: datiRegistrazioneGestore.citta,
      via: datiRegistrazioneGestore.via,
      numeroCivico: datiRegistrazioneGestore.numeroCivico,
    });

    isOpenLoading.value = false;
    presentAlertEmailDiVerifica();
    await registraNegozioNelDb(user);
  } catch (error) {
    isOpenLoading.value = false;
    console.error('Errore durante la registrazione nel database:', error.message);
    presentToast("Errore durante la registrazione nel database: " + error.message);
  }
};

const registraNegozioNelDb = async (user) => {
  isOpenLoading.value = true;

  if (!user) {
    console.error('Utente non autenticato.');
    presentToast("Errore durante la registrazione del negozio: utente non autenticato.");
    isOpenLoading.value = false;
    return;
  }
  

  try {
    const docRef = await addDoc(collection(db, 'NegoziDaAccettare'), {
      proprietarioUid: user.uid,
      nomeNegozio: nomeNegozio.value,
      categoriaNegozio: categoriaNegozio.value,
      provinciaNegozio: provinciaNegozio.value,
      cittaNegozio: cittaNegozio.value,
      cellulareNegozio: cellulareNegozio.value,
      indirizzoNegozio: indirizzoNegozio.value,
      descrizioneNegozio: descrizioneNegozio.value,
      
    });


    const storage = getStorage();
    const storageRef = storageReference(storage, `/images/${docRef.id}`);
    const blob = await uriToBlob(photo.webPath);

    uploadBytes(storageRef, blob).then((snapshot) => {
    });

    isOpenLoading.value = false;
    logout();
  } catch (error) {
    isOpenLoading.value = false;
    console.error('Errore durante la registrazione del negozio nel database:', error.message);
    presentToast("Errore durante la registrazione del negozio: " + error.message);
  }
}


const logout = async () => {
  signOut(auth).then(() => {
    router.replace('/login');
  }).catch((error) => {
    console.error('Errore durante il logout:', error);
  });
};


const validateShopRegistration = () => {

  if (
    nomeNegozio.value === "" ||
    categoriaNegozio.value === "" ||
    cellulareNegozio.value === "" ||
    provinciaNegozio.value === "Seleziona Provincia" ||
    cittaNegozio.value === "Seleziona Città" ||
    indirizzoNegozio.value === "" ||
    descrizioneNegozio.value === ""
  ) {
    presentToast("Completa tutti i campi");
    return false;
  }

  if (cellulareNegozio.value.length < 9 || cellulareNegozio.value.length > 10) {
    presentToast("Il numero di telefono del negozio deve essere valido");
    return false;
  }

  return true;
};
const aggiornaProvincia = (nuovaProvincia) => {
  provinciaNegozio.value = nuovaProvincia.value;
};

const aggiornaCitta = (nuovaCitta) => {
  cittaNegozio.value = nuovaCitta.value;
};

const presentAlertEmailDiVerifica = async () => {
  const alert = await alertController.create({
    header: 'Controlla la tua email',
    message: 'IMPORTANTE : \n 1) Premi sul link presente nella email per verificare la tua identità. Non potrai fare il login fino a quando non confermi.\n 2) Non potrai accedere fino il la tua registrazione non verra confermata.Prova ad accedere di tanto in tanto per verificare',
    buttons: [
      {
        text: 'OK',
        handler: () => {
          // La logica qui sarà eseguita quando l'utente preme OK
          console.log('Azione eseguita dopo aver premuto OK');
        }
      }
    ]
  });
  await alert.present();
};


</script>
