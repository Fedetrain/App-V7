<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title class="toolbar-title">Le tue prenotazioni</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-loading 
      :is-open="isOpenLoading" 
      message="Caricamento..."
      spinner="crescent"
      class="custom-loading"
    ></ion-loading>

    <ion-content class="ion-padding-horizontal">
      <div v-if="!isPrenotazioniEmpty" class="cards-container">
        <ion-card
          v-for="prenotazione in prenotazioni"
          :key="prenotazione.dataPrenotazione"
          class="custom-card animated-card"
        >
          <ion-card-header class="card-header">
            <div class="header-content">
              <ion-card-title class="shop-title">
                {{ prenotazione.nomeNegozio }}
                <ion-icon
                  :icon="trashOutline"
                  class="trash-icon"
                  @click="handleDelete(prenotazione)"
                ></ion-icon>
              </ion-card-title>
              
              <div class="booking-time-container">
                <ion-icon :icon="timeOutline" class="time-icon"></ion-icon>
                <span class="booking-time">{{ formattaData(prenotazione.dataPrenotazione) }}</span>
              </div>
            </div>
          </ion-card-header>

          <ion-card-content class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <ion-icon :icon="callOutline" class="info-icon"></ion-icon>
                <span>{{ prenotazione.cellulareNegozio }}</span>
              </div>
              
              <div class="info-item">
                <ion-icon :icon="locationOutline" class="info-icon"></ion-icon>
                <span>{{ prenotazione.indirizzoNegozio }}, {{ prenotazione.cittaNegozio }}</span>
              </div>
              
              <div class="info-item highlight">
                <ion-icon :icon="briefcaseOutline" class="info-icon"></ion-icon>
                <span v-if="prenotazione.servizioSelezionato">{{ prenotazione.servizioSelezionato.nome}}</span>
              </div>
            </div>

            <!-- Dettagli specifici -->
            <div v-if="prenotazione.ordine" class="order-details">
              <div class="status-badge" :class="getStatusClass(prenotazione.stato)">
                {{ prenotazione.stato }}
              </div>

              <div class="additional-info">
                <div v-if="prenotazione.noteAggiuntive" class="info-note">
                  <ion-icon :icon="documentTextOutline" class="note-icon"></ion-icon>
                  <span>{{ prenotazione.noteAggiuntive }}</span>
                </div>
                
                <div v-if="prenotazione.allergie" class="info-warning">
                  <ion-icon :icon="warningOutline" class="warning-icon"></ion-icon>
                  <span>{{ prenotazione.allergie }}</span>
                </div>
              </div>

              <div class="action-bar">
                <ion-button 
                  class="order-button"
                  fill="solid" 
                  @click="apriModale(prenotazione.ordine)"
                >
                  <ion-icon slot="start" :icon="listOutline"></ion-icon>
                  Visualizza Ordine
                </ion-button>
                
                <div v-if="prenotazione.stato === 'Accettato'" class="queue-info">
                  <ion-icon :icon="peopleOutline" class="queue-icon"></ion-icon>
                  <span>Posizione in coda: {{ prenotazione.prenotazioniPrima + 1 }}</span>
                </div>
              </div>
            </div>

            <div v-else class="service-details">
              <div style="display: flex; align-items: center; gap: 20px; font-size: 1.2rem;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <ion-icon :icon="hourglassOutline" style="font-size: 1.5rem;"></ion-icon>
                  <span>{{ prenotazione.durataServizioSelezionato }} min</span>
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px;">
                  <ion-icon :icon="playOutline" style="font-size: 1.5rem;"></ion-icon>
                  <span>{{ prenotazione.oraInizio }}</span>
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px;">
                  <ion-icon :icon="stopOutline" style="font-size: 1.5rem;"></ion-icon>
                  <span>{{ prenotazione.oraFine }}</span>
                </div>
              </div>
              
              <div v-if="prenotazione.commento" class="comment-box">
                <ion-icon :icon="chatboxOutline" class="comment-icon"></ion-icon>
                <p>{{ prenotazione.commento }}</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <div v-else class="empty-state">
        <ion-icon :icon="calendarOutline" class="empty-icon"></ion-icon>
        <p class="empty-text">Nessuna prenotazione in programma</p>
      </div>

      <!-- Modale Ordine -->
      <ion-modal 
        :is-open="modaleAperto" 
        @did-dismiss="chiudiModale"
        class="custom-modal"
        :breakpoints="[0, 0.9]"
        :initialBreakpoint="0.9"
      >
        <div class="modal-content">
          <ion-toolbar color="primary" class="modal-header">
            <ion-title>Dettaglio Ordine</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="chiudiModale" class="close-button">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
          
          <ion-content class="modal-body">
            <div class="order-list-container">
              <div v-for="(item, index) in ordineVisualizzato" :key="index" class="order-item">
                <div class="item-content" :class="{ 'item-completed': item.fatto }">
                  <div class="item-info">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-quantity">x{{ item.quantity }}</span>
                  </div>
                  <div v-if="item.ingredienti" class="item-ingredients">
                    {{ item.ingredienti.join(', ') }}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="order-summary">
              <div class="total-items">
                Articoli totali: <strong>{{ calcolaTotalePizze() }}</strong>
              </div>
            </div>
          </ion-content>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonIcon, IonLoading, IonButton, IonModal,
  IonButtons, toastController, alertController, onIonViewDidEnter 
} from '@ionic/vue';
import { 
  trashOutline, timeOutline, callOutline, locationOutline, 
  briefcaseOutline, documentTextOutline, warningOutline,
  listOutline, peopleOutline, hourglassOutline, playOutline,
  stopOutline, chatboxOutline, calendarOutline, closeOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';import {
  getFirestore,
  collection,
  where,
  query,
  getDocs,
  orderBy,
  doc,
  getDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const db = getFirestore();
const uid = auth.currentUser && auth.currentUser.uid;

const prenotazioni = ref([]);
const isOpenLoading = ref(false);

// Variabili e metodi per il modal
const modaleAperto = ref(false);
const ordineVisualizzato = ref([]); // Array di oggetti { name, quantity, fatto }

const chiudiModale = () => {
  modaleAperto.value = false;
};

const apriModale = (ordine) => {
  try {
    ordineVisualizzato.value = typeof ordine === 'string' ? JSON.parse(ordine) : ordine;
    modaleAperto.value = true;
  } catch (error) {
    presentToast('Errore nella visualizzazione dell\'ordine');
    console.error('Errore parsing ordine:', error);
  }
};

function calcolaTotalePizze() {
  return ordineVisualizzato.value.reduce(
    (totale, item) => totale + item.quantity,
    0
  );
}

const formattaData = (timestamp) => {
  const options = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return new Date(timestamp.toMillis()).toLocaleString('it-IT', options);
};

const isPrenotazioniEmpty = computed(() => prenotazioni.value.length === 0);

// Funzione che restituisce la classe CSS in base allo stato
const getStatusClass = (stato) => ({
  'Da accettare': 'status-pending',
  'Accettato': 'status-accepted',
  'Completato': 'status-completed'
}[stato]);

// Funzione per contare le prenotazioni del giorno corrente con stato "Accettato"
// e orario inferiore alla prenotazione corrente
async function contaPrenotazioniPrima(bookingTimestamp) {
  const bookingDate = new Date(bookingTimestamp.toMillis());
  // Calcola l'inizio e la fine della giornata della prenotazione
  const dayStart = new Date(bookingDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(bookingDate);
  dayEnd.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, 'Prenotazioni'),
    where('dataPrenotazione', '>=', Timestamp.fromDate(dayStart)),
    where('dataPrenotazione', '<', bookingTimestamp),
    where('stato', '==', 'Accettato')
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

async function recuperaInformazioniNegozio(idDocumentNegozio) {
  try {
    const negoziRef = doc(db, 'Negozi', idDocumentNegozio);
    const querySnapshot = await getDoc(negoziRef);
    if (querySnapshot.exists()) {
      const negozio = querySnapshot.data();
      return negozio;
    } else {
      console.error('Nessun documento trovato per il negozio con ID:', idDocumentNegozio);
      return null;
    }
  } catch (error) {
    console.error('Errore durante il recupero del negozio:', error);
    return null;
  }
}

const handleDelete = async (prenotazione) => {

  const alert = await alertController.create({
    header: 'Conferma eliminazione',
    message: 'Sei sicuro di voler eliminare questa prenotazione?',
    buttons: [
      {
        text: 'Annulla',
        role: 'cancel',
        cssClass: 'secondary',
        handler: () => console.log('Eliminazione annullata'),
      },
      {
        text: 'Elimina',
        handler: async () => {
          try {

            if (prenotazione.stato == 'Accettato') {
              return presentToast('Non puoi eliminare questa prenotazione. L\'ordine è già in preparazione.');
            }
            
            const now = new Date();
            const oraInizioPrenotazione = new Date(prenotazione.dataPrenotazione.toMillis());

            if (prenotazione.oraInizio) {
              const [hours, minutes] = prenotazione.oraInizio.split(':').map(Number);
              oraInizioPrenotazione.setHours(hours, minutes);
            }

            const diffOre = (oraInizioPrenotazione.getTime() - now.getTime()) / (1000 * 60 * 60);
            
            if (diffOre <= 2) {
              return presentToast("Non è possibile eliminare la prenotazione. Meno di 2 ore all'inizio del servizio.");
            }
            
            isOpenLoading.value = true;
            await deleteDoc(doc(db, 'Prenotazioni', prenotazione.idDocumentPrenotazione));
            presentToast('Prenotazione eliminata con successo');
            await recuperaPrenotazioni();
          } catch (error) {
            console.error('Errore durante l\'eliminazione:', error);
            presentToast('Si è verificato un errore durante l\'eliminazione.');
          } finally {
            isOpenLoading.value = false;
          }
        },
      },
    ],
  });

  await alert.present();
};

onIonViewDidEnter(async () => {
  isOpenLoading.value = true;
  if (!uid) {
    console.error("UID non disponibile. L'utente potrebbe non essere autenticato.");
    presentToast("Errore: utente non autenticato.");
    isOpenLoading.value = false;
    return;
  }
  await recuperaPrenotazioni();
});

async function recuperaPrenotazioni() {
  try {
    const now = new Date();
    const nowTimestamp = Timestamp.fromDate(now);
    const prenotazioniRef = collection(db, 'Prenotazioni');
    const q = query(
      prenotazioniRef,
      where('idDocumentCliente', '==', uid),
      orderBy('dataPrenotazione')
    );
    const snapshot = await getDocs(q);
    prenotazioni.value = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        data.idDocumentPrenotazione = docSnap.id;
        const informazioniNegozio = await recuperaInformazioniNegozio(data.idDocumentNegozio);
        if (informazioniNegozio) {
          data.nomeNegozio = informazioniNegozio.nomeNegozio;
          data.cellulareNegozio = informazioniNegozio.cellulareNegozio;
          data.cittaNegozio = informazioniNegozio.cittaNegozio;
          data.indirizzoNegozio = informazioniNegozio.indirizzoNegozio;
        }
        if (data.ordine) {
          // Se esiste l'ordine, assegna "Da accettare" (oppure lo stato potrebbe essere già impostato nel DB)
          data.stato = data.stato || 'Da accettare';
        }
        // Se lo stato è "Accettato", recupera il numero delle prenotazioni del giorno corrente prima di me
        if (data.stato === 'Accettato') {
          data.prenotazioniPrima = await contaPrenotazioniPrima(data.dataPrenotazione);
        }
        return data;
      })
    );
  } catch (error) {
    console.error('Errore durante il recupero delle prenotazioni:', error);
    presentToast("Errore durante il recupero delle prenotazioni");
  } finally {
    isOpenLoading.value = false;
  }
}

