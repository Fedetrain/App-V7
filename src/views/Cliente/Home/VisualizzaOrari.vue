<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <BackButton />
        <ion-loading 
          :is-open="isOpenLoading" 
          message="Caricamento..."
          :spinner="'circular'"
          css-class="custom-loading"
        ></ion-loading>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" :scroll-events="true">
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
          class="navigation-button"
          fill="clear"
          :disabled="isOpenLoading"
        >
          <ion-icon :icon="chevronForward" />
        </ion-button>
      </div>

      <div class="days-container" ref="contenitoreGiorni">
        <div 
          v-for="(giorno, index) in giorniArray"
          :key="index"
          class="day-item"
          :class="{ 
            'selected-day': dataSelezionata.getDate() === giorno.numeroGiorno,
            'disabled-item': isOpenLoading
          }"
          @click="!isOpenLoading && clickGiorno(giorno)"
        >
          <span class="weekday-name">{{ giorno.nomeGiornoSettimana.slice(0, 3) }}</span>
          <span class="day-number">{{ giorno.numeroGiorno }}</span>
        </div>
      </div>

      <div v-if="finito" class="time-slots-container">
        <div 
          v-for="(orario, index) in setDefinitivoTemplate" 
          :key="index"
          class="time-slot-wrapper"
        >
          <div 
            class="time-slot-card"
            :class="{ 'active-slot': orarioSelezionato === orario }"
            @click="!isOpenLoading && gestisciClickOrario(orario)"
          >
            <div class="time-display">
              {{ orario }}
              <ion-icon 
                :icon="alarmOutline" 
                class="time-icon"
              />
            </div>
            
            <transition name="slide-fade">
              <div v-if="orarioSelezionato === orario" class="booking-form">
                <ion-item class="input-item">
                  <ion-textarea
                    v-model="testoCommento"
                    placeholder="Aggiungi note (opzionale)"
                    auto-grow
                    rows="2"
                    class="custom-textarea"
                  ></ion-textarea>
                </ion-item>
                
                <ion-button 
                  @click="inserisciPrenotazione(orario)"
                  expand="block" 
                  class="booking-button"
                  :disabled="isOpenLoading"
                >
                  <ion-spinner 
                    v-if="isOpenLoading" 
                    name="crescent" 
                    class="button-spinner"
                  />
                  <span v-else>Conferma Prenotazione</span>
                </ion-button>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <div 
        v-show="setDefinitivoTemplate.size === 0" 
        class="empty-state"
      >
        <ion-icon :icon="calendarOutline" class="empty-icon" />
        <p class="empty-text">Nessun orario disponibile per questa data</p>
      </div>

      <ion-alert
        :is-open="isOpen"
        header="Prenotazione Confermata"
        sub-header="Operazione completata con successo"
        :buttons="['OK']"
        @didDismiss="setOpen(false)"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>


<script setup>
import { ref, onMounted, reactive } from 'vue';
import {IonAlert,IonPage, IonContent, IonHeader, IonToolbar, IonButton, IonInput,IonLoading } from '@ionic/vue';
import { useStore } from 'vuex';
import { getFirestore, doc, getDoc,Timestamp,addDoc,collection, query, where, getDocs, persistentSingleTabManager} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import BackButton from '/src/views/Components/BackButton.vue';
import { LocalNotifications } from '@capacitor/local-notifications';


const store = useStore();
const db = getFirestore();
const auth = getAuth();

let dataSelezionata=reactive('');
let giorniArray=reactive([]);
let orariMap = reactive(new Map());
let orariPerGiorno = reactive(new Set());
let orariPrenotazione= reactive(new Set());
const isOpenLoading = ref(false);

const testoCommento = ref('');

let nomeMese=reactive('');
let finito= ref(false);
const orarioSelezionato = ref(null);
const idDocumentNegozio = store.getters.getIdDocumentNegozioSelezionato;
const servizioSelezionato = store.getters.getServizioSelezionato;
const durataServizioSelezionato=store.getters.getDurataServizioSelezionato;


const contenitoreGiorni = ref(null);
let setDefinitivoTemplate=reactive(new Set());

const isOpen = ref(false);



