<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Home</ion-title>
        <ion-loading :is-open="isOpenLoading" message="Please wait..." class="loading-spinner"></ion-loading>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="div-foto-nome">
        <div class="image-container">
          <img class="img" alt="Immagine del negozio" :src="immagineNegozio" />
          <ion-progress-bar class="progress-bar" v-show="mostraProgresBar" type="indeterminate" color="primary"></ion-progress-bar>
        </div>
        <h1>{{ nomeNegozio }}</h1>
        <h3>{{ viaNegozio }}, {{ cittaNegozio }}</h3>
        <h4>{{ numeroCellulare }}</h4>

        <div class="description">
          <h6 class="h6-description">Descrizione</h6>
          <p>{{ descrizioneNegozio }}</p>
        </div>
      </div>

      <div class="div-button-home">
        <ion-button class="custom-button" fill="outline" @click="apriModaleModifica()">Modifica informazioni</ion-button>

        <ion-button v-if="categoriaNegozio=='Servizi di estetica e bellezza'" class="custom-button" fill="outline" @click="inserisciServizi()">Modifica servizi</ion-button>
        <ion-button v-if="categoriaNegozio=='Servizi di estetica e bellezza' "class="custom-button" fill="outline" @click="modificaOrariLavorativi()">Modifica orari lavorativi</ion-button>
        <ion-button class="custom-button" fill="outline" @click="InserisciFerie()">Inserisci ferie</ion-button>
        <!-- Pulsante per la gestione foto menu (visibile solo se categoriaNegozio è Alimentari) -->
        <ion-button v-if="categoriaNegozio=='Alimentari e cibo'" class="custom-button" fill="outline" @click="apriModaleMenu()">
          Carica Foto Menu
        </ion-button>
      </div>
    </ion-content>

    <!-- Modal per modificare informazioni -->
    <ion-modal :is-open="mostraModaleModifica" @ion-modal-did-dismiss="chiudiModaleModifica">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Modifica informazioni</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="chiudiModaleModifica">Chiudi</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div class="form-container">
          <ion-item class="item">
            <ion-label position="stacked">Immagine del negozio</ion-label>
            <ion-button class="upload-btn" @click="caricaImmagine()">{{ testoBottone }}</ion-button>
          </ion-item>

          <ion-item class="item">
            <ion-label position="stacked">Nome</ion-label>
            <ion-input v-model="nomeNegozioModifica" class="input-field"></ion-input>
          </ion-item>

          <ion-item class="item">
            <ion-label position="stacked">Via</ion-label>
            <ion-input v-model="viaNegozioModifica" class="input-field"></ion-input>
          </ion-item>

          <ion-item class="item">
            <ion-label position="stacked">Numero di cellulare</ion-label>
            <ion-input v-model="numeroCellulareModifica" class="input-field"></ion-input>
          </ion-item>

          <ion-item class="item">
            <ion-label position="stacked">Descrizione</ion-label>
            <ion-textarea v-model="descrizioneNegozioModifica" class="input-field"></ion-textarea>
          </ion-item>

          <ion-button class="save-btn" expand="block" @click="salvaModifiche">Salva modifiche</ion-button>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Modal per gestire le foto del menu (solo per categoria Alimentari) -->
    <ion-modal :is-open="mostraModaleMenu" @ion-modal-did-dismiss="chiudiModaleMenu">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Modifica Menu</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="chiudiModaleMenu">Chiudi</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div class="form-container">
          <!-- Pulsante con icona "+" per aggiungere una nuova foto -->
          <div class="add-photo-container">
            <ion-button class="add-photo-btn" fill="clear" @click="caricaFotoMenu">
              <ion-icon :icon="addIcon" class="add-icon"></ion-icon>
            </ion-button>
          </div>
          <!-- Contenitore a scorrimento orizzontale per le foto del menu -->
          <div class="menu-photos-container">
            <div class="menu-photos">
              <div v-for="(photo, index) in menuPhotos" :key="index" class="menu-photo">
                <img :src="photo.url" alt="Foto Menu" class="img-menu" />
                <ion-button color="danger" size="small" @click="eliminaFotoMenu(photo)">Elimina</ion-button>
              </div>
            </div>
          </div>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import {
  IonLoading,
  IonProgressBar,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonLabel,
  IonInput,
  IonItem,
  IonModal,
  IonTextarea,
  IonButtons,
  IonIcon,
  toastController
} from '@ionic/vue';
import { add } from 'ionicons/icons';
import {
  getFirestore,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  getStorage,
  getDownloadURL,
  ref as storageReference,
  uploadBytes,
  deleteObject,
  listAll
} from "firebase/storage";
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();
const router = useRouter();
const store = useStore();