async function presentToast(message) {
  const toast = await toastController.create({
    message: message,
    duration: 2000
  });
  await toast.present();
}
</script>

<style scoped>
/* Stili base */
.cards-container {
  display: grid;
  gap: 1.2rem;
  padding: 0.5rem 0;
}

.custom-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: visible;
}

.custom-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  padding: 1rem 1.5rem 0.5rem;
  background: linear-gradient(to right, #f8f9fa, #e9ecef);
  border-bottom: 2px solid #dee2e6;
}

.shop-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.4rem;
  color: #2c3e50;
}

.trash-icon {
  color: #e74c3c;
  font-size: 1.4rem;
  padding: 0.5rem;
  transition: color 0.2s ease;
}

.trash-icon:hover {
  color: #c0392b;
}

.booking-time-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.8rem;
  color: #3498db;
  font-weight: 500;
}

.time-icon {
  font-size: 1.1rem;
}

.card-body {
  padding: 1rem 1.5rem;
}

.info-grid {
  display: grid;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  color: #34495e;
}

.info-icon {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.highlight {
  font-weight: 600;
  color: #2c3e50;
}

/* Stili stato */
.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
}

.status-pending {
  background: #f1c40f;
  color: #2c3e50;
}

.status-accepted {
  background: #2ecc71;
  color: white;
}

