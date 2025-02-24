
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary" class="header-toolbar">
        <ion-buttons slot="start">
          <BackButton />
        </ion-buttons>
        <ion-title class="header-title">Prenotazione</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding main-content">
      <ion-loading
        :is-open="loading"
        message="Caricamento..."
        spinner="crescent"
      />

      <!-- Sezione Foto Menu -->
      <div class="menu-section">
        <h2 class="section-title">
          <ion-icon :icon="imagesOutline" class="section-icon" />
          Il Nostro Menu
        </h2>
        <swiper 
          :slides-per-view="2.5" 
          :space-between="10"
          class="menu-swiper">
          <swiper-slide 
            v-for="(photo, index) in menuPhotos" 
            :key="index" 
            @click="openPhoto(photo)"
            class="swiper-slide">
            <div class="image-container">
              <img 
                :src="photo" 
                class="menu-photo" 
                alt="Foto Menu"
                loading="lazy" />
              <div class="image-overlay">
                <ion-icon :icon="expandOutline" class="zoom-icon" />
              </div>
            </div>
          </swiper-slide>
        </swiper>
      </div>

      <!-- Modal Foto -->
      <ion-modal 
        :is-open="isPhotoModalOpen" 
        @didDismiss="closePhoto"
        class="photo-modal">
        <ion-header class="modal-header">
          <ion-toolbar color="primary">
            <ion-title>Visualizza Foto</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closePhoto" class="close-button">
                <ion-icon :icon="closeCircleOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="modal-content">
          <div class="photo-modal-container" @click="toggleZoom">
            <img 
              :src="selectedPhoto" 
              alt="Foto Menu Ingrandita" 
              :class="{ zoomed: isZoomed }"
              class="modal-image" />
          </div>
        </ion-content>
      </ion-modal>

      <!-- Sezione Ordine -->
      <div class="order-section">
        <h2 class="section-title">
          <ion-icon :icon="basketOutline" class="section-icon" />
          Il Tuo Ordine
        </h2>
        
        <div class="order-list" v-if="order.length > 0">
          <ion-list lines="none" class="order-items">
            <ion-item 
              v-for="(item, index) in order" 
              :key="index"
              class="order-item">
              <ion-label class="item-name">{{ item.name }}</ion-label>
              
              <div class="quantity-controls">
                <ion-button 
                  @click="decreaseQuantity(index)" 
                  class="quantity-button"
                  :disabled="item.quantity <= 1">
                  <ion-icon :icon="removeOutline" />
                </ion-button>
                
                <ion-label class="quantity-label">{{ item.quantity }}</ion-label>
                
                <ion-button 
                  @click="increaseQuantity(index)" 
                  class="quantity-button">
                  <ion-icon :icon="addOutline" />
                </ion-button>
              </div>
              
              <ion-button 
                @click="removeItem(index)" 
                class="remove-button"
                fill="clear">
                <ion-icon :icon="trashOutline" color="danger" />
              </ion-button>
            </ion-item>
          </ion-list>
        </div>
        
        <div class="empty-state" v-else>
          <ion-icon :icon="fastFoodOutline" class="empty-icon" />
          <p class="empty-text">Nessun articolo aggiunto</p>
        </div>

        <div class="add-item">
          <ion-item class="add-item-input">
            <ion-input
              v-model="newItem.name"
              placeholder="Inserisci prodotto"
              :clear-input="true"
              @keyup.enter="addItem"
              class="custom-input" />
            <ion-button 
              @click="addItem" 
              class="add-button"
              :disabled="!newItem.name.trim()">
              <ion-icon :icon="addCircleOutline" slot="start" />
              Aggiungi
            </ion-button>
          </ion-item>
        </div>
      </div>

      <!-- Sezione Extra -->
  <!-- Sezione Extra -->
