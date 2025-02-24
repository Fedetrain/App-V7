<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Home</ion-title>
        <ion-loading 
          :is-open="isOpenLoading" 
          message="Caricamento..."
          spinner="circles"
        ></ion-loading>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding main-content">
      <!-- Filtri Categoria -->
      <div class="category-filters">
        <ion-chip 
          v-for="(category, index) in categories" 
          :key="index"
          :class="{ 'active-category': selectedCategory === category }"
          @click="toggleCategory(category)"
        >
          {{ category }}
        </ion-chip>
      </div>

      <!-- Barre di Ricerca -->
      <div class="search-container">
        <ion-searchbar
          class="custom-searchbar"
          animated
          placeholder="Cerca per nome"
          :debounce="500"
          @ionInput="cercaPerNome($event)"
        ></ion-searchbar>

        <ion-searchbar
          class="custom-searchbar"
          v-model="cittaCliente"
          animated
          placeholder="Cerca per città"
          @click="openModal()" 
        ></ion-searchbar>
      </div>

      <!-- Messaggio Nessun Risultato -->
      <div class="empty-state" v-show="itemsCopy.length === 0">
        <ion-icon :icon="storefrontOutline" class="empty-icon" />
        <p class="empty-text">Nessun negozio trovato</p>
      </div>

      <!-- Lista Negozi -->
      <div class="shop-grid">
        <ion-card 
          class="shop-card" 
          v-for="(item, index) in filteredItems" 
          :key="index"
          @click="open(item)"
        >
          <div class="image-container">
            <img 
              class="shop-image" 
              :src="item.imageUrl" 
              alt="Immagine negozio"
              loading="lazy"
            />
            <div class="category-badge">{{ item.categoriaNegozio }}</div>
          </div>

          <ion-card-header class="card-header">
            <ion-card-title class="shop-title">{{ item.nomeNegozio }}</ion-card-title>
            <ion-progress-bar 
              v-show="mostraProgresBar" 
              :value="progress / 100" 
              class="loading-bar"
            ></ion-progress-bar>
          </ion-card-header>

          <ion-card-content class="card-content">
            <div class="address-line">
              <ion-icon :icon="locationOutline" />
              <p>{{ item.indirizzoNegozio }}, {{ item.cittaNegozio }}</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Modal Selezione Città -->
      <ion-modal 
        :is-open="isModalOpen" 
        @didDismiss="closeModal"
        class="city-modal"
      >
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Seleziona Città</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        
        <ion-content class="modal-content">
          <ion-searchbar
            class="modal-searchbar"
            animated
            placeholder="Cerca città..."
            @ionInput="cercaPerCitta($event)"
          ></ion-searchbar>

          <ion-list class="city-list">
            <ion-item 
              v-for="(suggestion, index) in suggestions"
              :key="index"
              @click="selectCity(suggestion)"
              class="city-item"
            >
              <ion-label>{{ suggestion }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <ion-toast
        :is-open="showError"
        :message="errorMessage"
        :duration="3000"
        @didDismiss="showError = false"
        color="danger"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonProgressBar,
  IonModal, IonList, IonItem, IonLabel, IonLoading, IonToast, IonChip,
  IonIcon, IonButton, IonButtons
} from '@ionic/vue';
import { 
  storefrontOutline, locationOutline, closeOutline, 
  checkmarkCircleOutline, alertCircleOutline 
} from 'ionicons/icons';
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import comuni from '/src/comuni.json';

const db = getFirestore();
const storage = getStorage();
const auth = getAuth();
const store = useStore();
const router = useRouter();

// State
const isOpenLoading = ref(false);
const mostraProgresBar = ref(false);
const progress = ref(0);
const items = ref([]);
const itemsCopy = ref([]);
const cittaCliente = ref('');
const suggestions = ref([]);
const isModalOpen = ref(false);
const selectedCategory = ref(null);
const showError = ref(false);
const errorMessage = ref('');

// Costanti
const categories = ref([
  'Tutti',
  'Alimentari e cibo',
  'Servizi di estetica e bellezza'
]);

const nomiComuni = comuni.map(c => c.nome);
// Computed
const filteredItems = computed(() => {
  return itemsCopy.value.filter(item => {
    const matchesCategory = !selectedCategory.value || 
      selectedCategory.value === 'Tutti' || 
      item.categoriaNegozio === selectedCategory.value;
    
    return matchesCategory;
  });
});

