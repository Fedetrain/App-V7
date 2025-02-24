<template>
    <ion-page>
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Prenotazioni</ion-title>
          <!-- IonLoading gestito tramite reactive isOpenLoading -->
          <ion-loading
            :is-open="isOpenLoading"
            message="Attendere prego..."
            spinner="crescent"
          />
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding content-custom">
        <!-- Navigazione mese -->

        <div class="month-navigation-container">
            <ion-button 
              @click="spostaMese(-1)" 
              class="navigation-button"
              fill="clear"
              :disabled="isOpenLoading"
            >
              <ion-icon :icon="chevronBack" />
            </ion-button>
            
            <h1 class="month-title">{{ nomeMese }}</h1>
            
            <ion-button 
              @click="spostaMese(1)" 
              fill="clear"
              class="navigation-button"

              :disabled="isOpenLoading"
            >
              <ion-icon :icon="chevronForward" />
            </ion-button>

        
        </div>
        <ion-badge color="warning" @click="mostraPopoverFunction">
                Hai {{ numNuovePrenotazioni }} nuove prenotazioni
              </ion-badge>
  
        <!-- Selezione giorni -->
        <div class="div-contenitore-giorni" ref="contenitoreGiorni">
          <div 
            class="div-giorno"
            v-for="(giorno, index) in giorniArray"
            :key="index"
            @click="clickGiorno(giorno)"
            :class="{ 'giorno-selezionato': dataSelezionata.getDate() === giorno.numeroGiorno }">
            {{ giorno.nomeGiornoSettimana }} {{ giorno.numeroGiorno }}
          </div>
        </div>
  
        <!-- Orari / prenotazioni -->
        <div v-if="finito">
          <div 
            v-for="(oggettoOrario, index) in Array.from(setOggettiOrario)" 
            :key="index" 
            class="div-contenitore-orario"
            @click="presentAlert(oggettoOrario.oraInizio, oggettoOrario.prenotato, oggettoOrario.prenotazione)">
            <div 
              :class="{'div-orario': !oggettoOrario.prenotato, 'div-orario-prenotato': oggettoOrario.prenotato}"
              :style="{ height: computeWidth(oggettoOrario.durata/2) }">
              {{ oggettoOrario.oraInizio }} / {{ incrementaOrario(oggettoOrario.oraInizio, oggettoOrario.durata) }}
            </div>
            <div class="div-informazioni-prenotazione">
              <div v-if="oggettoOrario.prenotato">{{ oggettoOrario.nomeCliente }}</div>
              <div style="font-size:medium; margin: 5px;" v-if="oggettoOrario.prenotato">
                Servizio: {{ oggettoOrario.sceltaUtente.nome }}
              </div>
            </div>
            <ion-badge v-if="oggettoOrario.new" color="warning">New</ion-badge>
          </div>
        </div>
      </ion-content>
  
      <!-- Popover per le nuove prenotazioni -->
      <ion-popover :is-open="mostraPopover" @ionPopoverDidDismiss="mostraPopover = false">
        <div class="popover-content">
          <h3>Nuove Prenotazioni</h3>
          <ul>
            <li v-for="(prenotazione, index) in nuovePrenotazioni" :key="index" class="prenotazione-item">
              <div class="prenotazione-details">
                <strong>Data: {{ formatDate(prenotazione.dataPrenotazione) }}</strong><br>
                <span>{{ prenotazione.nomeCliente }} {{ prenotazione.cognomeCliente }}</span><br>
                <span>Servizio: {{ prenotazione.servizioSelezionato }}</span>
              </div>
            </li>
          </ul>
        </div>
      </ion-popover>
  
      <!-- Modal per le informazioni sulla prenotazione -->
      <AlertInformazioniPrenotazione 
        :is-open="isModalOpen" 
        :prenotazioneSelected="prenotazioneSelected" 
        @close-modal="closeModal" 
        @ricarica-orari="ricaricaOrari" />
    </ion-page>
  </template>
  
  <script setup>
  import { ref, onMounted, reactive } from 'vue';
  import { useStore } from 'vuex';
  import { useRouter } from 'vue-router';
  import {
    IonLoading,
    IonPopover,
    onIonViewDidEnter,
    alertController,
    IonPage,
    IonContent,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonBadge,
    modalController,
    toastController
  } from '@ionic/vue';
  import { 
    getFirestore, collection, where, getDocs, query, addDoc, doc, updateDoc 
  } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import BackButton from '/src/views/Components/BackButton.vue';
  import AlertInformazioniPrenotazione from '/src/views/Components/AlertInformazioniPrenotazione.vue';
  import { chevronBack, chevronForward} from 'ionicons/icons';

  // Inizializzazioni e reactive state
  const store = useStore();
  const db = getFirestore();
  const router = useRouter();
  const auth = getAuth();
  
  const isOpenLoading = ref(false);
  let dataSelezionata = reactive(new Date());
  let giorniArray = reactive([]);
  let orariMap = reactive(new Map());
  let orariPerGiorno = reactive(new Set());
  let prenotazioni = reactive(new Set());
  let finito = ref(false);
  const contenitoreGiorni = ref(null);
  let nomeMese = ref('');
  // Set di oggetti orario: oraInizio, prenotato, durata, etc.
  const setOggettiOrario = reactive(new Set());
  const mostraPopover = ref(false);
  const prenotazioneSelected = ref("");
  const nuovePrenotazioni = ref([]);
  const numNuovePrenotazioni = ref(0);
  
  // Per il Modal di AlertInformazioniPrenotazione
  const isModalOpen = ref(false);
  const openModal = () => isModalOpen.value = true;
  const closeModal = () => isModalOpen.value = false;
  
  // Ottieni l'ID del documento negozio dal Vuex store
  const idDocumentNegozio = store.getters.getIdDocumentNegozioGestore;
  
  // Funzione per mostrare il Toast in caso di errori o messaggi informativi
  async function showToast(message) {
    const toast = await toastController.create({
      message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }
  
  // Funzione per mostrare il Popover
  function mostraPopoverFunction() {
    mostraPopover.value = true;
  }
  
  // Ricarica degli orari e prenotazioni
  async function ricaricaOrari() {
    await recuperaPrenotazioni();
  }
  
  // Presenta l'Alert a seconda che l'orario sia prenotato o meno
  const presentAlert = async (oraInizio, prenotato, prenotazione) => {
    if (prenotato) {
      prenotazioneSelected.value = prenotazione;
      // Aggiorna il documento della prenotazione (setta 'new' a false)
      const prenotazioneRef = doc(db, "Prenotazioni", prenotazione.id);
      try {
        await updateDoc(prenotazioneRef, { new: false });
        openModal();
      } catch (error) {
        console.error("Errore nell'aggiornamento della prenotazione:", error);
        await showToast("Errore nell'aggiornamento della prenotazione.");
      }
    } else {
      const alertButtons = [
        {
          text: 'Annulla',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Conferma',
          cssClass: 'alert-button-confirm',
          handler: async (data) => {
            const nomeCliente = data[0];
            const sceltaUtente = data[1];
            await inserisciPrenotazione(nomeCliente, sceltaUtente, oraInizio);
          }
        }
      ];
  
      const alertInputs = [
        {
          type: 'textarea',
          placeholder: 'Inserisci il nome del cliente'
        },
        {
          type: 'textarea',
          placeholder: 'Inserisci eventuale descrizione'
        }
      ];
  
      const alertInstance = await alertController.create({
        header: 'Inserisci manualmente la prenotazione',
        buttons: alertButtons,
        inputs: alertInputs
      });
  
      await alertInstance.present();
    }
  };
  
  // Calcola i giorni del mese in base alla data selezionata
  function calcolaGiorniMese(dataSelezionata) {
    const mese = dataSelezionata.getMonth();
    const anno = dataSelezionata.getFullYear();
    const dataInizioMese = new Date(anno, mese, 1);
    const dataFineMese = new Date(anno, mese + 1, 0);
    const dateArray = [];
  
    while (dataInizioMese <= dataFineMese) {
      const nomeGiornoSettimana = new Intl.DateTimeFormat('it-IT', { weekday: 'long' }).format(dataInizioMese);
      const oggettoGiorno = {
        nomeGiornoSettimana: nomeGiornoSettimana.charAt(0).toUpperCase() + nomeGiornoSettimana.slice(1),
        numeroGiorno: dataInizioMese.getDate()
      };
      dateArray.push(oggettoGiorno);
      dataInizioMese.setDate(dataInizioMese.getDate() + 1);
    }
  
    return dateArray;
  }
  
  // Recupera gli orari lavorativi dal documento Negozi
  async function recuperaTuttiOrariLavorativi() {
    try {
      isOpenLoading.value = true;
      const uiduser = auth.currentUser.uid;
      const q = query(collection(db, "Negozi"), where("proprietarioUid", "==", uiduser));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0];
        const orariObject = docRef.data().orariLavorativi;
        orariMap = new Map(Object.entries(orariObject));
  
        orariMap.forEach((orariGiorno, giorno) => {
          orariMap.set(giorno, orariGiorno.sort(confrontaOrari));
        });
  
        prendiOrariPergiorno(creaOggettoGiorno(dataSelezionata));
      } else {
        console.error('Nessun documento trovato per uiduser');
        await showToast("Nessun orario trovato per il tuo negozio.");
      }
      isOpenLoading.value = false;
    } catch (error) {
      isOpenLoading.value = false;
      console.error('Errore nel recupero degli orari:', error);
      await showToast("Errore durante il recupero degli orari.");
    }
  }
  
  // Funzione per confrontare due orari (formato "HH:MM")
  function confrontaOrari(orario1, orario2) {
    const [ore1, minuti1] = orario1.split(':').map(Number);
    const [ore2, minuti2] = orario2.split(':').map(Number);
    return ore1 !== ore2 ? ore1 - ore2 : minuti1 - minuti2;
  }
  
  // Preleva gli orari per il giorno selezionato
  function prendiOrariPergiorno(giorno) {
    orariPerGiorno.clear();
    const nomeGiornoSettimana = giorno.nomeGiornoSettimana;
    orariMap.forEach((valore, chiave) => {
      if (chiave == nomeGiornoSettimana) {
        valore.forEach(ora => {
          orariPerGiorno.add(ora);
        });
      }
    });
  }
  
  // Crea un oggetto giorno dalla data
  function creaOggettoGiorno(data) {
    const nomeGiornoSettimana = new Intl.DateTimeFormat('it-IT', { weekday: 'long' }).format(data);
    const oggettoGiorno = {
      nomeGiornoSettimana: nomeGiornoSettimana.charAt(0).toUpperCase() + nomeGiornoSettimana.slice(1),
      numeroGiorno: data.getDate()
    };
    return oggettoGiorno;
  }
  
  // Recupera le prenotazioni dal database
  async function recuperaPrenotazioni() {
    try {
      isOpenLoading.value = true;
      prenotazioni.clear();
      nuovePrenotazioni.value = [];
  
      // Query per le prenotazioni del giorno selezionato
      const q = query(
        collection(db, "Prenotazioni"), 
        where("idDocumentNegozio", "==", idDocumentNegozio),
        where("dataPrenotazione", ">=", dataSelezionata),
        where("dataPrenotazione", "<", new Date(dataSelezionata.getTime() + 24 * 60 * 60 * 1000))
      );
  
      // Query per tutte le prenotazioni (per identificare quelle 'new')
      const query2 = query(
        collection(db, "Prenotazioni"), 
        where("idDocumentNegozio", "==", idDocumentNegozio)
      );
  
      const querySnapshot2 = await getDocs(query2);
  
      querySnapshot2.forEach((docSnapshot) => {
        const dataDocumento = docSnapshot.data();
        dataDocumento.id = docSnapshot.id;
        if (dataDocumento.new === true) {
          nuovePrenotazioni.value.push(dataDocumento);
        }
      });
  
      numNuovePrenotazioni.value = nuovePrenotazioni.value.length;
  
      const querySnapshot = await getDocs(q);
  
      querySnapshot.forEach((docSnapshot) => {
        const dataDocumento = docSnapshot.data();
        dataDocumento.id = docSnapshot.id;
        prenotazioni.add(dataDocumento);
      });
  
      // Crea il set degli oggetti orario in base agli orari disponibili e prenotazioni
      creaSetPrenotazioni(prenotazioni, orariPerGiorno);
      finito.value = true;
      isOpenLoading.value = false;
    } catch (error) {
      isOpenLoading.value = false;
      console.error('Errore nel recupero delle prenotazioni:', error);
      await showToast("Errore nel recupero delle prenotazioni.");
    }
  }
  
  // Crea il set degli oggetti orario basato sugli orari disponibili.
  // Se viene trovata una prenotazione che inizia in un determinato slot,
  // viene creata un'unica casella con proprietà 'durata' (in minuti)
  // e vengono saltati i successivi slot coperti dalla prenotazione.
  function creaSetPrenotazioni(prenotazioni, orariPerGiorno) {
    setOggettiOrario.clear();

    try {
      let sortedOrari = Array.from(orariPerGiorno).sort();
    for (let i = 0; i < sortedOrari.length; i++) {
      let slot = sortedOrari[i];
      // Verifica se esiste una prenotazione che inizia in questo slot
      let prenotazioneCorrispondente = Array.from(prenotazioni).find(prenot => prenot.oraInizio === slot);
      if (prenotazioneCorrispondente) {
        const durata = prenotazioneCorrispondente.durataServizioSelezionato;
        const oggettoOrario = {
           prenotato: true,
           oraInizio: slot,
           durata,  // durata in minuti
           sceltaUtente: prenotazioneCorrispondente.servizioSelezionato,
           nomeCliente: prenotazioneCorrispondente.nomeCliente,
           prenotazione: prenotazioneCorrispondente,
           new: prenotazioneCorrispondente.new
        };
        setOggettiOrario.add(oggettoOrario);
        // Salta i successivi slot coperti da questa prenotazione
        let skipSlots = Math.floor(durata / 15) - 1;
        i += skipSlots;
      } else {
        // Slot libero (15 minuti)
        const oggettoOrario = {
           prenotato: false,
           oraInizio: slot,
           durata: 15,
           sceltaUtente: '',
           nomeCliente: '',
           prenotazione: ""
        };
        setOggettiOrario.add(oggettoOrario);
      }
    }
      
    } catch (error) {
      console.log(error)
      
    }    // Ordina gli orari disponibili
   
  }
  
  // Inserisce una nuova prenotazione nel database
  async function inserisciPrenotazione(nomeCliente, sceltaUtente, oraInizio) {
    try {
      const nuovaPrenotazione = {
        dataPrenotazione: dataSelezionata,
        idDocumentNegozio: idDocumentNegozio,
        oraInizio: oraInizio,
        nomeCliente: nomeCliente,
        servizioSelezionato: sceltaUtente,
        durataServizioSelezionato: 15
      };
  
      await addDoc(collection(db, 'Prenotazioni'), nuovaPrenotazione);
      await recuperaTuttiOrariLavorativi();
      await recuperaPrenotazioni();
    } catch (error) {
      console.error("Errore durante l'inserimento della prenotazione:", error);
      await showToast("Errore durante l'inserimento della prenotazione.");
    }
  }
  
  // Incrementa l'orario di un certo numero di minuti
  const formattaNumeroConZero = (num) => (num < 10 ? `0${num}` : num.toString());
  const incrementaOrario = (orario, minuti) => {
    const [ore, minutiAttuali] = orario.split(':').map(Number);
    const nuovaData = new Date();
    nuovaData.setHours(ore);
    nuovaData.setMinutes(minutiAttuali + minuti);
    return `${formattaNumeroConZero(nuovaData.getHours())}:${formattaNumeroConZero(nuovaData.getMinutes())}`;
  };
  
  // Calcola la larghezza della casella in base alla durata (baseWidth per 15 minuti)
  const baseWidth = 80; // px per 15 minuti
  function computeWidth(durata) {
    return (durata / 15) * baseWidth + 'px';
  }
  
  // Sposta il mese in avanti o indietro e ricarica i dati
  async function spostaMese(meseOffset) {
    finito.value = false;
    const nuovaData = new Date(dataSelezionata);
    nuovaData.setMonth(nuovaData.getMonth() + meseOffset);
    dataSelezionata = nuovaData;
    nomeMese = new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(dataSelezionata);
    giorniArray = calcolaGiorniMese(dataSelezionata);
    await recuperaTuttiOrariLavorativi();
    await recuperaPrenotazioni();
    finito.value = true;
    scrollToIndex(dataSelezionata.getDate());
  }
  
  // Effettua lo scroll fino al giorno selezionato
  function scrollToIndex(index) {
    if (contenitoreGiorni.value) {
      const container = contenitoreGiorni.value;
      const element = container.children[index];
      if (element) {
        const scrollLeft = element.offsetLeft - container.offsetLeft - 300;
        container.scrollLeft = scrollLeft;
      }
    }
  }
  
  // Gestisce il click su un giorno
  async function clickGiorno(giorno) {
    dataSelezionata.setDate(giorno.numeroGiorno);
    giorniArray = calcolaGiorniMese(dataSelezionata);
    await recuperaTuttiOrariLavorativi();
    await recuperaPrenotazioni();
  }
  
  // Aggiunge minuti ad un orario (formato "HH:MM")
  function aggiungiMinuti(ora, minuti) {
    const [ore, minutiOra] = ora.split(':').map(Number);
    const data = new Date();
    data.setHours(ore);
    data.setMinutes(minutiOra + minuti);
    return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
  }
  
  // Format della data per visualizzazione
  function formatDate(timestamp) {
    if (!timestamp || typeof timestamp !== 'object') {
      return "Data non valida";
    }
    const dateMilliseconds = timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000);
    const d = new Date(dateMilliseconds);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ore ${hours}:${minutes}`;
  }
  
  // Quando la view entra, inizializza la data, i giorni e carica orari/prenotazioni
  onIonViewDidEnter(async () => {
    dataSelezionata.setHours(0, 0, 0, 0);
    nomeMese = new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(dataSelezionata);
    giorniArray = calcolaGiorniMese(dataSelezionata);
    await recuperaTuttiOrariLavorativi();
    await recuperaPrenotazioni();
    scrollToIndex(dataSelezionata.getDate());
  });
  </script>
  
  <style scoped>

  .content-custom {
    background: #f0f4f8;
  }
  
/* Contenitore principale della navigazione */
.month-navigation-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  max-height: 80px; /* Permette agli elementi di andare su più righe su schermi piccoli */
}

/* Bottoni di navigazione */
.navigation-button {
  font-size: 24px;
  border: none;
  background: none;
  cursor: pointer;
  margin-top: 0px;
}

/* Titolo del mese */
.month-title {
  font-size: 1.5rem;
  text-align: end;
  margin-top: 0%;
}


  /* Contenitore giorni (scroll orizzontale) */
  .div-contenitore-giorni {
    display: flex;
    overflow-x: auto;
    margin: 1rem 0;
  }
  .div-giorno {
    flex: 0 0 auto;
    margin: 5px;
    text-align: center;
    min-width: 80px;
    min-height: 50px;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    background: #fff;
    transition: background-color 0.3s ease;
    cursor: pointer;
  }
  .giorno-selezionato {
    background: #bdbdbd;
  }
  
  /* Contenitore orari/prenotazioni */
  .div-contenitore-orario {
    display: flex;
    align-items: center;
    padding: 10px;
    margin-top: 10px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    background: #fff;
  }
  
  /* Casella orario libero */
  .div-orario {
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    min-height: 50px;
    text-align: center;
    font-size: 0.9rem;
    color: #424242;
    background: #e0e0e0;
  }
  
  /* Casella prenotata: verde acceso */
  .div-orario-prenotato {
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    min-height: 50px;
    text-align: center;
    font-size: 0.9rem;
    color: #fff;
    background: #00e676;
  }
  
  /* Informazioni prenotazione */
  .div-informazioni-prenotazione {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  /* Popover styling */
  .popover-content {
    padding: 16px;
    font-family: Arial, sans-serif;
  }
  .prenotazione-item {
    margin-bottom: 12px;
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    background-color: #f9f9f9;
  }
  .prenotazione-details {
    font-size: 14px;
    color: #333;
  }
  </style>
  