const nomeNegozio = store.getters.getNomeNegozio;




const recuperaFerie = async () => {
  const setFerie = []; // Initialize an array instead of a Set
  
  const IdDocumentNegozioSelezionato = store.getters.getIdDocumentNegozioSelezionato;
  try {
    const collezioneInternaRef = collection(db, 'Negozi', IdDocumentNegozioSelezionato, 'Ferie');
    const q = query(collezioneInternaRef);

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const datiDocumento = doc.data();
      setFerie.push(datiDocumento); // Push the date directly to the array
    });

    return setFerie; // Return the array
  } catch (error) {
    console.error('Errore durante il recupero dei documenti interni:', error);
    return []; // Return an empty array in case of an error
  }
};




onMounted(async () => {
  isOpenLoading.value = true;
    dataSelezionata = store.getters.getDataNegozioSelezionato
    dataSelezionata.setHours(0,0,0,0)
    const opzionimese = { month: 'long' };
    nomeMese = Intl.DateTimeFormat('it-IT', opzionimese).format(dataSelezionata);
    giorniArray = await calcolaGiorniMese(dataSelezionata);

    await recuperaTuttiOrariLavorativi();
    await recuperaPrenotazioni();
    controllaSovrapposizione();
    finito.value=true;
    scrollToIndex(dataSelezionata.getDate());
    isOpenLoading.value = false;
});
async function calcolaGiorniMese(dataSelezionata) {
    const arrayferie = await recuperaFerie(); // Recupera il set di ferie, presunto formato con timestamp Firebase
    const meseSelezionato = dataSelezionata.getMonth();
    const annoSelezionato = dataSelezionata.getFullYear();
    const dataOggi = new Date();
    const meseCorrente = dataOggi.getMonth();
    const annoCorrente = dataOggi.getFullYear();


    const dateArray = [];

    const dataInizioMese = new Date(annoSelezionato, meseSelezionato, 1);
    const dataFineMese = new Date(annoSelezionato, meseSelezionato + 1, 0);

    // Determina il giorno di inizio per l'iterazione
    const giornoInizio = (meseSelezionato === meseCorrente && annoSelezionato === annoCorrente) ? dataOggi.getDate() : 1;

    // Ciclo sui giorni dal giorno di inizio alla fine del mese
    for (let d = giornoInizio; d <= dataFineMese.getDate(); d++) {
        const dataCorrente = new Date(annoSelezionato, meseSelezionato, d);
        

        const opzionigiorno = { weekday: 'long' };
        let nomeGiornoSettimana = new Intl.DateTimeFormat('it-IT', opzionigiorno).format(dataCorrente);
        nomeGiornoSettimana = nomeGiornoSettimana.charAt(0).toUpperCase() + nomeGiornoSettimana.slice(1);

        const numeroGiorno = dataCorrente.getDate();

        const opzionimese = { month: 'long' };
        const nomeMese = new Intl.DateTimeFormat('it-IT', opzionimese).format(dataCorrente);

        const oggettoGiorno = {
            nomeGiornoSettimana: nomeGiornoSettimana,
            numeroGiorno: numeroGiorno,
            nomeMese: nomeMese.charAt(0).toUpperCase() + nomeMese.slice(1),
        };

        dateArray.push(oggettoGiorno);
    }


    const dateFerie = arrayferie.map(f => {
      const seconds = f.timestamp.seconds; // Ottieni i secondi dal timestamp
      const nanoseconds = f.timestamp.nanoseconds; // Ottieni i nanosecondi dal timestamp
      
      // Calcola i millisecondi totali
      const milliseconds = (seconds * 1000) + Math.floor(nanoseconds / 1000000);
      
      // Restituisci un nuovo oggetto Date
      return new Date(milliseconds);
    });

    const dateFiltrate = dateArray.filter(giorno => {
        const dataControllo = new Date(annoSelezionato, meseSelezionato, giorno.numeroGiorno);

        // Controlla se dataControllo è presente nelle date ferie
        const isFerie = dateFerie.some(f => f.getTime() === dataControllo.getTime());

        // Se non è una data di ferie, mantenila nell'array
        return !isFerie;
    });

    return dateFiltrate; // Restituisce le date filtrate
}