let photo;
const testoBottone = ref("Clicca per caricare una nuova foto");
let isOpenLoading = ref(false);

const nomeNegozio = ref('Nome del Negozio');
const cittaNegozio = ref('Città del Negozio');
const viaNegozio = ref('Via del Negozio');
const numeroCellulare = ref('Numero di Cellulare');
const immagineNegozio = ref('path/immagine.jpg');
const descrizioneNegozio = ref('Descrizione del Negozio');
const mostraProgresBar = ref(true);
var idDocumentNegozio = ref('');

const mostraModaleModifica = ref(false); // Per il modale di modifica informazioni

// Variabili per modificare i dati
const nomeNegozioModifica = ref('');
const viaNegozioModifica = ref('');
const cittaNegozioModifica = ref('');
const numeroCellulareModifica = ref('');
const descrizioneNegozioModifica = ref('');
const categoriaNegozio = ref('');
var nuovaImmagine=ref()

// Variabili e funzioni per il modale foto menu (solo per categoria Alimentari)
const mostraModaleMenu = ref(false);
const menuPhotos = ref([]);
// Icona da usare per il pulsante "+"
const addIcon = ref(add);

 // Apri il modale di modifica informazioni
const apriModaleModifica = () => {
  mostraModaleModifica.value = true;
  // Popola i campi con i valori attuali
  nomeNegozioModifica.value = nomeNegozio.value;
  viaNegozioModifica.value = viaNegozio.value;
  cittaNegozioModifica.value = cittaNegozio.value;
  numeroCellulareModifica.value = numeroCellulare.value;
  descrizioneNegozioModifica.value = descrizioneNegozio.value;
};

// Chiudi il modale di modifica informazioni
const chiudiModaleModifica = () => {
  testoBottone.value = "Clicca per caricare una nuova foto";
  mostraModaleModifica.value = false;
};

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


// Carica immagine per il negozio
const caricaImmagine = async () => {
  try {
    photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
      quality: 90,
    });
    nuovaImmagine = photo.webPath;
    testoBottone.value = "Immagine caricata con successo. Premi il pulsante salva";
  } catch (error) {
    presentToast('Errore ', 'danger');
  }
};

async function uriToBlob(uri) {
  return new Promise((resolve, reject) => {
    try {
      fetch(uri)
        .then((response) => response.blob())
        .then((blob) => resolve(blob))
        .catch((error) => reject(error));
    } catch (error) {
      reject(error);
    }
  });
}

const salvaModifiche = async () => {
  isOpenLoading.value = true;
  var nuovoImmagineURL;

  const capitalizeFirstLetter = (string) =>
      string ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : string;

  try {
    // Aggiorna i dati in Firestore
    const docRef = doc(db, 'Negozi', idDocumentNegozio.value);
    const aggiornamenti = {
      nomeNegozio: capitalizeFirstLetter(nomeNegozioModifica.value),
      indirizzoNegozio: capitalizeFirstLetter(viaNegozioModifica.value),
      cellulareNegozio: numeroCellulareModifica.value,
      descrizioneNegozio: descrizioneNegozioModifica.value,
    };

    // Aggiorna immagine se presente
    if (nuovaImmagine.value) {
      const storageRef = storageReference(storage, `/images/${docRef.id}`);
      const blob = await uriToBlob(photo.webPath);
      await uploadBytes(storageRef, blob).then((snapshot) => {
      });
      nuovoImmagineURL = await getDownloadURL(storageRef);
    }

    await setDoc(docRef, aggiornamenti, { merge: true });

    // Aggiorna valori locali
    nomeNegozio.value = nomeNegozioModifica.value;
    viaNegozio.value = viaNegozioModifica.value;
    cittaNegozio.value = cittaNegozioModifica.value;
    numeroCellulare.value = numeroCellulareModifica.value;
    descrizioneNegozio.value = descrizioneNegozioModifica.value;
    if (nuovaImmagine) {
      immagineNegozio.value = nuovoImmagineURL;
    }

    chiudiModaleModifica();
    console.log('Modifiche salvate con successo.');
  } catch (error) {
    presentToast('Errore ', 'danger');

    console.error('Errore durante il salvataggio delle modifiche:', error);
  } finally {
    isOpenLoading.value = false;
  }
};

