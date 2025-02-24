<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary" class="toolbar-custom">
        <ion-title>Servizi</ion-title>
        <BackButton></BackButton>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding content-custom">
      <ion-list>
        <ion-item v-for="servizio in setServizi" :key="servizio.nome" class="item-custom">
          <ion-label>
            <h2>{{ servizio.nome }}</h2>
            <p>Durata: {{ servizio.durata }} min</p>
            <p>Costo: €{{ servizio.costo }}</p>
          </ion-label>
          <!-- Pulsante per eliminare il servizio -->
          <ion-button color="danger" @click="eliminaServizio(servizio.nome)">Elimina</ion-button>
        </ion-item>
      </ion-list>

      <p class="scritta-nessuno" v-if="setServizi.size === 0">Nessun servizio registrato</p>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="apriModalInserimento">+</ion-fab-button>
      </ion-fab>

      <!-- IonLoading per mostrare il caricamento -->
      <ion-loading :is-open="loading" message="Caricamento in corso..." spinner="crescent" />
    </ion-content>

    <ion-modal :is-open="modalInserimento">
      <ion-header>
        <ion-toolbar class="toolbar-modal">
          <ion-title>Nuovo Servizio</ion-title>
          <ion-button @click="chiudiModalInserimento">Chiudi</ion-button>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding content-modal">
        <ion-item class="input-item">
          <ion-label position="stacked">Nome</ion-label>
          <ion-input v-model="nome" placeholder="Inserisci il nome"></ion-input>
        </ion-item>

        <ion-item class="input-item">
          <ion-label position="stacked">Durata</ion-label>
          <ion-select v-model="durata" interface="action-sheet" placeholder="Seleziona durata">
            <ion-select-option :value="minuti" v-for="minuti in opzioniDurata" :key="minuti">
              {{ minuti }} min
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item class="input-item">
          <ion-label position="stacked">Costo (€)</ion-label>
          <ion-input type="number" v-model="costo" placeholder="Inserisci il costo"></ion-input>
        </ion-item>

        <ion-button expand="full" class="btn-submit" @click="inserisciDatiInFirestore">
          Inserisci Servizio
        </ion-button>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, query } from 'firebase/firestore';
import {
  toastController,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSelect,
  IonContent,
  IonList,
  IonItem,
  IonFab,
  IonFabButton,
  IonModal,
  IonLabel,
  IonButton,
  IonInput,
  IonSelectOption,
  IonLoading
} from '@ionic/vue';
import BackButton from '/src/views/Components/BackButton.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const store = useStore();
const db = getFirestore();

// Reactive state
const setServizi = ref(new Set());
const modalInserimento = ref(false);
const loading = ref(false);

const nome = ref('');
const durata = ref('');
const costo = ref('');
const idDocumentNegozioGestore = store.getters.getIdDocumentNegozioGestore;

// Calcola opzioni per la durata (da 15 a 200 minuti, step 15)
const opzioniDurata = Array.from({ length: (200 - 15) / 15 + 1 }, (_, index) => 15 + index * 15);

onMounted(async () => {
  await recuperaServizi();
});

const apriModalInserimento = () => {
  modalInserimento.value = true;
};

const chiudiModalInserimento = async () => {
  modalInserimento.value = false;
  await recuperaServizi();
};

async function inserisciDatiInFirestore() {
  if (await controllaDatiInserimento()) {
    loading.value = true;
    try {
      // Crea il documento con il nome del servizio
      await setDoc(
        doc(db, "Negozi", idDocumentNegozioGestore, "Servizi", nome.value),
        {
          nome: nome.value,
          durata: durata.value,
          costo: costo.value
        }
      );
      chiudiModalInserimento();
    } catch (error) {
      console.error("Errore durante l'inserimento del servizio:", error);
      await mostraToast("Errore durante l'inserimento del servizio.");
    } finally {
      loading.value = false;
    }
  }
}

const recuperaServizi = async () => {
  loading.value = true;
  const setServiziCopy = new Set();
  try {
    const collezioneInternaRef = collection(db, 'Negozi', idDocumentNegozioGestore, 'Servizi');
    const q = query(collezioneInternaRef);
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const datiDocumento = doc.data();
      setServiziCopy.add(datiDocumento);
    });
    setServizi.value = setServiziCopy;
  } catch (error) {
    console.error('Errore durante il recupero dei servizi:', error);
    await mostraToast("Errore durante il recupero dei servizi.");
  } finally {
    loading.value = false;
  }
};

const eliminaServizio = async (nomeServizio) => {
  loading.value = true;
  try {
    const docRef = doc(db, "Negozi", idDocumentNegozioGestore, "Servizi", nomeServizio);
    await deleteDoc(docRef);
    await recuperaServizi();
  } catch (error) {
    console.error("Errore durante l'eliminazione del servizio:", error);
    await mostraToast("Errore durante l'eliminazione del servizio.");
  } finally {
    loading.value = false;
  }
};

const controllaDatiInserimento = async () => {
  if (nome.value === "") {
    await mostraToast('Il campo Nome non può essere vuoto.');
    return false;
  }
  if (durata.value === "") {
    await mostraToast('Seleziona una durata valida.');
    return false;
  }
  if (costo.value === "") {
    await mostraToast('Inserisci un costo valido.');
    return false;
  }
  return true;
};

async function mostraToast(message) {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
    position: 'top',
    color: 'danger',
    cssClass: 'toast-custom'
  });
  await toast.present();
}
</script>

<style scoped>
/* Toolbar personalizzato */


/* Contenuto principale */
.content-custom {
  background: #f0f4f8;
}

/* Lista e item custom */
ion-list {
  margin-top: 1rem;
}

.item-custom {
  --background: #fff;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  border-radius: 8px;
  padding: 1rem;
  transition: transform 0.2s ease-in-out;
}

.item-custom:hover {
  transform: translateY(-2px);
}

.item-custom h2 {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.item-custom p {
  margin: 0.2rem 0;
  color: #555;
}

/* Pulsante di eliminazione */
ion-button[color="danger"] {
  --background: #eb445a;
  --border-radius: 50px;
  --box-shadow: 0 2px 4px rgba(235, 68, 90, 0.3);
}

/* Messaggio "Nessun servizio registrato" */
.scritta-nessuno {
  text-align: center;
  font-size: 1.2rem;
  color: #888;
  margin-top: 2rem;
}

/* Modal styling */


.content-modal {
  background: #fff;
}

.input-item {
  margin-bottom: 1rem;
  --border-radius: 8px;
  --box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-submit {
  margin-top: 1rem;
  --border-radius: 8px;

}

/* Toast personalizzato */
.toast-custom {
  --background: #eb445a;
  --color: #fff;
  --border-radius: 8px;
}
</style>