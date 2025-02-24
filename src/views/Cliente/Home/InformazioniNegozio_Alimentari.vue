<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <BackButton></BackButton>
        <!-- Loading component posizionato all'interno della toolbar -->
        <ion-loading :is-open="isOpenLoading" message="Please wait..."></ion-loading>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="store-container">


        <div class="store-image-container">
          <img class="store-image" alt="Immagine del negozio" :src="imageUrl" />
        </div>

        <div class="store-details">
          <h1 class="store-name">{{ document.nomeNegozio }}</h1>
          <p class="store-address">
            {{ document.indirizzoNegozio }}, {{ document.cittaNegozio }}
          </p>

          <div class="contact-info">
            <ion-icon :icon="callOutline" class="icon"></ion-icon>
            <p class="phone-number">{{ document.cellulareNegozio }}</p>
          </div>

          <hr class="divider" />

          <div class="store-description-container">
            <h2>Descrizione</h2>
            <p class="store-description">{{ document.descrizioneNegozio }}</p>
          </div>

          <ion-button expand="block" color="secondary" @click="prenotaNegozio">
            Crea una prenotazione
          </ion-button>
        </div>
      </div>

      <IonPopover
        :is-open="isPopoverOpen"
        @ionPopoverDidDismiss="isPopoverOpen = false"
      >
        <p class="popover-message">Negozio chiuso questo giorno</p>
      </IonPopover>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import BackButton from '/src/views/Components/BackButton.vue';

// Ionic e Firebase imports
import { IonIcon, IonPopover, IonLoading, IonButton, toastController, IonButtons, IonLabel, IonModal, IonList, IonItem, IonPage, IonBackButton, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonDatetime } from '@ionic/vue';
import { callOutline } from 'ionicons/icons';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const router = useRouter();
const store = useStore();
const db = getFirestore();

const document = ref({});
const imageUrl = ref(store.getters.getUrlNegozioSelezionato);
const isOpenLoading = ref(false);
const isPopoverOpen = ref(false);

const IdDocumentNegozioSelezionato = store.getters.getIdDocumentNegozioSelezionato;

// Funzione per mostrare il toast degli errori
const showToastError = async (errorMessage) => {
  const toast = await toastController.create({
    message: errorMessage,
    duration: 3000,
    position: 'bottom',
    color: 'danger'
  });
  await toast.present();
};

const prenotaNegozio = () => {
  // Eventuale logica aggiuntiva per la prenotazione può essere inserita qui
  router.push("/cliente/tabs/tab1/informazioniNegozio/visualizzaOrari_Alimentari");
};

const recuperaInformazioniNegozio = async () => {
  try {
    isOpenLoading.value = true;
    const docRef = doc(db, "Negozi", IdDocumentNegozioSelezionato);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      document.value = docSnap.data();
    } else {
      console.warn("Nessun documento trovato con l'ID specificato");
      await showToastError("Nessun documento trovato");
    }
  } catch (error) {
    console.error("Errore durante il recupero delle informazioni:", error);
    await showToastError("Errore durante il recupero delle informazioni");
  } finally {
    isOpenLoading.value = false;
  }
};

onMounted(() => {
  recuperaInformazioniNegozio();
});
</script>

<style scoped>
/* Contenitore principale */
.store-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Container per l'immagine del negozio */
.store-image-container {
  width: 100%;
  max-height: 300px;
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  border-radius: 12px;
  overflow: hidden;
}

/* Immagine */
.store-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}


/* Dettagli del negozio */
.store-details {
  width: 100%;
  max-width: 800px;
  background-color: #fff;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Nome e indirizzo */
.store-name {
  font-size: 2em;
  font-weight: bold;
  margin: 8px 0;
  text-align: center;
}

.store-address {
  font-size: 1em;
  color: #555;
  text-align: center;
  margin-bottom: 16px;
}

/* Informazioni di contatto */
.contact-info {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}
.icon {
  font-size: 1.5em;
  margin-right: 8px;
  color: var(--ion-color-secondary);
}
.phone-number {
  font-size: 1em;
  color: #555;
}

/* Divider */
.divider {
  border: none;
  height: 1px;
  background-color: var(--ion-color-secondary);
  margin: 16px 0;
}

/* Descrizione del negozio */
.store-description-container {
  margin-bottom: 16px;
}
.store-description-container h2 {
  text-align: center;
  margin-bottom: 8px;
  font-size: 1.5em;
}
.store-description {
  padding: 3px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  font-size: 1rem;
  text-align: justify;
}

/* Popover */
.popover-message {
  padding: 16px;
  font-size: 1em;
  text-align: center;
}

/* Pulsante Prenota */
ion-button {
  --border-radius: 12px;
  margin-top: 16px;
  transition: transform 0.2s ease-in-out;
}
ion-button:hover {
  transform: scale(1.02);
}

/* Media queries per la responsività */
@media (min-width: 768px) {
  .store-name {
    font-size: 2.5em;
  }
  .store-address, .phone-number, .store-description {
    font-size: 1.1em;
  }
}

@media (min-width: 1024px) {
  .store-details {
    padding: 24px;
  }
  .store-name {
    font-size: 2.5em;
  }
}
</style>
