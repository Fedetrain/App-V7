import { createStore } from 'vuex';

export default createStore({
  state: {
    sceltaUtente: '',
    IdDocumentNegozioSelezionato: '',
    dataNegozioSelezionato: '',
    OraNegozioSelezionato: '',
    uidUser: '',
    IdDocumentNegozioGestore: '',
    urlNegozioSelezionato: '',
    servizioSelezionato: '',
    durataServizioSelezionato: 0,
    nomeNegozio: '', // Nuova proprietà
    categoriaNegozio: '', // Nuova proprietà
    DatiregistrazioneGestore: {
      password: '',
      email: '',
      nome: '',
      cognome: '',
      cellulare: '',
      provincia: '',
      citta: '',
      via: '',
      numeroCivico: ''
    },
    prenotazioneSessionePrecedente: null, // Nuova proprietà
  },  
  mutations: {
    setSceltaUtente(state, nuovaScelta) {
      state.sceltaUtente = nuovaScelta;
    },
    setIdDocumentNegozioSelezionato(state, nuovoId) {
      state.IdDocumentNegozioSelezionato = nuovoId;
    },
    setDataNegozioSelezionato(state, nuovaData) {
      state.dataNegozioSelezionato = nuovaData;
    },
    setOraNegozioSelezionato(state, nuovaOra) {
      state.OraNegozioSelezionato = nuovaOra;
    },
    setUidUser(state, nuovoUid) {
      state.uidUser = nuovoUid;
    },
    setIdDocumentNegozioGestore(state, nuovoId) {
      state.IdDocumentNegozioGestore = nuovoId;
    },
    setUrlNegozioSelezionato(state, nuovoUrl) {
      state.urlNegozioSelezionato = nuovoUrl;
    },
    setServizioSelezionato(state, nuovoServizio) {
      state.servizioSelezionato = nuovoServizio;
    },
    setDurataServizioSelezionato(state, nuovaDurata) {
      state.durataServizioSelezionato = nuovaDurata;
    },
    setNomeNegozio(state, nuovoNome) { // Nuova mutazione
      state.nomeNegozio = nuovoNome;
    },
    setCategoriaNegozio(state, nuovaCategoria) { // Nuova mutazione
      state.categoriaNegozio = nuovaCategoria;
    },
    setDatiregistrazioneGestore(state, nuoviDati) {
      state.DatiregistrazioneGestore = {
        ...state.DatiregistrazioneGestore,
        ...nuoviDati
      };
    },
    setPrenotazioneSessionePrecedente(state, nuovaPrenotazione) { // Nuova mutation
      state.prenotazioneSessionePrecedente = nuovaPrenotazione;
    },
  },
  
  actions: {
    setSceltaUtente({ commit }, nuovaScelta) {
      commit('setSceltaUtente', nuovaScelta);
    },
    setIdDocumentNegozioSelezionato({ commit }, nuovoId) {
      commit('setIdDocumentNegozioSelezionato', nuovoId);
    },
    setDataNegozioSelezionato({ commit }, nuovaData) {
      commit('setDataNegozioSelezionato', nuovaData);
    },
    setOraNegozioSelezionato({ commit }, nuovaOra) {
      commit('setOraNegozioSelezionato', nuovaOra);
    },
    setUidUser({ commit }, nuovoUid) {
      commit('setUidUser', nuovoUid);
    },
    setIdDocumentNegozioGestore({ commit }, nuovoId) {
      commit('setIdDocumentNegozioGestore', nuovoId);
    },
    setUrlNegozioSelezionato({ commit }, nuovoUrl) {
      commit('setUrlNegozioSelezionato', nuovoUrl);
    },
    setServizioSelezionato({ commit }, nuovoServizio) {
      commit('setServizioSelezionato', nuovoServizio);
    },
    setDurataServizioSelezionato({ commit }, nuovaDurata) {
      commit('setDurataServizioSelezionato', nuovaDurata);
    },
    setNomeNegozio({ commit }, nuovoNome) { // Nuova action
      commit('setNomeNegozio', nuovoNome);
    },
    setCategoriaNegozio({ commit }, nuovaCategoria) { // Nuova action
      commit('setCategoriaNegozio', nuovaCategoria);
    },
    setDatiregistrazioneGestore({ commit }, nuoviDati) {
      commit('setDatiregistrazioneGestore', nuoviDati);
    },
    setPrenotazioneSessionePrecedente({ commit }, nuovaPrenotazione) { // Nuova action
      commit('setPrenotazioneSessionePrecedente', nuovaPrenotazione);
    },
  },
  
  getters: {
    getSceltaUtente(state) {
      return state.sceltaUtente;
    },
    getIdDocumentNegozioSelezionato(state) {
      return state.IdDocumentNegozioSelezionato;
    },
    getDataNegozioSelezionato(state) {
      return state.dataNegozioSelezionato;
    },
    getOraNegozioSelezionato(state) {
      return state.OraNegozioSelezionato;
    },
    getUidUser(state) {
      return state.uidUser;
    },
    getIdDocumentNegozioGestore(state) {
      return state.IdDocumentNegozioGestore;
    },
    getUrlNegozioSelezionato(state) {
      return state.urlNegozioSelezionato;
    },
    getServizioSelezionato(state) {
      return state.servizioSelezionato;
    },
    getDurataServizioSelezionato(state) {
      return state.durataServizioSelezionato;
    },
    getNomeNegozio(state) { // Nuovo getter
      return state.nomeNegozio;
    },
    getCategoriaNegozio(state) { // Nuovo getter
      return state.categoriaNegozio;
    },
    getDatiregistrazioneGestore(state) {
      return state.DatiregistrazioneGestore;
    },
    getPrenotazioneSessionePrecedente(state) { // Nuovo getter
      return state.prenotazioneSessionePrecedente;
    },
  },
});
