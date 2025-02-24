<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Gestione Ferie</ion-title>
        <BackButton></BackButton>
        <ion-loading :is-open="isOpenLoading" message="Please wait..."></ion-loading>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding content-background">
      <div class="div">
        <ion-item class="date-item">
          <ion-label position="stacked">Seleziona la data di ferie</ion-label>
          <ion-datetime
            presentation="date"
            display-format="DD-MM-YYYY"
            class="date-picker"
            v-model="selectedDate"
          ></ion-datetime>
        </ion-item>
        <ion-button expand="block" @click="openAlert" class="submit-button">
          Salva Ferie
        </ion-button>
        <div v-if="message" class="success-message">{{ message }}</div>
      </div>
       <h2>Giorni di Ferie Salvati:</h2>
        <ion-list>
          <ion-item v-for="(vacation, index) in vacationDays" :key="vacation.id">
            <ion-label>{{ formatDate(vacation.date) }}</ion-label>
            <ion-button color="danger" @click="deleteVacation(vacation.id)">Elimina</ion-button>
          </ion-item>
        </ion-list>

        <ion-alert
      :is-open="showAlert"
      header="Attenzione!!"
      message="Aggiungendo il giorno di ferie, tutte le prenotazioni per la data selezionata saranno rimosse. I clienti saranno informati della cancellazione. Sei sicuro di voler continuare?"
      :buttons="[
        { text: 'Annulla', role: 'cancel', handler: () => showAlert = false },
        { text: 'Attiva', handler: saveVacation }
      ]"
    />
    </ion-content>
  </ion-page>
</template>



<script setup>
import { ref, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonDatetime,
  IonList,
  IonLoading,
  IonAlert
} from '@ionic/vue';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, Timestamp, query, where } from 'firebase/firestore';
import BackButton from '@/views/Components/BackButton.vue';
import { useStore } from 'vuex';

const db = getFirestore();
const store = useStore();

const selectedDate = ref(''); // Gestire la data come stringa
const message = ref('');
const vacationDays = ref([]); // Array vuoto per le ferie
const isOpenLoading = ref(false);
const showAlert= ref(false)


const openAlert = () => {
  showAlert.value = true;
};

// Funzione per formattare la data
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = {
    weekday: 'long', // Nome del giorno della settimana
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  return date.toLocaleDateString('it-IT', options).replace(',', '').replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$1-$2-$3');
};

// Funzione per rimuovere le prenotazioni per una data
const removeReservationsByDate = async (dataSelezionata) => {
  const storeId = store.getters.getIdDocumentNegozioGestore;
  if (!storeId) {
    message.value = 'Store ID non trovato.';
    return;
  }

  try {

    const startOfDay = new Date(dataSelezionata);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dataSelezionata);
    endOfDay.setHours(23, 59, 59, 999);



    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);


    const prenotazioniRef = collection(db, "Prenotazioni");
    const q = query(
      prenotazioniRef,
      where("idDocumentNegozio", "==", storeId),
      where("dataPrenotazione", ">=", startTimestamp),
      where("dataPrenotazione", "<=", endTimestamp)
    );


    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      message.value = 'Nessuna prenotazione trovata per la data selezionata.';
      return;
    }


    // Elimina ogni prenotazione trovata
    const deletePromises = querySnapshot.docs.map(doc => {
      return deleteDoc(doc.ref);
    });
    
    await Promise.all(deletePromises);


    message.value = 'Prenotazioni rimosse con successo per la data selezionata.';
  } catch (error) {
    message.value = 'Si è verificato un errore. Riprova.';
  }
};

// Funzione per salvare un giorno di ferie
const saveVacation = async () => {
  isOpenLoading.value = true;

  if (!selectedDate.value) {
    message.value = 'Per favore, seleziona una data.';
    return;
  }

  const storeId = store.getters.getIdDocumentNegozioGestore;
  if (!storeId) {
    message.value = 'Store ID non trovato.';
    return;
  }

  try {
    const dataSelezionata = new Date(selectedDate.value);
    dataSelezionata.setHours(0);
    dataSelezionata.setMilliseconds(0);
    dataSelezionata.setMinutes(0);
    dataSelezionata.setSeconds(0);
    
    const ferieRef = collection(db, "Negozi", storeId, "Ferie");
    const q = query(ferieRef, where("date", "==", selectedDate.value));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      message.value = 'Un giorno di ferie per questa data è già stato aggiunto.';
      isOpenLoading.value = false;
      return;
    }
    const timestamp = Timestamp.fromDate(dataSelezionata);

    await addDoc(collection(db, "Negozi", storeId, "Ferie"), {
      date: selectedDate.value,
      timestamp: timestamp
    });

    message.value = 'Ferie salvate con successo!';
    selectedDate.value = ''; // Reset data selezionata
    await removeReservationsByDate(dataSelezionata);
    await fetchVacationDays(); // Ricarica la lista dei giorni di ferie
  } catch (error) {
    console.error("Errore nel salvataggio delle ferie: ", error);
    message.value = 'Si è verificato un errore. Riprova.';
  } finally {
    isOpenLoading.value = false;
    showAlert.value = false;

  }
};

// Funzione per recuperare i giorni di ferie
const fetchVacationDays = async () => {
  isOpenLoading.value = true;
  try {
    const storeId = store.getters.getIdDocumentNegozioGestore;
    const querySnapshot = await getDocs(collection(db, "Negozi", storeId, "Ferie"));
    vacationDays.value = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date || 'Data non disponibile' // Gestione del caso senza 'date'
      };
    });
  } catch (error) {
    isOpenLoading.value = false;
  } finally {
    isOpenLoading.value = false;
  }
};

// Funzione per eliminare un giorno di ferie
const deleteVacation = async (id) => {
  isOpenLoading.value = true;

  const storeId = store.getters.getIdDocumentNegozioGestore;
  try {
    await deleteDoc(doc(db, "Negozi", storeId, "Ferie", id));
    message.value = 'Ferie eliminate con successo!';
    await fetchVacationDays(); // Ricarica la lista dei giorni di ferie
  } catch (error) {
    console.error("Errore nella cancellazione delle ferie: ", error);
    message.value = 'Si è verificato un errore. Riprova.';
  } finally {
    isOpenLoading.value = false;
  }
};

// Fetch dei giorni di ferie quando il componente viene montato
onMounted(fetchVacationDays);
</script>



<style scoped>

.div {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.date-item {
  --border-radius: 10px;
  margin-bottom: 15px;
}

.date-picker {
  --border-radius: 8px;
}



.success-message {
  margin-top: 15px;
  color: green;
  text-align: center;
}
</style>