<div class="extra-info-section">
  <div class="extra-info-header" @click="toggleExtraInfo()">
    <p class="toggle-text">Clicca per informazioni Aggiuntive</p>
  </div>
  
  <ion-list v-if="showExtraInfo" class="extra-info-list">
    <!-- Toggle Consegna a Casa -->
    <ion-item class="extra-info-item">
      <ion-icon :icon="homeOutline" slot="start" color="primary" />
      <ion-label>Consegna a domicilio</ion-label>
      <ion-toggle 
        :checked="consegnaACasa" 
        color="primary" 
        @ionChange="handleDeliveryToggle()" />
    </ion-item>

    <!-- Campi Indirizzo (visibili solo se toggle attivo) -->
    <div v-if="consegnaACasa" class="address-fields">
      <ion-item class="extra-info-item">
        <ion-icon :icon="locationOutline" slot="start" color="primary" />
        <ion-input
          v-model="extraInfo.indirizzo"
          placeholder="Via/Piazza"
          required
          class="custom-input"
          :class="{ 'input-error': addressError }" />
      </ion-item>
      
      <ion-item class="extra-info-item">
        <ion-icon :icon="locationOutline" slot="start" color="primary" />
        <ion-input
          v-model="extraInfo.civico"
          placeholder="Numero Civico"
          required
          type="number"
          class="custom-input"
          :class="{ 'input-error': addressError }" />
      </ion-item>
    </div>

    <!-- Note (esistente) -->
    <ion-item class="extra-info-item">
      <ion-label position="stacked" class="input-label">
        <ion-icon :icon="documentTextOutline" class="label-icon" />
        Note
      </ion-label>
      <ion-textarea
        v-model="extraInfo.notes"
        placeholder="Inserisci tutte le informazioni aggiuntive qui come: note particolari, allergie."
        auto-grow
        rows="2"
        class="custom-textarea" />
    </ion-item>
  </ion-list>