async function recuperaTuttiOrariLavorativi() {
  try {
    isOpenLoading.value= true

    const IdDocumentNegozioSelezionato = store.getters.getIdDocumentNegozioSelezionato;
    const ref = doc(db, "Negozi",IdDocumentNegozioSelezionato);
    const docSnap = await getDoc(ref);

      if (docSnap.exists()) {
        const orariObject = docSnap.data().orariLavorativi;
        const orari = new Map(Object.entries(orariObject));

        // Ordina gli orari per ogni giorno
        for (const [giorno, orariGiorno] of orari) {
          orari.set(giorno, orariGiorno.sort(confrontaOrari));
        }
        orariMap = orari;
        const opzionigiorno = { weekday: 'long' };
        let nomeGiornoSettimana = new Intl.DateTimeFormat('it-IT', opzionigiorno).format(dataSelezionata);
        nomeGiornoSettimana = nomeGiornoSettimana.charAt(0).toUpperCase() + nomeGiornoSettimana.slice(1);
        const numeroGiorno = dataSelezionata.getDate();
        const numeroMese = dataSelezionata.getMonth();
        const numeroAnno = dataSelezionata.getFullYear();

        const oggettoGiorno = {
          nomeGiornoSettimana: nomeGiornoSettimana,
          numeroGiorno: numeroGiorno,
          numeroMese:numeroMese,
          numeroAnno:numeroAnno,
        };

        await prendiOrariPergiorno(oggettoGiorno);
      } else {
      }
      isOpenLoading.value= false

    
  } catch (error) {
    isOpenLoading.value= false

    console.error('Errore durante il recupero degli orari:', error);
  }
};
function prendiOrariPergiorno(giorno) {
    const nomeGiornoSettimana = giorno.nomeGiornoSettimana;
    
    // Verifica se il giorno è quello corrente
    const dataOdierna = new Date();
    if (giorno.numeroGiorno === dataOdierna.getDate() &&
        giorno.numeroMese === dataOdierna.getMonth() &&
        giorno.numeroAnno === dataOdierna.getFullYear()) {

        console.log("Oggi è", nomeGiornoSettimana);

        orariPerGiorno.clear();

        // Ottieni l'orario corrente e calcola l'orario 15 minuti fa
        const oraCorrente = dataOdierna.getHours() * 100 + dataOdierna.getMinutes();
        const ora15MinutiFa = oraCorrente;

        orariMap.forEach((valore, chiave) => {
            if (chiave === nomeGiornoSettimana) {
                console.log("Orari trovati per il giorno:", chiave);

                // Filtra gli orari per rimuovere quelli precedenti di 15 minuti
                valore.forEach(ora => {
                    const oraInt = parseInt(ora.replace(':', ''));
                    if (oraInt >= ora15MinutiFa) {
                        orariPerGiorno.add(ora);
                    }
                });
            }
        });

        console.log("Orari per il giorno corrente:", Array.from(orariPerGiorno));
    } else {
        console.log("Il giorno selezionato non è oggi.");

        // Se il giorno non è oggi, prendi gli orari senza filtri
        orariPerGiorno.clear();
        orariMap.forEach((valore, chiave) => {
            if (chiave === nomeGiornoSettimana) {
                console.log("Orari trovati per il giorno:", chiave);
                valore.forEach(ora => orariPerGiorno.add(ora));
            }
        });

        console.log("Orari per il giorno selezionato:", Array.from(orariPerGiorno));
    }
}