.status-completed {
  background: #95a5a6;
  color: white;
}

/* Modale */
.custom-modal {
  --border-radius: 16px;
  --box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.modal-header {
  border-radius: 16px 16px 0 0;
  padding: 0.5rem 1rem;
}

.modal-body {
  padding: 1rem;
  background: #f8f9fa;
}

.order-item {
  padding: 0.8rem;
  background: white;
  border-radius: 12px;
  margin-bottom: 0.8rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.item-completed {
  opacity: 0.6;
  text-decoration: line-through;
}

.item-name {
  font-weight: 600;
  color: #2c3e50;
}

.item-quantity {
  color: #7f8c8d;
  font-size: 0.9rem;
}

/* Altri stili */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  color: #bdc3c7;
  margin-bottom: 1.5rem;
}

.empty-text {
  color: #7f8c8d;
  font-size: 1.2rem;
  font-weight: 500;
}

.order-button {
  --border-radius: 12px;
  --padding-top: 0.8rem;
  --padding-bottom: 0.8rem;
  font-weight: 600;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.2rem;
}

.queue-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e67e22;
  font-weight: 500;
}

/* Animazioni */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animated-card {
  animation: slideIn 0.4s ease-out;
}

.custom-loading {
  --spinner-color: #2c3e50;
  --background: rgba(255, 255, 255, 0.9);
  --backdrop-opacity: 0.4;
}
</style>