    <!-- CittaPerProvincia.vue -->
    <template>
        <div>
        <ion-spinner v-if="loading"></ion-spinner>
    
        <!-- Seleziona la provincia -->
        <select v-model="selectedProvince" @change="getCities">
            <option value="" disabled>Seleziona una provincia</option>
            <option v-for="province in uniqueProvinces" :key="province" :value="province">
            {{ province }}
            </option>
        </select>
    
        <!-- Visualizza le città della provincia selezionata -->
        <div v-if="selectedProvince">
            <h3>Città di {{ selectedProvince }}</h3>
            <ul>
            <li v-for="city in cities" :key="city">{{ city }}</li>
            </ul>
        </div>
        </div>
    </template>
    
    <script>
    export default {
        data() {
        return {
            comuniList: [], // Il tuo elenco completo di comuni
            uniqueProvinces: [], // Province uniche
            selectedProvince: '',
            cities: [],
            loading: true
        };
        },
        created() {
        // Simula il caricamento dell'elenco dei comuni (puoi sostituire con il caricamento reale)
        setTimeout(() => {
            this.comuniList = require('/src/comuni.json'); // Carica il tuo file JSON
            this.uniqueProvinces = this.getUniqueProvinces();
            this.loading = false;
        }, 1000);
        },
        methods: {
        getUniqueProvinces() {
            // Estrai province uniche dall'elenco completo di comuni
            const provinceSet = new Set();
            this.comuniList.forEach(comune => {
            provinceSet.add(comune.provincia.nome);
            });
            return Array.from(provinceSet);
        },
        getCities() {
            // Filtra le città in base alla provincia selezionata
            this.cities = this.comuniList
            .filter(comune => comune.provincia.nome === this.selectedProvince)
            .map(comune => comune.nome);
        }
        }
    };
    </script>
    
    <style scoped>
    /* Stili specifici per il tuo componente CittaPerProvincia */
    </style>
    