async function recuperaPrenotazioni() {
  try {
    isOpenLoading.value= true

    // Inizializza un Set per gli orari delle prenotazioni
    orariPrenotazione = new Set();
    console.log('Inizio recupero prenotazioni per data selezionata:', dataSelezionata);

    // Creazione della data di confronto senza ora
    const dataDaCercare = new Date(dataSelezionata);
    dataDaCercare.setHours(0, 0, 0, 0); // Imposta l'ora a mezzanotte
    console.log('Data da cercare impostata a mezzanotte:', dataDaCercare);

    // Calcola la data per il giorno successivo per includere tutto il giorno corrente
    const dataSuccessiva = new Date(dataDaCercare);
    dataSuccessiva.setDate(dataSuccessiva.getDate() + 1);
    console.log('Data successiva (giorno dopo):', dataSuccessiva);

    // Query per le prenotazioni con la data compresa tra dataDaCercare e dataSuccessiva
    const q = query(collection(db, "Prenotazioni"), 
      where("dataPrenotazione", ">=", dataDaCercare), 
      where("dataPrenotazione", "<", dataSuccessiva),
      where("idDocumentNegozio", "==", idDocumentNegozio)
    );

    console.log('Esecuzione della query:', q);

    const querySnapshot = await getDocs(q);
    console.log('Numero di prenotazioni recuperate:', querySnapshot.size);

    // Itera sui documenti
    querySnapshot.forEach((doc) => {
      const dataDocumento = doc.data();
      orariPrenotazione.add(dataDocumento);
    });

    // Log degli orari delle prenotazioni
    console.log('Orari Prenotazione:', Array.from(orariPrenotazione));
    isOpenLoading.value= false

  } catch (error) {
    isOpenLoading.value= false

    console.error('Errore durante il recupero delle prenotazioni:', error);
  }
}


function controllaSovrapposizione() {
  let setDefinitivo = new Set();

  // Controllo se ci sono orari per il giorno selezionato
  if (orariPerGiorno.size > 0) {

    console.log(`Controllo sovrapposizioni per ${orariPerGiorno.size} orari.`);

    orariPerGiorno.forEach(orarioPerGiorno => {
      let orarioPrenotato = null;
      console.log(`Verifico l'orario: ${orarioPerGiorno}`);

      // Controllo se l'orario è già prenotato

      orariPrenotazione.forEach(prenotazione => {
        console.log("prenotazione.orainizio",prenotazione.oraInizio)
        if (prenotazione.oraInizio === orarioPerGiorno) {
          orarioPrenotato = prenotazione;
          console.log(`Orario ${orarioPerGiorno} trovato nelle prenotazioni. Dettagli:`, prenotazione);
        }
      });

      // Controlla se l'orario è prenotato o meno
      if (orarioPrenotato) {
        console.log(`Orario ${orarioPerGiorno} è già prenotato. Procedo con la prenotazione degli orari consecutivi.`);
        prenotaOrariConsecutivi(orarioPerGiorno, orarioPrenotato.durataServizioSelezionato, setDefinitivo);
      } else {
        console.log(`Orario ${orarioPerGiorno} non è presente nelle prenotazioni. Aggiungo all'elenco degli orari disponibili.`);
        aggiungiOrarioSeNonPresente(orarioPerGiorno, setDefinitivo);
      }
    });

    // Trova gli orari non prenotati consecutivi
    setDefinitivoTemplate = trovaOrariNonPrenotatiConsecutivi(durataServizioSelezionato, setDefinitivo);
    console.log("Set definitivo finale copia:", setDefinitivoTemplate);
    console.log("Set definitivo finale:", setDefinitivo);

  } else {
    setDefinitivoTemplate.clear();
    console.log("Nessun orario da controllare.");
  }
}



function prenotaOrariConsecutivi(orarioInizio, durata, setDefinitivo) {
  console.log(`Inizio prenotazione orari consecutivi. Orario di inizio: ${orarioInizio}, Durata: ${durata}, Set definitivo attuale:`, setDefinitivo);

  const numeroSlot = durata / 15;

  for (let i = 0; i < numeroSlot; i++) {
    const orario = aggiungiMinuti(orarioInizio, i * 15);
    setDefinitivo.add({
      prenotato: true,
      orarioPerGiorno: orario
    });

    console.log(`Orario ${orario} prenotato.`);
  }

  console.log("Fine prenotazione orari consecutivi. Set definitivo aggiornato:", setDefinitivo);
}

function aggiungiOrarioSeNonPresente(orarioPerGiorno,setDefinitivo) {
  const orarioGiaPresente = Array.from(setDefinitivo).some(orario => orario.orarioPerGiorno === orarioPerGiorno);

  if (!orarioGiaPresente) {
    setDefinitivo.add({
      prenotato: false,
      orarioPerGiorno: orarioPerGiorno
    });
  }
}