const inserisciServizi = () => {
  router.push('/gestore/tabs/tab1gestore/inserisciServizi');
};
const InserisciFerie = () => {
  router.push('/gestore/tabs/tab1gestore/inserisciferie');
};

const modificaOrariLavorativi = () => {
  router.push('/gestore/tabs/tab1gestore/sceltaOrariLavorativi');
};

async function caricaDatiDaFirestore() {
  try {
    const currentUser = auth.currentUser;

    // Cerca nel collezione Negozi
    let q = query(collection(db, 'Negozi'), where('proprietarioUid', '==', currentUser?.uid));
    let querySnapshot = await getDocs(q);

    // Se è trovato nel collezione Negozi o non è presente in nessuna delle collezioni sopra, continua il caricamento dei dati
    const docRef = querySnapshot.docs[0].ref;
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      idDocumentNegozio.value = docSnap.id;
      categoriaNegozio.value = docSnap.data().categoriaNegozio;
      store.dispatch('setIdDocumentNegozioGestore', idDocumentNegozio.value);

      nomeNegozio.value = docSnap.data().nomeNegozio || '';
      cittaNegozio.value = docSnap.data().cittaNegozio || '';
      viaNegozio.value = docSnap.data().indirizzoNegozio || '';
      numeroCellulare.value = docSnap.data().cellulareNegozio || '';
      descrizioneNegozio.value = docSnap.data().descrizioneNegozio || '';

      // Recupera l'URL dell'immagine dallo storage Firebase
      const immagineRef = storageReference(storage, `images/${idDocumentNegozio.value}`);
      immagineNegozio.value = await getDownloadURL(immagineRef);
      mostraProgresBar.value = false;
    } else {
      router.push('/registrazione/registrazioneClienteGestore/registrazioneNegozio'); // Naviga al secondo componente
    }
  } catch (error) {
    presentToast('Errore ', 'danger');
  }
}

onMounted(async () => {
  const user = auth.currentUser;
  mostraProgresBar.value = true;

  if (user) {
    try {
      await caricaDatiDaFirestore();
    } catch (error) {
      presentToast('Errore ', 'danger');

    }
  }
  mostraProgresBar.value = false;
});

/* --- Funzione per la gestione delle foto del menu --- */

// Apre il modale e carica le foto attuali dal path "menuPhotos/{idDocumentNegozio}"
const apriModaleMenu = async () => {
  mostraModaleMenu.value = true;
  try {
    const listRef = storageReference(storage, `menuPhotos/${idDocumentNegozio.value}`);
    const res = await listAll(listRef);
    menuPhotos.value = [];
    for (const itemRef of res.items) {
      const url = await getDownloadURL(itemRef);
      menuPhotos.value.push({ url, fullPath: itemRef.fullPath });
    }
  } catch (e) {
    presentToast('Errore ', 'danger');
  }
};

// Chiude il modale del menu
const chiudiModaleMenu = () => {
  mostraModaleMenu.value = false;
};

// Funzione per caricare una nuova foto del menu: una volta scelta la foto, viene automaticamente caricata
const caricaFotoMenu = async () => {
  try {
    const photoMenu = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
      quality: 90,
    });
    const nuovaFotoMenu = photoMenu.webPath;
    isOpenLoading.value = true;
    const uniqueName = `${Date.now()}.jpg`;
    const storageRefMenu = storageReference(storage, `menuPhotos/${idDocumentNegozio.value}/${uniqueName}`);
    const blob = await uriToBlob(nuovaFotoMenu);
    await uploadBytes(storageRefMenu, blob);
    const url = await getDownloadURL(storageRefMenu);
    menuPhotos.value.push({ url, fullPath: `menuPhotos/${idDocumentNegozio.value}/${uniqueName}` });
    isOpenLoading.value = false;
  } catch (error) {
    presentToast('Errore ', 'danger');

    isOpenLoading.value = false;
  }
};


