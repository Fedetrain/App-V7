<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-segment v-model="segmentValue" @ionChange="segmentChanged" class="custom-segment">
          <ion-segment-button value="accettati" class="segment-button">
            <ion-label class="segment-label">In corso ({{ prenotazioniAccettate.length }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="daAccettare" class="segment-button">
            <ion-label class="segment-label">Nuovi ({{ prenotazioniDaAccettare.length }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="Completati" class="segment-button">
            <ion-label class="segment-label">Completati ({{ prenotazioniCompletate.length }})</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-horizontal">
      <!-- Prenotazioni Da Accettare -->
      <p v-if="prenotazioniDaAccettare.length === 0 " style="display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 18px; font-weight: bold; color: #555;">
  Nessuna prenotazione disponibile
</p>
      <div v-if="segmentValue === 'daAccettare'" class="section">
        <ion-list lines="none">
          <ion-item 
            v-for="prenotazione in prenotazioniDaAccettare" 
            :key="prenotazione.id" 
            class="prenotazione-item"
          >
            <ion-label class="ion-text-wrap">
              <div class="prenotazione-header">
                <div class="header-content">
                  <h2 class="customer-name">{{ prenotazione.nomeCliente }}</h2>
                  <ion-avatar class="customer-avatar" @click="apriInformazioniCliente(prenotazione)">
                    <img alt="Avatar" src="https://ionicframework.com/docs/img/demos/avatar.svg" />
                  </ion-avatar>
                </div>
                <time class="booking-time">{{ formatDate(prenotazione.dataPrenotazione) }}</time>

              </div>
              
              <div class="prenotazione-details">
                <div class="datetime-container">
                  <p style="font-size:xx-small;color: orange;">Tocca l'orario per modificarlo</p>
                  <ion-datetime-button 
                    :datetime="'datetime-' + prenotazione.id" 
                    class="datetime-button"
                  ></ion-datetime-button>
                  <ion-modal keepContentsMounted="true">
                    <ng-template>
                      <ion-datetime 
                        :id="'datetime-' + prenotazione.id" 
                        presentation="time" 
                        :value="prenotazione.dataPrenotazione.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })" 
                        @ionChange="modificaOrarioPrenotazione(prenotazione.id, $event)"
                        class="time-picker"
                      ></ion-datetime>
                    </ng-template>
                  </ion-modal>
                </div>

                <div class="info-grid">
                  <div v-if="prenotazione.consegnaACasa" class="info-item-address-info">
                    <ion-badge 
                      v-if="prenotazione.consegnaACasa" 
                      color="warning" 
                      class="delivery-badge"
                    >
                      <ion-icon :icon="homeOutline" class="badge-icon"></ion-icon>
                      A domicilio
                    </ion-badge>
                    <ion-icon :icon="locationOutline" class="info-icon"></ion-icon>
                    <span class="info-text">
                      {{ prenotazione.indirizzoConsegna?.via }} {{ prenotazione.indirizzoConsegna?.civico }}
                    </span>

                  </div>

                  <div class="info-item">
                    <ion-icon :icon="documentTextOutline" class="info-icon"></ion-icon>
                    <span class="info-text">{{ prenotazione.noteAggiuntive || 'Nessuna nota aggiuntiva' }}</span>
                  </div>
                  <div class="info-item">
                    <ion-icon :icon="clipboardOutline" class="info-icon"></ion-icon>
                    <span class="info-text">Totale: {{ calcolaTotalePizzeOrdine(prenotazione.ordine) }}</span>
                  </div>
                </div>
              </div>

              <div class="prenotazione-actions">
                <ion-button 
                  fill="outline" 
                  @click="apriModale(prenotazione.ordine)"
                  class="action-button"
                >
                  <ion-icon slot="start" :icon="listOutline"></ion-icon>
                  Dettaglio ordine
                </ion-button>
                <div class="decision-buttons">
                  <ion-button
                    color="success" 
                    @click="accettaPrenotazione(prenotazione.id)"
                    class="decision-button"
                  >
                    <ion-icon slot="start" :icon="checkmarkCircleOutline"></ion-icon>
                    Accetta
                  </ion-button>
                  <ion-button 
                    color="danger" 
                    @click="rifiutaPrenotazione(prenotazione.id)"
                    class="decision-button"
                  >
                    <ion-icon slot="start" :icon="closeCircleOutline"></ion-icon>
                    Rifiuta
                  </ion-button>
                </div>
              </div>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>

      <!-- Prenotazioni Accettate -->
      <div v-if="segmentValue === 'accettati'" class="section">

        <p v-if="prenotazioniAccettate.length === 0 " style="display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 18px; font-weight: bold; color: #555;">
  Nessuna prenotazione disponibile
</p>

        <ion-list lines="none">
          <ion-item 
            v-for="prenotazione in prenotazioniAccettate" 
            :key="prenotazione.id" 
            class="prenotazione-item elevation"
          >
            <ion-label class="ion-text-wrap">
              <div class="prenotazione-header">
                <div class="header-content">
                  <h2 class="customer-name">{{ prenotazione.nomeCliente }}</h2>
                  <ion-avatar class="customer-avatar" @click="apriInformazioniCliente(prenotazione)">
                    <img alt="Avatar" src="https://ionicframework.com/docs/img/demos/avatar.svg" />
                  </ion-avatar>
                </div>
                <time class="booking-time">{{ formatDate(prenotazione.dataPrenotazione) }}</time>
              </div>

              <div class="prenotazione-details">
                <div class="datetime-container">
                  <p style="font-size:xx-small;color: orange;">Tocca l'orario per modificarlo</p>
                  <ion-datetime-button 
                    :datetime="'datetime-' + prenotazione.id" 
                    class="datetime-button"
                  ></ion-datetime-button>
                  <ion-modal keepContentsMounted="true">
                    <ng-template>
                      <ion-datetime 
                        :id="'datetime-' + prenotazione.id" 
                        presentation="time" 
                        :value="prenotazione.dataPrenotazione.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })" 
                        @ionChange="modificaOrarioPrenotazione(prenotazione.id, $event)"
                        class="time-picker"
                      ></ion-datetime>
                    </ng-template>
                  </ion-modal>
          
                </div>

                <div class="info-grid">

                  <div v-if="prenotazione.consegnaACasa" class="info-item-address-info">
                    <ion-badge 
                      v-if="prenotazione.consegnaACasa" 
                      color="warning" 
                      class="delivery-badge"
                    >
                      <ion-icon :icon="homeOutline" class="badge-icon"></ion-icon>
                      A domicilio
                    </ion-badge>
                    <ion-icon :icon="locationOutline" class="info-icon"></ion-icon>
                    <span class="info-text">
                      {{ prenotazione.indirizzoConsegna?.via }} {{ prenotazione.indirizzoConsegna?.civico }}
                    </span>

                  </div>

                  <div class="info-item">
                    <ion-icon :icon="documentTextOutline" class="info-icon"></ion-icon>
                    <span class="info-text">{{ prenotazione.noteAggiuntive || 'Nessuna nota aggiuntiva' }}</span>
                  </div>
                  <div class="info-item">
                    <ion-icon :icon="clipboardOutline" class="info-icon"></ion-icon>
                    <span class="info-text">Totale: {{ calcolaTotalePizzeOrdine(prenotazione.ordine) }}</span>
                  </div>
                </div>
              </div>

              <div class="prenotazione-actions">
                <ion-button 
                  fill="outline" 
                  @click="apriModale(prenotazione.ordine)"
                  class="action-button"
                >
                  <ion-icon slot="start" :icon="listOutline"></ion-icon>
                  Dettaglio ordine
                </ion-button>
                <ion-button 
                  color="secondary" 
                  @click="completaOrdine(prenotazione)"
                  class="complete-button"
                >
                  <ion-icon slot="start" :icon="checkmarkDoneOutline"></ion-icon>
                  Completa Ordine
                </ion-button>
              </div>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>

      <!-- Prenotazioni Completate -->
      <div v-if="segmentValue === 'Completati'" class="section">
        <ion-list lines="none">
          <ion-item 
            v-for="prenotazione in prenotazioniCompletate" 
            :key="prenotazione.id" 
            class="prenotazione-item"
          >
            <ion-label class="ion-text-wrap">
              <div class="prenotazione-header">
                <div class="header-content">
                  <h2 class="customer-name">{{ prenotazione.nomeCliente }}</h2>
                  <ion-avatar class="customer-avatar" @click="apriInformazioniCliente(prenotazione)">
                    <img alt="Avatar" src="https://ionicframework.com/docs/img/demos/avatar.svg" />
                  </ion-avatar>
                </div>
                <time class="booking-time">{{ formatDate(prenotazione.dataPrenotazione) }}</time>
              </div>

              <div class="prenotazione-details">
                <div class="datetime-container">
                  <ion-datetime-button 
                    :datetime="'datetime-' + prenotazione.id" 
                    class="datetime-button"
                    disabled
                  ></ion-datetime-button>
                </div>

                <div class="info-grid">

                  <div v-if="prenotazione.consegnaACasa" class="info-item-address-info">
                    <ion-badge 
                      v-if="prenotazione.consegnaACasa" 
                      color="warning" 
                      class="delivery-badge"
                    >
                      <ion-icon :icon="homeOutline" class="badge-icon"></ion-icon>
                      A domicilio
                    </ion-badge>
                    <ion-icon :icon="locationOutline" class="info-icon"></ion-icon>
                    <span class="info-text">
                      {{ prenotazione.indirizzoConsegna?.via }} {{ prenotazione.indirizzoConsegna?.civico }}
                    </span>

                  </div>

                  <div class="info-item">
                    <ion-icon :icon="documentTextOutline" class="info-icon"></ion-icon>
                    <span class="info-text">{{ prenotazione.noteAggiuntive || 'Nessuna nota aggiuntiva' }}</span>
                  </div>
                  <div class="info-item">
                    <ion-icon :icon="pizzaOutline" class="info-icon"></ion-icon>
                  </div>
                </div>
              </div>

              <div class="prenotazione-actions">
                <ion-button 
                  fill="outline" 
                  @click="apriModale(prenotazione.ordine)"
                  class="action-button"
                >
                  <ion-icon slot="start" :icon="listOutline"></ion-icon>
                  Rivedi ordine
                </ion-button>
              </div>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>

      <!-- Modale Ordine -->
      <ion-modal 
        :is-open="modaleAperto" 
        @did-dismiss="chiudiModale"
        class="order-modal"
      >
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Dettaglio Ordine</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="chiudiModale" class="close-button">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="order-container">
            <ul class="order-list">
              <li 
                v-for="(item, index) in ordineVisualizzato" 
                :key="index" 
                class="order-item"
                :class="{'item-completed': item.fatto}"
              >
                <ion-checkbox 
                  v-model="item.fatto" 
                  class="order-checkbox"
                  color="primary"
                ></ion-checkbox>
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-quantity">x{{ item.quantity }}</span>
                </div>
              </li>
            </ul>
            <div class="order-summary">
              <span class="total-label">Totale articoli:</span>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <ion-loading 
        :is-open="loading" 
        message="Elaborazione in corso..." 
        spinner="circles"
        class="custom-loading"
      ></ion-loading>

      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="3000"
        @didDismiss="showToast = false"
        position="top"
        class="custom-toast"
      ></ion-toast>
    </ion-content>

    <AlertInformazioniPrenotazione 
      :is-open="isModalInformazioniClienteOpen" 
      :prenotazioneSelected="prenotazioneSelected" 
      @close-modal="closeModal()"
    />
  </ion-page>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { 
  getFirestore, collection, query, where, getDocs, updateDoc, doc, Timestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { 
  IonAvatar, IonDatetimeButton, IonCheckbox, IonPage, IonHeader, IonToolbar, 
  IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, 
  IonModal, IonSegment, IonSegmentButton, IonLoading, IonToast, IonIcon,IonDatetime,IonBadge
} from '@ionic/vue';
import { 
  checkmarkCircleOutline, closeCircleOutline, listOutline,
  homeOutline, locationOutline , documentTextOutline, clipboardOutline, closeOutline,
  checkmarkDoneOutline
} from 'ionicons/icons';
import AlertInformazioniPrenotazione from '@/views/Components/AlertInformazioniPrenotazione.vue';

const db = getFirestore();
const auth = getAuth();

// State management
const segmentValue = ref('daAccettare');
const prenotazioniDaAccettare = ref([]);
const prenotazioniAccettate = ref([]);
const prenotazioniCompletate = ref([]);
const modaleAperto = ref(false);
const ordineVisualizzato = ref([]);
const isModalInformazioniClienteOpen = ref(false);
const prenotazioneSelected = ref(null);
const loading = ref(false);
const showToast = ref(false);
const toastMessage = ref('');

// Helpers
const formatDate = (timestamp) => {
  try {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Data non disponibile';
  }
};

const calcolaTotalePizzeOrdine = (ordine) => {
  return ordine?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;
};

// Fetch data
const fetchPrenotazioni = async () => {
  const user = auth.currentUser;
  if (!user) return;
  
  loading.value = true;
  try {
    const prenotazioniRef = collection(db, 'Prenotazioni');
    const q = query(prenotazioniRef, where('proprietarioUid', '==', user.uid));
    const snapshot = await getDocs(q);
    
    const processPrenotazioni = (docs) => docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataPrenotazione: doc.data().dataPrenotazione || Timestamp.now()
    }));

    const allPrenotazioni = processPrenotazioni(snapshot.docs);
    
    prenotazioniDaAccettare.value = allPrenotazioni
      .filter(p => !p.stato || p.stato === 'Da accettare')
      .sort((a, b) => a.dataPrenotazione - b.dataPrenotazione);

    prenotazioniAccettate.value = allPrenotazioni
      .filter(p => p.stato === 'Accettato')
      .sort((a, b) => a.dataPrenotazione - b.dataPrenotazione);

    prenotazioniCompletate.value = allPrenotazioni
      .filter(p => p.stato === 'Completato')
      .sort((a, b) => a.dataPrenotazione - b.dataPrenotazione);

  } catch (error) {
    console.error('Fetch error:', error);
    toastMessage.value = 'Errore nel caricamento delle prenotazioni';
    showToast.value = true;
  } finally {
    loading.value = false;
  }
};

// Prenotazione actions
const accettaPrenotazione = async (id) => {
  loading.value = true;
  try {
    await updateDoc(doc(db, 'Prenotazioni', id), { stato: 'Accettato' });
    await fetchPrenotazioni();
    toastMessage.value = 'Prenotazione accettata con successo';
    showToast.value = true;
  } catch (error) {
    console.error('Accept error:', error);
    toastMessage.value = 'Errore durante l\'accettazione';
    showToast.value = true;
  } finally {
    loading.value = false;
  }
};

const rifiutaPrenotazione = async (id) => {
  loading.value = true;
  try {
    await updateDoc(doc(db, 'Prenotazioni', id), { stato: 'Rifiutata' });
    await fetchPrenotazioni();
    toastMessage.value = 'Prenotazione rifiutata con successo';
    showToast.value = true;
  } catch (error) {
    console.error('Reject error:', error);
    toastMessage.value = 'Errore durante il rifiuto';
    showToast.value = true;
  } finally {
    loading.value = false;
  }
};

const completaOrdine = async (prenotazione) => {
  loading.value = true;
  try {
    await updateDoc(doc(db, 'Prenotazioni', prenotazione.id), { stato: 'Completato' });
    prenotazioniCompletate.value.push(prenotazione);
    prenotazioniAccettate.value = prenotazioniAccettate.value.filter(p => p.id !== prenotazione.id);
    toastMessage.value = 'Ordine completato con successo';
    showToast.value = true;
  } catch (error) {
    console.error('Complete error:', error);
    toastMessage.value = 'Errore durante il completamento';
    showToast.value = true;
  } finally {
    loading.value = false;
  }
};

// Time modification
const modificaOrarioPrenotazione = async (id, event) => {
  loading.value = true;

  try {
    let nuovoOrario = event.detail.value;

    const targetPrenotazione = [...prenotazioniDaAccettare.value, ...prenotazioniAccettate.value]
      .find(p => p.id === id);

    if (!targetPrenotazione) {
      throw new Error('Prenotazione non trovata');
    }


    // Ottenere la data corrente in formato YYYY-MM-DD
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // "2025-02-02"

    // Combinare la data con l'orario ricevuto
    const fullDateTime = `${formattedDate}T${nuovoOrario}:00`; // "2025-02-02T22:31:00"

    const newDate = new Date(fullDateTime);
    
    if (isNaN(newDate.getTime())) {
      throw new Error("La data generata non è valida");
    }

    const timestamp = Timestamp.fromDate(newDate);

    await updateDoc(doc(db, 'Prenotazioni', id), { 
      dataPrenotazione: timestamp 
    });


    // Update local state
    const updateArray = (arr) => arr.map(p => 
      p.id === id ? { ...p, dataPrenotazione: timestamp } : p
    );

    prenotazioniDaAccettare.value = updateArray(prenotazioniDaAccettare.value);
    prenotazioniAccettate.value = updateArray(prenotazioniAccettate.value);


    toastMessage.value = 'Orario modificato con successo';
    showToast.value = true;

  } catch (error) {
    console.error('Errore durante la modifica dell\'orario:', error);
    toastMessage.value = 'Errore nella modifica dell\'orario';
    showToast.value = true;
  } finally {
    loading.value = false;
  }
};


// Modals
const apriModale = (ordine) => {
  ordineVisualizzato.value = ordine.map(item => ({ ...item, fatto: false }));
  modaleAperto.value = true;
};

const chiudiModale = () => {
  modaleAperto.value = false;
  ordineVisualizzato.value = [];
};

const apriInformazioniCliente = (prenotazione) => {
  prenotazioneSelected.value = prenotazione;
  isModalInformazioniClienteOpen.value = true;
};
function closeModal(){
  isModalInformazioniClienteOpen.value = false;
}
// Auto-refresh logic
let refreshTimeout = null;
const setupAutoRefresh = () => {
  refreshTimeout = setInterval(async () => {
    await fetchPrenotazioni();
  }, 50000); // 30 seconds
};

onMounted(async () => {
  await fetchPrenotazioni();
  setupAutoRefresh();
});

// Lifecycle hooks
import { onIonViewWillLeave, onIonViewWillEnter } from '@ionic/vue';

onIonViewWillEnter(async () => {
  await fetchPrenotazioni();
  setupAutoRefresh();
});

onIonViewWillLeave(() => {
  if (refreshTimeout) {
    clearInterval(refreshTimeout);
    refreshTimeout = null;
  }
});
</script>

<style scoped>
/* Stili Base */
.datetime-container{
  margin: 10px;
  scale: 1.5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.prenotazione-item {
  border: 1px solid orange;

}

.segment-button {
  margin-top: 10px;
  --border-radius: 8px;
  --background-checked: rgba(255, 255, 255, 0.2);
  --indicator-color: transparent;
  min-height: 40px;
}

.segment-label {
  display: flex;
  align-items: center;
  gap: 2px;
}

.badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8em;
}

/* Card Prenotazione */
.prenotazione-card {
  border-radius: 16px;
  margin: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}


.card-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
  position: relative;
}

.user-avatar {
  width: 48px;
  height: 48px;
  margin-right: 12px;
}

.header-info {
  flex: 1;
}

.user-name {
  margin: 0;
  font-size: 1.1em;
  color: #2c3e50;
}

.booking-date {
  font-size: 0.9em;
  color: #7f8c8d;
}

.status-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* Contenuto Card */
.card-content {
  padding: 16px;
}

.time-button {
  --padding-start: 0;
  --padding-end: 0;
}

.details-grid {
  display: grid;
  gap: 12px;
  margin: 16px 0;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95em;
  color: #34495e;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-icon {
  font-size: 1.2em;
  color: #7f8c8d;
}

.warning .detail-icon {
  color: #e74c3c;
}

/* Action Buttons */

.decision-buttons,
.prenotazione-actions {
  display: flex;
  gap: 3px;
  overflow: visible;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-button {
  --border-radius: 12px;
}

.decision-buttons {
  display: flex;
  justify-content: flex-end;
  overflow:visible
}

.accept-button, .decline-button {
  --padding-start: 0;
  --padding-end: 0;
  --ripple-color: transparent;
}

.accept-button ion-icon {
  color: #2ecc71;
  font-size: 1.8em;
}

.decline-button ion-icon {
  color: #e74c3c;
  font-size: 1.8em;
}

/* Modale Ordine */

.modal-header {
  --border-radius: 16px 16px 0 0;
}

.order-content {
  background-color: #2ecc71;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 6px;
  flex-wrap:wrap;
  background: rgb(254, 241, 222);
  border-radius: 12px;
  left: 0px;
}

.order-item:active {
  background: #f8f9fa;
}

.order-checkbox {
  margin-right: 12px;
  --size: 20px;
}

.item-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  font-size: 1.2em;
  color: #2c3e50;
  overflow-wrap:anywhere;
}

.item-quantity {
  color: #000000;
  font-size: 1.4em;
  margin: 10px;
}

.completed {
  opacity: 0.6;
  text-decoration: line-through;
}

.order-total {
  text-align: center;
  padding: 16px;
  font-size: 1.1em;
  color: #2c3e50;
  border-top: 1px solid #eee;
  margin-top: 16px;
}

/* Toast Personalizzato */
.custom-toast {
  --background: #2c3e50;
  --color: white;
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Animazioni */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Stili per il badge di consegna */
.delivery-badge {
  margin-right: 10px;
  padding: 6px 10px;
  border-radius: 15px;
}

.badge-icon {
  margin-right: 5px;
  font-size: 14px;
}

/* Stili per le informazioni sull'indirizzo */
.address-info {
  border-radius: 8px;
}
.info-item-address-info{
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center; /* Centra orizzontalmente */
}

.delivery-info {
  border-radius: 8px;
}

.prenotazioni-container {
  animation: slideIn 0.3s ease-out;
}

ion-datetime{
  --background: rgba(255, 255, 255, 0.65);
}
</style>