<template>
      <ion-buttons slot="start">
        <ion-back-button></ion-back-button>
      </ion-buttons>
</template>

<script lang="ts">
import { IonBackButton, IonButtons, IonHeader, IonToolbar } from '@ionic/vue';
import { defineComponent } from 'vue';

export default defineComponent({
  components: { IonBackButton, IonButtons, IonHeader, IonToolbar }
});
</script>

<style scoped>

/* Stile per il bottone di back */
ion-back-button {
  --background: transparent; /* Colore di sfondo */
  font-weight: bold; /* Grassetto */
  font-size: 1.2em; /* Dimensione del font */
  margin-top: 0px;


}

</style>