function trovaOrariNonPrenotatiConsecutivi(durata, setDefinitivo) {


  const orariArray = Array.from(setDefinitivo);  // Converte il set a un array
  const orariNonPrenotatiConsecutivi = new Set();
  let consecutiviNonPrenotati = [];

  for (const orario of orariArray) {
    if (!orario.prenotato) {
      consecutiviNonPrenotati.push(orario.orarioPerGiorno);
    } else {
      if (consecutiviNonPrenotati.length >= durata / 15) {
        consecutiviNonPrenotati.forEach(ora => orariNonPrenotatiConsecutivi.add(ora));
      }
      consecutiviNonPrenotati = [];
    }
  }

  if (consecutiviNonPrenotati.length >= durata / 15) {
    consecutiviNonPrenotati.forEach(ora => orariNonPrenotatiConsecutivi.add(ora));
    console.log("Orari aggiunti al set finale:", consecutiviNonPrenotati);
  }

  console.log("Orari non prenotati consecutivi per la durata del servizio scelto:", orariNonPrenotatiConsecutivi);
  console.log("Fine ricerca orari non prenotati consecutivi");

  rimuoviUltimiOrari(orariNonPrenotatiConsecutivi, durata);
  rimuoviUltimiOrar(orariNonPrenotatiConsecutivi, orariArray,durata);

  console.log("Orari non prenotati consecutivi dopo rimozione ultimi orari:", orariNonPrenotatiConsecutivi);

  return orariNonPrenotatiConsecutivi;
}

function rimuoviUltimiOrari(orariNonPrenotatiConsecutivi, durataServizioSelezionato) {
  const arraySet = Array.from(orariNonPrenotatiConsecutivi);
  const x = durataServizioSelezionato / 15;
  const nuoviElementi = arraySet.slice(0, arraySet.length - x);
  orariNonPrenotatiConsecutivi.clear();
  nuoviElementi.forEach(elemento => orariNonPrenotatiConsecutivi.add(elemento));
  console.log("Ultimi orari rimossi:", x);
  console.log("Nuovi orari non prenotati consecutivi:", orariNonPrenotatiConsecutivi);
}

function rimuoviUltimiOrar(orariNonPrenotatiConsecutivi, orariArray, durata) {
  const arraySet = Array.from(orariNonPrenotatiConsecutivi);
  const durataInOrari = durata / 15;

  for (let i = arraySet.length - 1; i >= 0; i--) {
    const orarioCorrente = arraySet[i];
    const indiceOrarioCorrente = orariArray.findIndex(ora => ora.orarioPerGiorno === orarioCorrente);

    if (indiceOrarioCorrente !== -1) {
      const orarioSuccessivoPrenotato = orariArray.slice(indiceOrarioCorrente + 1)
        .find(ora => ora.prenotato);

      if (orarioSuccessivoPrenotato) {
        const differenzaTempo = orariArray.indexOf(orarioSuccessivoPrenotato) - indiceOrarioCorrente;

        if (differenzaTempo < durataInOrari) {
          // Rimuovi l'orario non prenotato consecutivo
          orariNonPrenotatiConsecutivi.delete(orarioCorrente);
        }
      }
    }
  }
}