</div>

      <!-- Sezione Orario -->
      <div class="time-section">
        <h2 class="section-title">
          <ion-icon :icon="timeOutline" class="section-icon" />
          Orario Prenotazione
        </h2>
        
        <ion-datetime
          v-model="selectedTime"
          presentation="date-time"
          prefer-wheel
          :min="minDate"
          :max="maxDate"
          class="custom-datetime">
          
          <div slot="time-label" class="datetime-header">Seleziona Data e Ora</div>
        </ion-datetime>
      </div>

      <!-- Bottone Conferma -->
      <ion-button 
        expand="block" 
        class="submit-button"
        @click="submitOrder"
        :disabled="order.length === 0">
        <ion-icon :icon="checkmarkCircleOutline" slot="start" />
        Conferma Prenotazione
      </ion-button>
    </ion-content>
  </ion-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList,
  IonItem, IonLabel, IonInput, IonButton, IonDatetime, IonButtons,
  IonModal, IonTextarea, IonLoading, IonIcon, IonToast,IonToggle
} from '@ionic/vue';
import { 
  imagesOutline, expandOutline, closeCircleOutline, basketOutline,
  removeOutline, addOutline, trashOutline, fastFoodOutline,
  addCircleOutline, documentTextOutline, timeOutline, checkmarkCircleOutline,
  alertCircleOutline,homeOutline, locationOutline, chevronDownOutline,
  chevronUpOutline
} from 'ionicons/icons';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/swiper-bundle.css';
import { 
  getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, getDocs 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { 
  getStorage, ref as storageReference, listAll, getDownloadURL 
} from 'firebase/storage';
import BackButton from '@/views/Components/BackButton.vue';
import { useStore } from 'vuex';
import router from '@/router';
import { toastController } from '@ionic/vue';

// Inizializzazione Firebase
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();
const store = useStore();

// Variabili reattive
const loading = ref(true);
const menuPhotos = ref([]);
const order = ref([]);
const newItem = ref({ name: '', quantity: 1 });
const selectedTime = ref(new Date().toISOString());
const isPhotoModalOpen = ref(false);
const selectedPhoto = ref('');
const showExtraInfo = ref(false);
const isZoomed = ref(false);
const ferieDates = ref([]);
const minDate = new Date().toISOString();
const maxDate = new Date(Date.now() + 12096e5).toISOString(); // 2 settimane

const consegnaACasa = ref(false);
const addressError = ref(false);    

const extraInfo = ref({ 
  notes: '', 
  indirizzo: '', 
  civico: '' 
});


const handleDeliveryToggle = () => {
  consegnaACasa.value = !consegnaACasa.value;
  if(!consegnaACasa.value) {
    extraInfo.value.indirizzo = '';
    extraInfo.value.civico = '';
  }
};

// Watcher per la data selezionata
watch(selectedTime, async (newVal) => {
  if (!newVal) return;
  
  const selectedDate = new Date(newVal).toISOString().split('T')[0];
  if (ferieDates.value.includes(selectedDate)) {
    selectedTime.value = '';
    showErrorToast('Data non disponibile - il locale è in ferie');
  }
});

// Lifecycle Hooks
onMounted(async () => {
  try {
    await Promise.all([loadMenuPhotos(), loadFerieDates()]);
    selectedTime.value = new Date().toLocaleString('sv-SE').replace(' ', 'T');
  } catch (error) {
    showErrorToast('Errore nel caricamento dei dati');
  } finally {
    loading.value = false;
  }
});

// Funzioni per il caricamento dei dati
const loadMenuPhotos = async () => {
  try {
    const idNegozio = store.getters.getIdDocumentNegozioSelezionato;
    if (!idNegozio) throw new Error('Nessun negozio selezionato');
    
    const listRef = storageReference(storage, `menuPhotos/${idNegozio}`);
    const res = await listAll(listRef);
    menuPhotos.value = await Promise.all(
      res.items.map(async item => await getDownloadURL(item))
    );
  } catch (error) {
    showErrorToast('Impossibile caricare le foto del menu');
    console.error('Errore foto menu:', error);
  }
};

const loadFerieDates = async () => {
  try {
    const idNegozio = store.getters.getIdDocumentNegozioSelezionato;
    const ferieRef = collection(db, 'Negozi', idNegozio, 'Ferie');
    const snapshot = await getDocs(ferieRef);
    ferieDates.value = snapshot.docs.map(d => d.data().date.split('T')[0]);
  } catch (error) {
    showErrorToast('Impossibile verificare le date disponibili');
    console.error('Errore date ferie:', error);
  }
};

// Gestione ordine
const addItem = () => {
  if (newItem.value.name.trim()) {
    order.value.push({ 
      ...newItem.value,
      name: newItem.value.name.trim()
    });
    newItem.value = { name: '', quantity: 1 };
  }
};

const removeItem = (index) => {
  order.value.splice(index, 1);
};

const increaseQuantity = (index) => {
  order.value[index].quantity++;
};

const decreaseQuantity = (index) => {
  if (order.value[index].quantity > 1) {
    order.value[index].quantity--;
  }
};

// Gestione foto
const openPhoto = (photo) => {
  selectedPhoto.value = photo;
  isPhotoModalOpen.value = true;
  isZoomed.value = false;
};

const closePhoto = () => {
  isPhotoModalOpen.value = false;
};

const toggleZoom = () => {
  isZoomed.value = !isZoomed.value;
};

// Gestione prenotazione
const submitOrder = async () => {
  loading.value = true;
  
  try {
    if (!validateForm()) return;
    
    const user = auth.currentUser;
    if (!user) throw new Error('Utente non autenticato');
    
    const idNegozio = store.getters.getIdDocumentNegozioSelezionato;
    const clienteDoc = await getDoc(doc(db, 'Cliente', user.uid));
    const negozioDoc = await getDoc(doc(db, 'Negozi', idNegozio));
    
    if (!clienteDoc.exists() || !negozioDoc.exists()) {
      throw new Error('Dati utente/negozio non trovati');
    }

    const prenotazioneData = {
      ordine: order.value,
      dataPrenotazione: new Date(selectedTime.value),
      noteAggiuntive: extraInfo.value.notes,
      idDocumentCliente: user.uid,
      idDocumentNegozio: idNegozio,
      proprietarioUid: negozioDoc.data().proprietarioUid,
      nomeCliente: `${clienteDoc.data().nome} ${clienteDoc.data().cognome}`,
      timestampDataPrenotazione: serverTimestamp(),
      stato: 'Da accettare',
      consegnaACasa: consegnaACasa.value,
      indirizzoConsegna: consegnaACasa.value ? {
      via: extraInfo.value.indirizzo,
      civico: extraInfo.value.civico
  } : null,
    };

    await addDoc(collection(db, 'Prenotazioni'), prenotazioneData);
    
    await showSuccessToast('Prenotazione caricata. Attendi che il gestore accetti la prenotazione!');
    router.back();
  } catch (error) {
    showErrorToast('Errore durante l\'invio della prenotazione');
    console.error('Errore prenotazione:', error);
  } finally {
    loading.value = false;
  }
};

const validateForm = () => {

  if (!selectedTime.value) {
    showErrorToast('Seleziona un orario valido');
    return false;
  }
  
  if (new Date(selectedTime.value) < new Date()) {
    showErrorToast('Non puoi selezionare un orario passato');
    return false;
  }
  
  if (order.value.length === 0) {
    showErrorToast('Aggiungi almeno un articolo all\'ordine');
    return false;
  }
  if(consegnaACasa.value && (!extraInfo.value.indirizzo.trim() || !extraInfo.value.civico.trim())) {
    showErrorToast('Inserisci l\'indirizzo completo per la consegna');
    addressError.value = true;
    return false;
  }
  addressError.value = false;
  
  return true;
};

// Gestione UI
const toggleExtraInfo = () => {
  showExtraInfo.value = !showExtraInfo.value;
};

const showSuccessToast = async (message) => {
  const toast = await toastController.create({
    message,
    duration: 5000,
    color: 'success',
    position: 'top',
    icon: checkmarkCircleOutline,
    buttons: [{ icon: closeCircleOutline, role: 'cancel' }]
  });
  await toast.present();
};

const showErrorToast = async (message) => {
  const toast = await toastController.create({
    message,
    duration: 4000,
    color: 'danger',
    position: 'top',
    icon: alertCircleOutline,
    buttons: [{ icon: closeCircleOutline, role: 'cancel' }]
  });
  await toast.present();
};
</script>

<style scoped>
/* Stili Base */
:root {
  --ion-font-family: 'Segoe UI', system-ui, sans-serif;
}

.header-title {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.main-content {
  --background: #f8f9fa;
  --ion-padding: 16px;
}

.time-section {
display: flex;
flex-direction: column;
align-items: center;

}

/* Sezioni */
.section-title {
  display: flex;
  align-items: center;
  color: #2c3e50;
  margin: 1.5rem 0;
  font-size: 1.4rem;
}

.section-icon {
  margin-right: 12px;
  font-size: 1.6rem;
  color: 'primary';
}

/* Swiper */
.menu-swiper {
  padding: 8px 0 16px;
}

.swiper-slide {
  transition: transform 0.2s ease;
}

.swiper-slide-active {
  transform: scale(1.03);
}

.image-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.image-container:hover {
  transform: translateY(-2px);
}

.menu-photo {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.zoom-icon {
  color: rgb(225, 0, 0);
  font-size: 2rem;
}

/* Ordine */
.order-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.1s ease;
}

.order-item:active {
  transform: scale(0.98);
}

.item-name {
  font-weight: 500;
  white-space: normal;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 12px;
}

.quantity-button {
  --padding-start: 8px;
  --padding-end: 8px;
  --border-radius: 50%;
  width: 32px;
  height: 32px;
}

.quantity-label {
  min-width: 28px;
  text-align: center;
  font-weight: 600;
  color: 'primary';
}

.remove-button {
  --padding-start: 4px;
  --padding-end: 4px;
}

.empty-state {
  text-align: center;
  padding: 2rem 0;
}

.empty-icon {
  font-size: 3rem;
  color: #e0e0e0;
  margin-bottom: 1rem;
}

.empty-text {
  color: #9e9e9e;
  font-size: 0.9rem;
}

/* Form */
.add-item-input {
  --background: white;
  --border-radius: 8px;
  margin-top: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.custom-input {
  --padding-start: 12px;
  --padding-end: 12px;
}

.add-button {
  --border-radius: 8px;
  --padding-start: 16px;
  --padding-end: 16px;
  margin-right: 8px;
}

/* Extra Info */
.extra-info-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin: 1rem 0;
  cursor: pointer;
  transition: background 0.2s ease;
}

.extra-info-header:active {
  background: #f3f3f3;
}

.toggle-text {
  color: "primary";
  font-weight: 500;
  margin: 0;
}

.extra-info-list {
  background: transparent;
}

.extra-info-item {
  --background: white;
  border-radius: 8px;
  margin-bottom: 8px;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.custom-textarea {
  --background: #f8f9fa;
  border-radius: 8px;
  margin-top: 8px;
}

/* DateTime */
.custom-datetime {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.datetime-header {
  text-align: center;
  padding: 12px;
  font-weight: 500;
}

/* Bottone Conferma */
.submit-button {
  --padding-top: 16px;
  --padding-bottom: 16px;
  margin: 2rem 0 1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Modal Foto */
.photo-modal {
  --width: 100%;
  --height: 100%;
  --max-width: 800px;
  --max-height: 80vh;
}

.modal-image {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: zoom-in;
  width: 100%;
  height: 100%;
}

.modal-image.zoomed {
  transform: scale(2);
  cursor: zoom-out;
}
/* Stile per i campi indirizzo */
.address-fields {
  padding: 0 16px;
}

/* Stile errore campi indirizzo */
.input-error {
  border: 1px solid var(--ion-color-danger);
  border-radius: 8px;
}

/* Margine per gli elementi dell'indirizzo */
.extra-info-item {
  margin-bottom: 8px;
}

/* Allineamento toggle */
.extra-info-list  {
  padding-inline-end: 0;
}


</style>