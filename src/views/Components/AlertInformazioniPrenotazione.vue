<template>
  <ion-modal 
    :is-open="props.isOpen" 
    @close="closeModal()" 
    backdrop-dismiss="true"
    @ionModalWillPresent="onModalWillPresent"
    @ionModalDidPresent="onModalDidPresent"
    @ionModalWillDismiss="onModalWillDismiss"
    @ionModalDidDismiss="onModalDidDismiss"
  >
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Dettagli</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal()">Chiudi</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="props.prenotazioneSelected || cliente">
        <!-- Informazioni Prenotazione -->
        <section class="prenotazione-section">
          <ion-card>
            <ion-card-header>
              <ion-card-title class="ion-text-center">Prenotazione</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-label class="ion-text-bold">Servizio:</ion-label>
                  <ion-text>{{ props.prenotazioneSelected.servizioSelezionato }}</ion-text>
                </ion-item>
                <ion-item>
                  <ion-label class="ion-text-bold">Durata:</ion-label>
                  <ion-text>{{ props.prenotazioneSelected.durataServizioSelezionato }} minuti</ion-text>
                </ion-item>
                <ion-item>
                  <ion-label class="ion-text-bold">Ora Inizio:</ion-label>
                  <ion-text>{{ props.prenotazioneSelected.oraInizio }}</ion-text>
                </ion-item>
                <ion-item>
                  <ion-label class="ion-text-bold">Ora Fine:</ion-label>
                  <ion-text>{{ props.prenotazioneSelected.oraFine }}</ion-text>
                </ion-item>
                <ion-item>
                  <ion-label class="ion-text-bold">Commento:</ion-label>
                  <ion-text>{{ props.prenotazioneSelected.commento }}</ion-text>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </section>

        <!-- Informazioni Cliente -->
        <section class="cliente-section" v-if="cliente">
          <ion-card>
            <ion-card-header>
              <ion-card-title class="ion-text-center">Cliente</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-label class="ion-text-bold">Nome:</ion-label>
                  <ion-text>{{ cliente.nome }} {{ cliente.cognome }}</ion-text>
                </ion-item>
                <ion-item button href="tel:{{ cliente.cellulare }}">
                  <ion-label class="ion-text-bold">Cellulare:</ion-label>
                  <ion-text>{{ cliente.cellulare }}</ion-text>
                </ion-item>
                <ion-item>
                  <ion-label class="ion-text-bold">Email:</ion-label>
                  <ion-text>{{ cliente.email }}</ion-text>
                </ion-item>
                <ion-item>
                  <ion-label class="ion-text-bold">Città:</ion-label>
                  <ion-text>{{ cliente.citta }}</ion-text>
                </ion-item>
                <ion-item>
                  <ion-label class="ion-text-bold">Indirizzo:</ion-label>
                  <ion-text>{{ cliente.via }} {{ cliente.numeroCivico }}</ion-text>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </section>

        <!-- Bottone Blocca Cliente -->
        <section class="actions-section">
          <ion-button color="danger" @click="bloccoCliente">Blocca Cliente</ion-button>
        </section>

        <!-- Azioni -->
        <section class="actions-section">
          <ion-button color="danger" expand="block" @click="eliminaPrenotazione()">Elimina Prenotazione</ion-button>
        </section>
      </div>

      <ion-loading
        :is-open="isOpenLoading"
        message="Attendere..."
      />
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { defineProps, defineEmits, ref, watchEffect, onMounted, onUnmounted } from 'vue';
import { getFirestore, doc, getDoc, deleteDoc, updateDoc,setDoc,collection,query } from 'firebase/firestore';
import {
  IonModal,
  IonItem,
  IonLabel,
  IonText,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonLoading
} from '@ionic/vue';

const props = defineProps(['isOpen', 'prenotazioneSelected']);
const emit = defineEmits(['close-modal', 'ricarica-orari']);
const db = getFirestore();
const cliente = ref(null);
const isOpenLoading = ref(false);

onMounted(() => {
  console.log('Modal montato');
});

onUnmounted(() => {
  console.log('Modal smontato');
});

const onModalWillPresent = () => console.log('Modal sta per essere presentato');
const onModalDidPresent = () => console.log('Modal è stato presentato');
const onModalWillDismiss = () => {
  console.log('Modal sta per essere chiuso');
  closeModal();
};
const onModalDidDismiss = () => console.log('Modal è stato chiuso');

watchEffect(() => {
  if (props.prenotazioneSelected) {
    recuperaInformazioniCliente();
  }
});

const recuperaInformazioniCliente = async () => {
  try {
    isOpenLoading.value = true;
    const clienteRef = doc(db, 'Cliente', props.prenotazioneSelected.idDocumentCliente);
    const clienteDoc = await getDoc(clienteRef);

    if (clienteDoc.exists()) {
      cliente.value = clienteDoc.data();
    } else {
    }
  } catch (error) {
    console.error('Errore nel recupero delle informazioni del cliente:', error);
    cliente.value = null;
  } finally {
    isOpenLoading.value = false;
  }
};

const eliminaPrenotazione = async () => {
  try {
    isOpenLoading.value = true;
    const prenotazioneRef = doc(db, 'Prenotazioni', props.prenotazioneSelected.id);
    await deleteDoc(prenotazioneRef);
    closeModal();
    emit('ricarica-orari');
  } catch (error) {
    console.error('Errore durante l\'eliminazione della prenotazione:', error);
  } finally {
    isOpenLoading.value = false;
  }
};

const closeModal = () => emit('close-modal');

// Funzione per bloccare il cliente
const bloccoCliente = () => {
  const alert = window.confirm("Attenzione! Bloccare questo cliente impedirà a questa email di fare prenotazioni in futuro. Sei sicuro di voler procedere?");
  if (alert) {
    bloccaClienteNelDatabase();
  }
};

const bloccaClienteNelDatabase = async () => {
  try {
    isOpenLoading.value = true;
    const clienteRef = doc(db, 'Cliente', props.prenotazioneSelected.idDocumentCliente);
    const clienteDoc = await getDoc(clienteRef);

    if (clienteDoc.exists()) {
      const clienteData = clienteDoc.data();

      // Aggiungi un campo 'bloccato' al cliente, se non è già presente
      clienteData.bloccato = true; 

      // Crea il documento nella collezione 'ClientiBloccati'
      const clienteBloccatoRef = doc(db, 'ClientiBloccati', clienteRef.id);
      await setDoc(clienteBloccatoRef, clienteData); // Salva i dati nella collezione 'ClientiBloccati'

      // Elimina il documento dalla collezione 'Cliente'
      await deleteDoc(clienteRef);

      alert('Cliente bloccato con successo. Non potrà più effettuare prenotazioni.');
    } else {
    }
  } catch (error) {
    console.error('Errore nel bloccare il cliente:', error);
  } finally {
    isOpenLoading.value = false;
  }
};

</script>

<style scoped>
ion-card {
  margin: 1rem 0;
}

ion-card-title {
  font-size: 1.5rem;
}

.prenotazione-section {
  margin-bottom: 1rem;
}

.cliente-section {
  margin-bottom: 1rem;
}

.actions-section {
  text-align: center;
}

ion-modal {
  --height: 80%;
  --width: 90%;
  --border-radius: 16px;
  --box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

ion-modal::part(backdrop) {
  background: rgba(209, 213, 219);
  opacity: 1;
}

ion-button[color="danger"] {
  margin-top: 1rem;
}
</style>