// Elimina una foto del menu da Firebase Storage
const eliminaFotoMenu = async (photo) => {
  try {
    const photoRef = storageReference(storage, photo.fullPath);
    await deleteObject(photoRef);
    menuPhotos.value = menuPhotos.value.filter(p => p.fullPath !== photo.fullPath);
  } catch (error) {
    presentToast('Errore ', 'danger');

  }
};
</script>

<style scoped>
/* Layout generale e contenitori */
.div-foto-nome {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  margin: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.image-container {
  position: relative;
}

.img {
  width: 220px;
  height: 220px;
  border-radius: 16px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.img:hover {
  transform: scale(1.03);
}

h1 {
  font-size: 2rem;
  margin: 12px 0 4px;
  color: #222;
}

h3,
h4 {
  text-align: center;
  color: #555;
  margin: 4px 0;
}

/* Sezione descrizione */
.description {
  padding: 16px;
  margin-top: 12px;
  border-radius: 8px;
  background: #f9f9f9;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 420px;
}

.h6-description {
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.description p {
  margin: 0;
  text-align: center;
  font-size: 1rem;
  color: #444;
}

/* Pulsanti nella Home */
.div-button-home {
  margin: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.custom-button {
  width: 90%;
  max-width: 320px;
  margin: 8px 0;
  font-weight: 500;
  transition: transform 0.2s, background-color 0.3s;
  border-radius: 8px;
}

.custom-button:hover {
  transform: scale(1.02);
}

/* Modale e form */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background-color: #ffffff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

ion-item.item {
  --inner-padding-end: 0;
  --inner-padding-start: 0;
  --min-height: 56px;
  margin-bottom: 12px;
}

ion-label {
  font-size: 0.95rem;
  margin-bottom: 4px;
  color: #333;
  font-weight: 500;
}

.input-field {
  width: 100%;
  font-size: 1rem;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #f9f9f9;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  margin-top: 10px;
}

/* Corretto il border per ion-input e ion-textarea */
ion-input,
ion-textarea {
  display: block;
  width: 100%;
  --padding-start: 10px;
  --padding-end: 10px;
  --border-color: var(--ion-color-primary-shade);
  --border-radius: 6px;
  font-size: 1rem;
}

/* Pulsante di upload immagine */
.upload-btn {
  display: block;
  width: 100%;
  border-radius: 6px;
  padding: 10px;
  font-weight: bold;
  background: var(--ion-color-light);
  text-align: center;
  transition: background-color 0.3s, transform 0.2s;
}

.upload-btn:hover {
  background-color: #ccc;
  transform: scale(1.02);
}

/* Pulsante per salvare le modifiche */
.save-btn {
  margin-top: 16px;
  font-size: 1rem;
  padding: 12px;
  border-radius: 6px;
  background-color: var(--ion-color-primary);
  color: #ffffff;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.save-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

/* Sezione foto menu */
.menu-photos-container {
  overflow-x: auto;
  padding-bottom: 12px;
  margin-top: 16px;
}

.menu-photos {
  display: flex;
  flex-direction: row;
  gap: 16px;
  padding: 8px 0;
}

.menu-photo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.img-menu {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 6px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.img-menu:hover {
  transform: scale(1.05);
}

/* Pulsante aggiungi foto menu */
.add-photo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.add-photo-btn {
  border-radius: 50%;
  width: 48px;
  height: 48px;
  background: var(--ion-color-light);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transition: background 0.3s, transform 0.3s;
}

.add-photo-btn:hover {
  background: var(--ion-color-primary);
  transform: scale(1.1);
}

.add-icon {
  font-size: 1.75rem;
  color: var(--ion-color-primary);
  transition: color 0.3s;
}

.add-photo-btn:hover .add-icon {
  color: #fff;
}

/* Aggiustamenti responsive */
@media (max-width: 600px) {
  .img {
    width: 180px;
    height: 180px;
  }

  h1 {
    font-size: 1.75rem;
  }

  .menu-photo {
    width: 140px;
  }
}
</style>