function aggiungiMinuti(ora, minuti) {
  const [ore, minutiOra] = ora.split(':').map(Number);
  const data = new Date();
  data.setHours(ore, minutiOra + minuti, 0);

  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

function confrontaOrari (orario1, orario2){
    const [ore1, minuti1] = orario1.split(':').map(Number);
    const [ore2, minuti2] = orario2.split(':').map(Number);

    if (ore1 !== ore2) {
        return ore1 - ore2;
    }

    return minuti1 - minuti2;
};

function scrollToIndex(index) {
    if (contenitoreGiorni.value) {
        const container = contenitoreGiorni.value;
        const element = container.children[index];
        if (element) {
        // Ottieni la posizione dell'elemento all'interno del contenitore
        const scrollLeft = element.offsetLeft - container.offsetLeft -300;
        // Scorri il contenitore
        container.scrollLeft = scrollLeft;
        }
    }
}
async function clickGiorno(giorno,index) {
    finito.value=false;
    dataSelezionata.setDate(giorno.numeroGiorno);
    giorniArray = await calcolaGiorniMese(dataSelezionata);
    await recuperaTuttiOrariLavorativi();
    await recuperaPrenotazioni();
    controllaSovrapposizione();
    finito.value=true;
}
async function spostaMese(meseOffset) {
    finito.value = false;
    const nuovaData = new Date(dataSelezionata);
    nuovaData.setMonth(nuovaData.getMonth() + meseOffset);

    // Controllo per verificare che `nuovaData` non sia in un mese passato rispetto a oggi
    const dataOggi = new Date();
    dataOggi.setDate(1); // Imposta il giorno al primo giorno del mese corrente per un confronto solo mese/anno

    if (nuovaData <= dataOggi) {
        finito.value = true;
        return;
    }

    // Aggiorna `dataSelezionata` solo se il controllo è passato
    dataSelezionata = nuovaData;
    const opzionimese = { month: 'long' };
    nomeMese = Intl.DateTimeFormat('it-IT', opzionimese).format(dataSelezionata);

    // Ricalcola i giorni del mese aggiornato
    giorniArray = await calcolaGiorniMese(dataSelezionata);

    // Recupera orari lavorativi e prenotazioni per il nuovo mese
    await recuperaTuttiOrariLavorativi();
    await recuperaPrenotazioni();
    controllaSovrapposizione();
    finito.value = true;

    // Scorri alla data del giorno selezionato
    scrollToIndex(dataSelezionata.getDate());
}


function gestisciClickOrario(ora) {
  orarioSelezionato.value = ora;
}

async function getProprietarioUid(idDocumentNegozio) {
  try {
    const negozioDocRef = doc(db, 'Negozi', idDocumentNegozio);
    const negozioDoc = await getDoc(negozioDocRef);

    if (negozioDoc.exists()) {
      const negozioData = negozioDoc.data();
      const proprietarioUid = negozioData.proprietarioUid;
      return proprietarioUid;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function inserisciPrenotazione(ora) {
  try {
    isOpenLoading.value=true;
    const commento = testoCommento.value;
    const timestampDataPrenotazione = Timestamp.now();
    const idDocumentCliente = auth.currentUser.uid;
    const oraInizio = ora;

    console.log("Durata:", durataServizioSelezionato);

    const [ore, minuti] = oraInizio.split(':').map(Number);
    const nuoviMinuti = (minuti + durataServizioSelezionato) % 60;
    const nuoveOre = (ore + Math.floor((minuti + durataServizioSelezionato) / 60)) % 24;
    const oraFine = `${String(nuoveOre).padStart(2, '0')}:${String(nuoviMinuti).padStart(2, '0')}`;
    const nomeCliente= await recuperaNomeCliente();

    const proprietarioUid= await getProprietarioUid(idDocumentNegozio); //



    const uid = auth.currentUser.uid;

    const [hours, minutes] = ora.split(':').map(Number);
    dataSelezionata.setHours(hours);
    dataSelezionata.setMinutes(minutes);
    dataSelezionata.setSeconds(0);
    dataSelezionata.setMilliseconds(0);


    const docRef = await addDoc(collection(db, "Prenotazioni"), {
      dataPrenotazione: dataSelezionata,
      idDocumentCliente,
      idDocumentNegozio,
      durataServizioSelezionato,
      oraInizio,
      oraFine,
      servizioSelezionato,
      commento,
      timestampDataPrenotazione,
      nomeCliente,
      proprietarioUid,
      new : true,
    });

    const notificationId = Math.floor(Date.now() / 1000); // ID intero basato su secondi
    const title = `Ricordati dell'appuntamento con ${nomeNegozio}`;

// Crea il corpo della notifica, includendo data, ora e servizio
    const body = `Hai un appuntamento alle ${oraInizio} per ${servizioSelezionato}.`;
    let modifiedDate = new Date(dataSelezionata);  // Copia della data originale
    console.error("data Selezionata",dataSelezionata)
    console.error("sto schedulando una notifica per apparire il ",modifiedDate)



    modifiedDate.setHours(modifiedDate.getHours() - 2)

    console.error("sto schedulando una notifica per apparire il ",modifiedDate)


    LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title:title,
            body: body,
            schedule: { at: modifiedDate },  // Mostra alla data modificata (2 ore prima)
            sound: 'default', // Suono di default
          },
        ],
      });

    finito.value = false;
    await recuperaPrenotazioni();
    controllaSovrapposizione();
    finito.value=true;
    isOpen.value=true;



    console.log("Prenotazione aggiunta con successo! ID del documento:", docRef.id);
    isOpenLoading.value= false

  } catch (error) {
    console.error("Errore durante l'inserimento della prenotazione:", error);
    isOpenLoading.value= false

  }
};


