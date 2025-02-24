<!-- ChildComponent.vue -->

<template>
<div>
    <ion-item>
    <ion-label position="stacked">Provincia di Residenza</ion-label>
    <ion-select v-model="selectedProvincia" aria-label="provincia" placeholder="Seleziona Provincia" @ionChange="selezionaProvincia">
        <ion-select-option
        v-for="provincia in provincieList"
        :key="provincia"
        :value="provincia"
        >
        {{ provincia }}
        </ion-select-option>
    </ion-select>
    </ion-item>

    <ion-item>
    <ion-label position="stacked">Città di Residenza</ion-label>
    <ion-select v-model="selectedCitta" aria-label="citta" placeholder="Seleziona Città" @ionChange="selezionaCittà">
        <ion-select-option
        v-for="citta in nomiComuniFiltrati"
        :key="citta"
        :value="citta"
        >
        {{ citta }}
        </ion-select-option>
    </ion-select>
    </ion-item>
</div>
</template>

<script setup>
import { ref, defineProps, defineEmits, reactive } from 'vue';
import { IonSelectOption, IonSelect, IonItem, IonLabel } from '@ionic/vue';

import comuni from '/src/comuni.json';
import province from '/src/province.json';

const emit = defineEmits(['updateprovincia', 'updatecitta']);

const comuniList = comuni;
const provincieList = province.map(provincia => provincia.nome);
let comuniFiltrati = reactive([]);
let nomiComuniFiltrati = ref([]);

const selectedProvincia = ref('');
const selectedCitta = ref('');


const selezionaProvincia = () => {
comuniFiltrati = comuniList.filter(comune => comune.provincia.nome === selectedProvincia.value);
nomiComuniFiltrati.value = comuniFiltrati.map(oggetto => oggetto.nome);
emit('updateprovincia', selectedProvincia);

};

const selezionaCittà = () => {
    emit('updatecitta', selectedCitta);
};



</script>

<style scoped>
/* Stili specifici del componente, se necessario */
</style>
