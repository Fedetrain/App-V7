<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <BackButton />
        <ion-loading 
          :is-open="isOpenLoading" 
          message="Caricamento..."
          spinner="circles"
        ></ion-loading>
      </ion-toolbar>
    </ion-header>

    <ion-content class="main-content">
      <!-- Sezione Immagine Negozio -->
      <div class="store-image-container">
        <img 
          class="store-image" 
          :src="imageUrl" 
          alt="Immagine negozio"
          loading="lazy"
        />
      </div>

      <!-- Contenuto Principale -->
      <div class="content-section">
        <h1 class="store-name">{{ document.nomeNegozio }}</h1>
        <div class="store-info">
          <ion-icon :icon="locationOutline" class="info-icon" />
          <p class="store-address">{{ document.indirizzoNegozio }}, {{ document.cittaNegozio }}</p>
        </div>

        <div class="store-info">
          <ion-icon :icon="callOutline" class="info-icon" />
          <p class="store-phone">{{ document.cellulareNegozio }}</p>
        </div>

        <div class="divider"></div>

        <!-- Descrizione -->
        <div class="description-section">
          <h2 class="section-title">Descrizione</h2>
          <p class="store-description">{{ document.descrizioneNegozio }}</p>
        </div>

        <!-- Selezione Data -->
        <div class="calendar-section">
          <ion-datetime
            presentation="date"
            :show-default-buttons="true" 
            done-text="Continua"
            cancel-text="" 
            class="custom-datetime"
            :is-date-enabled="isDateEnabled"
            locale="it-IT"
            @ionChange="gestisciCambioData"
          ></ion-datetime>
        </div>
      </div>

      <!-- Selezione Servizio -->
      <div class="service-selector" @click="apriModal">
        <div class="selector-content">
          <ion-icon :icon="gridOutline" class="selector-icon" />
          <div class="selector-text">
            <p class="selector-label">Servizio selezionato</p>
            <p class="selected-service">{{ servizioSelezionato.nome || 'Nessun servizio selezionato' }}</p>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="arrow-icon" />
        </div>
      </div>

      <!-- Modal Servizi -->
      <ion-modal 
        :is-open="modalIsOpen" 
        @didDismiss="modalIsOpen = false"
        class="service-modal"
      >
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Seleziona Servizio</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="chiudiModal" class="close-button">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="modal-content" >
          <div class="empty-state" v-if="setServizi.size === 0">
            <ion-icon :icon="alertCircleOutline" class="empty-icon" />
            <p class="empty-text">Nessun servizio disponibile</p>
          </div>

          <ion-list v-else class="service-list">
            <ion-item 
              v-for="servizio in setServizi" 
              :key="servizio" 
              @click="selezionaServizio(servizio)"
              class="service-item"
              lines="none"
            >
              <ion-label class="service-label">
                <h3>{{ servizio.nome }}</h3>
                <p class="service-details">
                  <span class="detail-item">
                    <ion-icon :icon="timeOutline" />
                    {{ servizio.durata }} min
                  </span>
                  <span class="detail-item">
                    <ion-icon :icon="cashOutline" />
                    €{{ servizio.costo }}
                  </span>
                </p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <!-- Popover Notifiche -->
      <ion-popover
        :is-open="isPopoverOpen"
        @didDismiss="isPopoverOpen = false"
        class="info-popover"
      >
        <div class="popover-content">
          <ion-icon :icon="warningOutline" class="popover-icon" />
          <p>Negozio chiuso in questa data</p>
        </div>
      </ion-popover>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonContent, IonLoading,
  IonDatetime, IonModal, IonList, IonItem, IonLabel, IonIcon,
  IonButton, IonButtons, IonPopover, IonTitle
} from '@ionic/vue';
import { 
  callOutline, locationOutline, gridOutline, chevronForwardOutline,
  closeOutline, timeOutline, cashOutline, warningOutline, alertCircleOutline
} from 'ionicons/icons';
import { getFirestore, doc, getDoc, collection, getDocs, query } from 'firebase/firestore';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import BackButton from '/src/views/Components/BackButton.vue';
import { toastController } from '@ionic/vue';

const store = useStore();
const router = useRouter();
const db = getFirestore();

// State
const isOpenLoading = ref(false);
const isPopoverOpen = ref(false);
const modalIsOpen = ref(false);
const document = ref({});
const imageUrl = ref(store.getters.getUrlNegozioSelezionato);
const setServizi = ref(new Set());
const servizioSelezionato = ref({});
const ferie = ref([]);

// Costanti
const IdDocumentNegozioSelezionato = store.getters.getIdDocumentNegozioSelezionato;

// Metodi
const isDateEnabled = (date) => {
  return !ferie.value.includes(date);
};


const apriModal = () => modalIsOpen.value = true;
const chiudiModal = () => modalIsOpen.value = false;

const selezionaServizio = (servizio) => {
  servizioSelezionato.value = servizio;
  chiudiModal();
};

const isDateFerie = (date) => {
  const formattedDate = date.toLocaleDateString('fr-CA'); // 'fr-CA' usa YYYY-MM-DD

  console.log(ferie);
  
  return ferie.value.includes(formattedDate);
};