function setOpen (boolean) {
  isOpen.value = boolean;
};

async function recuperaNomeCliente(){
  const idDocumentCliente=auth.currentUser.uid
    try {
        const clienteDocRef = doc(db, 'Cliente', idDocumentCliente);

        // Retrieve the document snapshot
        const docSnapshot = await getDoc(clienteDocRef);

        // Check if the document exists
        if (docSnapshot.exists()) {
        // Access the 'nome' field
        const nome = docSnapshot.data().nome;
        const cognome= docSnapshot.data().cognome;
        return nome+" "+ cognome;
        } else {
        console.log('Document does not exist');
        return null;
        }
    } catch (error) {
        console.error('Error retrieving data from Firestore:', error);
        return null;
    }
};

</script>


<style scoped>
/* Container Principali */
.month-navigation-container {
  display: flex;
  align-items: center;
  justify-content: space-between;

}

.days-container {
  display: flex;
  overflow-x: auto;
  gap: 0.8rem;
  padding: 15px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.time-slots-container {
  display: grid;
  gap: 1.2rem;
}

/* Elementi Giorno */
.day-item {
  flex: 0 0 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.8rem;
  border-radius: 12px;
  background: var(--ion-color-light);
  transition: all 0.2s ease;
  border: 1px solid var(--ion-color-light-shade);
  cursor: pointer;
}

.day-item.selected-day {
  background: var(--ion-color-secondary);
  color: var(--ion-color-secondary-contrast);
  border-color: var(--ion-color-secondary-shade);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(var(--ion-color-secondary-rgb), 0.2);
}

.weekday-name {
  font-size: 0.9rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.day-number {
  font-size: 1.4rem;
  font-weight: 600;
  margin-top: 0.3rem;
}

/* Time Slots */
.time-slot-card {
  background: var(--ion-color-light);
  border-radius: 14px;
  padding: 1.2rem;
  transition: all 0.25s ease;
  border: 1px solid var(--ion-color-light-shade);
}

.time-slot-card.active-slot {
  border-color: var(--ion-color-primary-shade);
  box-shadow: 0 4px 16px rgba(var(--ion-color-primary-rgb), 0.15);
}

.time-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.time-icon {
  font-size: 1.4rem;
  color: var(--ion-color-medium);
}

/* Form Prenotazione */
.booking-form {
  margin-top: 1.2rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--ion-color-medium-shade);
}

.input-item {
  --background: transparent;
  --border-radius: 8px;
  margin-bottom: 1rem;
}

.custom-textarea {
  --background: var(--ion-color-light);
  border-radius: 8px;
  --padding-start: 0.8rem;
  --padding-end: 0.8rem;
}

.booking-button {
  --border-radius: 8px;
  --box-shadow: none;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 300px;
  opacity: 0.6;
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  color: var(--ion-color-medium);
}

.empty-text {
  font-size: 1.1rem;
  color: var(--ion-color-medium);
  max-width: 200px;
}

/* Animazioni */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Loading Personalizzato */
.custom-loading {
  --spinner-color: var(--ion-color-primary);
  --background: rgba(255, 255, 255, 0.9);
  --backdrop-opacity: 0.8;
  --height: 120px;
  --width: 120px;
  border-radius: 16px;
}

.button-spinner {
  color: var(--ion-color-light);
}

/* Stato Disabilitato */
.disabled-item {
  opacity: 0.5;
  pointer-events: none;
}
</style>