// Metodi
const toggleCategory = (category) => {
  selectedCategory.value = selectedCategory.value === category ? null : category;
};

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const cercaPerCitta = (event) => {
  const searchTerm = event.target.value;
const capitalizedSearchTerm = searchTerm
  .split(' ') // Dividi la stringa in un array di parole
  .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizza la prima lettera di ogni parola
  .join(' '); // Riunisci le parole in una stringa

  suggestions.value = nomiComuni.filter(citta => 
    citta.includes(capitalizedSearchTerm)
  ).slice(0, 30);
;
};

const selectCity = async (city) => {
  try {
    isOpenLoading.value = true;
    cittaCliente.value = city;
    await loadNegozi(city);
    await recuperaImmagini();
    isModalOpen.value = false;
  } catch (error) {
    handleError('Errore nel caricamento dei negozi');
  } finally {
    isOpenLoading.value = false;
  }
};

const cercaPerNome = (event) => {
  const searchTerm = event.target.value.toLowerCase();
  itemsCopy.value = items.value.filter(item =>
    item.nomeNegozio.toLowerCase().includes(searchTerm)
  );
};

const loadNegozi = async (city) => {
  try {
    const q = query(
      collection(db, 'Negozi'), 
      where('cittaNegozio', '==', city)
    );
    
    const snapshot = await getDocs(q);
    items.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    itemsCopy.value = [...items.value];
  } catch (error) {
    handleError('Errore nel caricamento dei negozi');
  }
};

const recuperaImmagini = async () => {
  try {
    mostraProgresBar.value = true;
    progress.value = 0;
    
    items.value = await Promise.all(items.value.map(async (item, index) => {
      try {
        const ref = storageRef(storage, `images/${item.id}`);
        item.imageUrl = await getDownloadURL(ref);
      } catch (error) {
        item.imageUrl = '/assets/default-shop.jpg';
      }
      
      progress.value = ((index + 1) / items.value.length) * 100;
      return item;
    }));
    
  } catch (error) {
    handleError('Errore nel caricamento delle immagini');
  } finally {
    mostraProgresBar.value = false;
  }
};

const open = (item) => {
  try {
    store.dispatch('setIdDocumentNegozioSelezionato', item.id);
    store.dispatch('setUrlNegozioSelezionato', item.imageUrl);
    
    const route = item.categoriaNegozio === 'Alimentari e cibo' 
      ? '/cliente/tabs/tab1/informazioniNegozio_Alimentari' 
      : '/cliente/tabs/tab1/informazioniNegozio';
    
    router.push(route);
  } catch (error) {
    handleError('Errore nell\'apertura del negozio');
  }
};

const handleError = (message) => {
  errorMessage.value = message;
  showError.value = true;
};

// Lifecycle Hooks
onMounted(async () => {
  try {
    const userUid = auth.currentUser?.uid;
    if (!userUid) return;

    const userDoc = await getDoc(doc(db, 'Cliente', userUid));
    if (userDoc.exists()) {
      cittaCliente.value = userDoc.data().citta;
      await loadNegozi(cittaCliente.value);
      await recuperaImmagini();
    }
    isOpenLoading.value=false
  } catch (error) {
    isOpenLoading.value=false
    handleError('Errore nel caricamento iniziale');
  }
});
</script>

<style scoped>
.main-content {
  --background: #fff8f0;
}

.category-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

ion-chip {
  --background: #ffe0b2;
  --color: #fb890f;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

ion-chip.active-category {
  --background: #fb890f;
  --color: white;
}

.search-container {
  display: grid;
}


.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.shop-card {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.shop-card:active {
  transform: scale(0.98);
}

.image-container {
  position: relative;
  height: 180px;
}

.shop-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(251, 137, 15, 0.9);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.card-header {
  padding: 12px;
}

.shop-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d2d2d;
}

.loading-bar {
  margin-top: 8px;
}

.card-content {
  padding: 0 12px 12px;
}

.address-line {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  color: #ffd8b2;
}

.empty-text {
  color: #666;
  margin-top: 16px;
}

.city-modal .modal-content {
  --background: #fff8f0;
}

.city-list {
  background: transparent;
}

.city-item {
  --background: #fff8f0;
  --border-color: #ffe0b2;
}

.modal-searchbar {
  --background: #ffffff;
  text-transform: capitalize;
}
</style>