const gestisciCambioData = async (event) => {


  try {
    // Definiamo today all'inizio, impostando l'orario a mezzanotte
    const today = new Date();
    today.toLocaleString("it-IT")
    today.setHours(0,0,0,0)

    // Dichiariamo selectedDate come let per poterla eventualmente riassegnare
    let selectedDate;
    if (!event.detail.value) {
      // Se non viene fornita una data, utilizza la data odierna
      selectedDate = new Date(today)
    } else {
      selectedDate = new Date(event.detail.value);
    }


    if (selectedDate < today) {
      mostraToast('Seleziona una data futura');
      return;
    }

    if (isDateFerie(selectedDate)) {
      console.warn("Il negozio è in ferie il:", selectedDate);
      mostraToast('Il negozio è in ferie per quel giorno');
      return;
    }

    if (!servizioSelezionato.value?.nome) {
      mostraToast('Seleziona un servizio prima di continuare');
      modalIsOpen.value=true
      return;
    }

    store.dispatch('setDataNegozioSelezionato', selectedDate);
    store.dispatch('setServizioSelezionato', servizioSelezionato.value);
    store.dispatch('setDurataServizioSelezionato', servizioSelezionato.value.durata);

    router.push('/cliente/tabs/tab1/informazioniNegozio/visualizzaOrari');

  } catch (error) {
    console.error("Errore durante la selezione della data:", error);
    mostraToast('Errore nella selezione della data');
  }
};



// Funzioni Firebase
const recuperaDati = async () => {
  try {
    isOpenLoading.value = true;
    
    // Recupera info negozio
    const negozioDoc = await getDoc(doc(db, "Negozi", IdDocumentNegozioSelezionato));
    if (negozioDoc.exists()) {
      document.value = negozioDoc.data();
      store.dispatch('setNomeNegozio', document.value.nomeNegozio);
    }

    // Recupera servizi
    const serviziRef = collection(db, 'Negozi', IdDocumentNegozioSelezionato, 'Servizi');
    const serviziSnapshot = await getDocs(query(serviziRef));
    setServizi.value = new Set(serviziSnapshot.docs.map(doc => doc.data()));

    // Recupera ferie
    const ferieRef = collection(db, 'Negozi', IdDocumentNegozioSelezionato, 'Ferie');
    const ferieSnapshot = await getDocs(ferieRef);
    ferie.value = ferieSnapshot.docs.map(doc => {
      const timestamp = doc.data().timestamp;
      const seconds = timestamp.seconds;
      const nanoseconds = timestamp.nanoseconds;
            
      // Calcola i millisecondi totali e crea un oggetto Date
      const milliseconds = (seconds * 1000) + Math.floor(nanoseconds / 1000000);
      const dataFerie = new Date(milliseconds);
      dataFerie.setDate(dataFerie.getDate() + 1);

      return dataFerie.toISOString().split('T')[0];
    });

  } catch (error) {
    mostraToast('Errore nel caricamento dei dati');
  } finally {
    isOpenLoading.value = false;
  }
};

const mostraToast = async (message, type = 'error') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color: type === 'error' ? 'danger' : 'success',
    position: 'top'
  });
  await toast.present();
};

// Lifecycle Hooks
onMounted(async () => {
  await recuperaDati();
});
</script>

<style scoped>
.main-content {
  --ion-background-color: #fffaf5;
  --ion-padding: 16px;
}


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
.calendar-section{
  margin-bottom: 20px;
}


.content-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 1000px;
}

.store-name {
  font-size: 1.8rem;
  color: #2d2d2d;
  margin: 0 0 12px 0;
  text-align: center;
  font-weight: 600;
}

.store-info {
  display: flex;
  align-items: center;
  margin: 8px 0;
  padding: 12px;
  background: #fff8f0;
  border-radius: 8px;
}

.info-icon {
  font-size: 1.2rem;
  color: #e27108;
  margin-right: 12px;
}

.store-address, .store-phone {
  margin: 0;
  color: #4a4a4a;
  font-size: 0.95rem;
}

.divider {
  height: 1px;
  background: #eee;
  margin: 20px 0;
}

.description-section {
  padding: 16px;
  background: #fff8f0;
  border-radius: 8px;
}

.section-title {
  font-size: 1.2rem;
  color: #2d2d2d;
  margin: 0 0 12px 0;
}

.store-description {
  color: #666;
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

.calendar-section {
  margin-bottom: 300px;
  margin: 24px 0;
}

.custom-datetime {
  --background: #fff8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.service-selector {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #e27108;
  padding: 16px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: background 0.3s ease;
}

.service-selector:active {
  background: #d2690e;
}

.selector-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selector-icon {
  color: white;
  font-size: 1.5rem;
}

.selector-text {
  flex-grow: 1;
  margin: 0 16px;
}

.selector-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin: 0 0 4px 0;
}

.selected-service {
  color: white;
  font-weight: 500;
  margin: 0;
}

.arrow-icon {
  color: white;
  font-size: 1.2rem;
}

.service-modal .modal-content {
  --background: #fffaf5;
  padding: 20px;
}

.service-item {
  border: 1px solid #d2690e ;
  background-color: #e2710836;
  border-radius: 20px;
  --padding-start: 0;
  --padding-end: 0;
  margin: 20px;
  padding: 10px;
}

.service-label h3 {

  color: #e27108;
  margin:5px;
  font-size: large;

}

.service-details {
  margin:5px;
  display: flex;
  gap: 16px;
  color: #292929;
  font-size: normal;
}

.detail-item {
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-popover .popover-content {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.popover-icon {
  color: #e27108;
  font-size: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 3rem;
  color: #e27108;
  opacity: 0.3;
}

.empty-text {
  color: #666;
  margin-top: 16px;
}

@media (min-width: 768px) {
  .main-content {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .service-selector {
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>