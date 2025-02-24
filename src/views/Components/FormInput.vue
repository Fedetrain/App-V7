<template>
  <div>
    <ion-item class="form-input">
      <ion-input
        class="ion-input"
        :class="{ 'capitalize-text': autocapitalize }" 
        :label="label"
        :type="inputType"
        label-placement="floating"
        :placeholder="placeholder"
        @ionInput="inputChanged"
        :value="value"
        :readonly="readonly"
      ></ion-input>
    </ion-item>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { IonInput, IonItem } from '@ionic/vue';

// Aggiungi la nuova prop `autocapitalize`
const props = defineProps({
  inputType: String,
  label: String,
  placeholder: String,
  value: String,
  readonly: Boolean,
  autocapitalize: { // Nuova prop
    type: Boolean,
    default: false // Valore predefinito
  }
});

const emits = defineEmits(['update']);

const inputChanged = (event) => {
  emits('update', event.target.value);
};
</script>

<style scoped>
.form-input {
  border: 3px solid var(--ion-color-secondary);
  border-radius: 6px;
  margin: 5px;
}

.ion-input {
  /* Rimuovi text-transform da qui */
}

.capitalize-text { 
  text-transform: capitalize;
}
</style>