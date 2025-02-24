<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Negozi Non Accettati</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-card v-for="negozio in negozi" :key="negozio.id">
          <ion-card-header>
            <ion-card-title>{{ negozio.nomeNegozio }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p><strong>Categoria:</strong> {{ negozio.categoriaNegozio }}</p>
            <p><strong>Cellulare:</strong> {{ negozio.cellulareNegozio }}</p>
            <p><strong>Città:</strong> {{ negozio.cittaNegozio }}</p>
            <p><strong>Indirizzo:</strong> {{ negozio.indirizzoNegozio }}</p>
            <p >
              <strong>Proprietario:</strong><br>
              <strong>Nome:</strong> {{ negozio.proprietario.nome }}<br>
              <strong>Cognome:</strong> {{ negozio.proprietario.cognome }}<br>
              <strong>Email:</strong> {{ negozio.proprietario.email }}<br>
              <strong>Cellulare:</strong> {{ negozio.proprietario.cellulare }}<br>
              <strong>Città:</strong> {{ negozio.proprietario.citta }}<br>
              <strong>Numero Civico:</strong> {{ negozio.proprietario.numeroCivico }}<br>
              <strong>Provincia:</strong> {{ negozio.proprietario.provincia }}<br>
              <strong>Via:</strong> {{ negozio.proprietario.via }}<br>
            </p>
            <ion-button @click="accettaNegozio(negozio)">Accetta</ion-button>
            <ion-button color="danger" @click="rifiutaNegozio(negozio)">Rifiuta</ion-button>

          </ion-card-content>
        </ion-card>
      </ion-list>
      <ion-button class="register-button" @click="logout" >logout</ion-button>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/vue';
import { collection, getDocs,setDoc, deleteDoc, getFirestore, getDoc,doc} from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { getAuth,signOut,} from "firebase/auth";


const isOpenLoading = ref(false);
const negozi = ref([]);
const db = getFirestore();
const router = useRouter();
const auth = getAuth();

const fetchNegozi = async () => {
  const querySnapshot = await getDocs(collection(db, 'NegoziDaAccettare'));
  negozi.value = [];

  for (const document of querySnapshot.docs) {
    const data = document.data();
    // Recupera informazioni del proprietario se presente
    if (data.proprietarioUid) {
      const ownerRef = doc(db, 'Gestore', data.proprietarioUid);
      const ownerSnap = await getDoc(ownerRef);
      data.proprietario = ownerSnap.data();
    }
    negozi.value.push({ id: document.id, ...data });
  }
};



const accettaNegozio = async (negozio) => {
  // Aggiungi il negozio alla collezione Negozi
  await setDoc(doc(db, 'Negozi', negozio.id), negozio);
  // Rimuovi il negozio dalla collezione NegoziDaAccettare
  await deleteDoc(doc(db, 'NegoziDaAccettare', negozio.id));
  // Rimuovi il negozio dall'array locale
  negozi.value = negozi.value.filter(n => n.id !== negozio.id);
};

const rifiutaNegozio = async (negozio) => {
  // Rimuovi il negozio dalla collezione NegoziDaAccettare
  await deleteDoc(doc(db, 'NegoziDaAccettare', negozio.id));
  // Rimuovi il negozio dall'array locale
  negozi.value = negozi.value.filter(n => n.id !== negozio.id);
};
const logout = async () => {
  signOut(auth).then(() => {
    router.push('/login');
  }).catch((error) => {
    console.error('Errore durante il logout:', error);
  });
};
onMounted(() => {
  fetchNegozi();
});
</script>

<style scoped>
/* Aggiungi qui gli stili personalizzati se necessari */
</style>
