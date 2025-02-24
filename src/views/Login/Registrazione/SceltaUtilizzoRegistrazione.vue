<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary" >
      <BackButton></BackButton>     
    </ion-toolbar>
    </ion-header>

    <ion-content class="content">

      <div class="button-container">
        <ion-button @click="() => impostaValore('Cliente')" shape="round"  class="round-button">
          Registrati come Cliente
        </ion-button>
        <ion-button @click="() => impostaValore('Gestore')" shape="round" class="round-button">
          Registrati come Gestore
        </ion-button>
      </div>

    </ion-content>
  </ion-page>
</template>

<style scoped>
  .button-container {
    margin-top: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .round-button {
    margin-bottom: 20px;
    font-weight: bold;

  }

</style>



<script setup>
import { ref ,onMounted} from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import {onIonViewWillEnter, onIonViewDidEnter, onIonViewWillLeave, onIonViewDidLeave,IonBackButton, IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonButton } from '@ionic/vue';
import BackButton from '/src/views/Components/BackButton.vue';


const router = useRouter();
const store = useStore();


const impostaValore =async (valore) => {
  store.dispatch('setSceltaUtente',valore);
  router.push('/registrazione/registrazioneClienteGestore'); // Naviga al secondo componente
};




</script>

