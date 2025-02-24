<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Orari Settimanali</ion-title>
        <BackButton />
        <ion-loading 
          :is-open="isOpenLoading"
          message="Caricamento..."
          css-class="custom-loading"
        />
      </ion-toolbar>
    </ion-header>

    <ion-content class="content-container">
      <div class="days-container">
        <div 
          v-for="(giorno, index) in giorni" 
          :key="index" 
          class="day-card"
        >
          <div class="day-header" @click="toggleDayExpansion(giorno)">
            <ion-text class="day-title">{{ giorno }}</ion-text>
            <ion-icon 
              :icon="isDayExpanded(giorno) ? chevronDown : chevronForward" 
              class="chevron-icon"
            />
          </div>

          <div v-if="isDayExpanded(giorno)" class="time-slots-container">
            <div class="time-slots-scroll">
              <ion-button 
                v-for="(orario, timeIndex) in orari"
                :key="timeIndex"
                @click="toggleOrario(giorno, orario)"
                :class="['time-slot', { 'selected': isOrarioSelezionato(giorno, orario) }]"
                fill="clear"
                size="small"
              >
                {{ orario }}
              </ion-button>
            </div>
          </div>
        </div>
      </div>

      <ion-button @click="salvaOrari" class="save-button">
        <ion-icon :icon="saveOutline" slot="start" />
        Salva Orari
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { 
  IonLoading, IonPage, IonHeader, IonToolbar, IonTitle, 
  IonContent, IonButton, IonText, IonIcon, toastController 
} from '@ionic/vue';
import { 
  getFirestore, setDoc, updateDoc, doc, query, 
  where, getDocs, collection ,getDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { saveOutline, closeOutline, chevronForward, chevronDown } from 'ionicons/icons';
import BackButton from '/src/views/Components/BackButton.vue';

const expandedDays = ref(new Set());
const store = useStore();
const router = useRouter();
const auth = getAuth();
const db = getFirestore();

const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const orari = generaOrari();
const orariSalvati = reactive(new Map());
const isOpenLoading = ref(false);
const finito = ref(false);

const toggleDayExpansion = (giorno) => {
  const newSet = new Set(expandedDays.value);
  newSet.has(giorno) ? newSet.delete(giorno) : newSet.add(giorno);
  expandedDays.value = newSet;
};

const isDayExpanded = (giorno) => expandedDays.value.has(giorno);

const isOrarioSelezionato = (giorno, orario) => {
  return orariSalvati.get(giorno)?.includes(orario) || false;
};

const toggleOrario = (giorno, orario) => {
  const currentOrari = orariSalvati.get(giorno) || [];
  const newOrari = currentOrari.includes(orario)
    ? currentOrari.filter(t => t !== orario)
    : [...currentOrari, orario];
  
  orariSalvati.set(giorno, newOrari);
};

async function salvaOrari() {
  isOpenLoading.value = true;
  const uid = auth.currentUser?.uid;

  try {
    if (!uid) {
      await presentToast('Utente non autenticato', 'danger');
      router.push('/login');
      return;
    }

    const negozioRef = await trovaNegozioUtente(uid);
    if (!negozioRef) {
      await presentToast('Nessun negozio trovato', 'warning');
      return;
    }

    const orariObject = Object.fromEntries(orariSalvati);
    await updateDoc(negozioRef, { orariLavorativi: orariObject });
    await presentToast('Orari salvati con successo!');
  } catch (error) {
    console.error('Errore nel salvataggio:', error);
    await presentToast('Errore durante il salvataggio', 'danger');
  } finally {
    isOpenLoading.value = false;
  }
}

async function trovaNegozioUtente(uid) {
  const q = query(collection(db, "Negozi"), where("proprietarioUid", "==", uid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty ? null : doc(db, "Negozi", querySnapshot.docs[0].id);
}

onMounted(async () => {
  await recuperaTuttiOrariLavorativi();
});

async function recuperaTuttiOrariLavorativi() {
  isOpenLoading.value = true;
  const uid = auth.currentUser?.uid;

  try {
    if (!uid) {
      router.push('/login');
      return;
    }

    const negozioRef = await trovaNegozioUtente(uid);
    if (!negozioRef) return;

    const docSnap = await getDoc(negozioRef);
    if (docSnap.exists()) {
      const orariDb = docSnap.data().orariLavorativi || {};
      Object.entries(orariDb).forEach(([giorno, orari]) => {
        orariSalvati.set(giorno, orari);
      });
    }
  } catch (error) {
    console.error('Error fetching work hours:', error);
    await presentToast('Errore nel caricamento degli orari', 'danger');
  } finally {
    isOpenLoading.value = false;
  }
}

async function presentToast(message, color = 'success') {
  const toast = await toastController.create({
    message,
    duration: 2500,
    color,
    position: 'top',
    cssClass: 'custom-toast',
    buttons: [{
      icon: closeOutline,
      role: 'cancel',
      side: 'end'
    }]
  });
  await toast.present();
}

function generaOrari() {
  const orari = [];
  for (let hour = 7; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      orari.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return orari;
}
</script>

<style scoped>
.content-container {
  --ion-background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.days-container {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.day-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.day-header:active {
  background-color: rgba(var(--ion-color-primary-rgb), 0.05);
}

.day-title {
  font-weight: 600;
  font-size: 1.1em;
  color: var(--ion-color-primary);
}

.chevron-icon {
  color: var(--ion-color-medium);
  font-size: 1.2em;
}

.time-slots-container {
  border-top: 1px solid rgba(var(--ion-color-primary-rgb), 0.1);
  padding: 8px;
}

.time-slots-scroll {
  display: flex;
  overflow-x: auto;
  gap: 6px;
  padding-bottom: 8px;
}

.time-slot {
  --border-radius: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
  --border-width: 1px;
  --border-color: rgba(var(--ion-color-primary-rgb), 0.2);
  font-weight: 500;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.time-slot.selected {
  --background: var(--ion-color-tertiary);
  --border-color: var(--ion-color-tertiary);
  --color: var(--ion-color-tertiary-contrast);
  transform: scale(0.95);
}

.save-button {
  margin: 16px;
  align-self: center;
}

.time-slots-scroll::-webkit-scrollbar {
  height: 4px;
}

.time-slots-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(var(--ion-color-primary-rgb), 0.2);
  border-radius: 2px;
}
</style>