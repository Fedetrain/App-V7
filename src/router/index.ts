import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Login from '@/views/Login/Login.vue'
import SceltaUtilizzoRegistrazione from '../views/Login/Registrazione/SceltaUtilizzoRegistrazione.vue';
import RegistrazioneClienteGestore from '../views/Login/Registrazione/RegistrazioneClienteGestore.vue';
import RegistrazioneNegozio from '../views/Login/Registrazione/RegistrazioneNegozio.vue';
import SceltaOrariLavorativi from '../views/Gestore/HomeGestore/SceltaOrariLavorativi.vue';
import InformazioniNegozio from '../views/Cliente/Home/InformazioniNegozio.vue';
import VisualizzaOrari from '../views/Cliente/Home/VisualizzaOrari.vue';
import VisualizzaProfilo from '../views/Cliente/Profilo/VisualizzaProfilo.vue';


import TabsPage from '../views/Cliente/tabs/TabsPage.vue';
import TabsPageGestore from '../views/Gestore/tabs/TabsPageGestore.vue';
import InserisciServizi from '../views/Gestore/HomeGestore/InserisciServizi.vue';
import InserisciFerie from '../views/Gestore/HomeGestore/InserisciFerie.vue';

import Admin from '../views/admin/Admin.vue';
import InformazioniNegozio_Alimentari from '@/views/Cliente/Home/InformazioniNegozio_Alimentari.vue';
import VisualizzaOrariAlimentari from '@/views/Cliente/Home/VisualizzaOrariAlimentari.vue';




const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  

  {
    path: '/login',
    name: 'Login',
    component: Login
  },

  {
    path: '/registrazione/sceltaUtilizzoRegistrazione',
    name: 'SceltaUtilizzoRegistrazione',
    component: SceltaUtilizzoRegistrazione
  },

  {
    path: '/registrazione/registrazioneClienteGestore',
    name: 'RegistrazioneClienteGestore',
    component: RegistrazioneClienteGestore
  },
  {
    path: '/registrazione/registrazioneClienteGestore/registrazioneNegozio',
    name: 'RegistrazioneNegozio',
    component: RegistrazioneNegozio
  },
  {
    path: '/gestore/tabs/tab1gestore/sceltaOrariLavorativi',
    name: 'SceltaOrariLavorativi',
    component: SceltaOrariLavorativi
  },

  {
    path: '/admin',
    name: 'Admin',
    component: Admin
  },
  {
    path: '/cliente/tabs/tab1/informazioniNegozio',
    name: 'InformazioniNegozio',
    component: InformazioniNegozio
  },
  {
    path: '/cliente/tabs/tab1/informazioniNegozio_Alimentari',
    name: 'InformazioniNegozio_Alimentari',
    component: InformazioniNegozio_Alimentari
  },
  {
    path: '/cliente/tabs/tab3/visualizzaProfilo',
    name: 'VisualizzaProfilo',
    component: VisualizzaProfilo
  },
  {
    path: '/cliente/tabs/tab1/informazioniNegozio/visualizzaOrari',
    name: 'VisualizzaOrari',
    component: VisualizzaOrari
  },
  {
  path: '/cliente/tabs/tab1/informazioniNegozio/visualizzaOrari_Alimentari',
  name: 'VisualizzaOrariAlimentari',
  component: VisualizzaOrariAlimentari
  },
{
  path: '/cliente/tabs',
  component: TabsPage,
  children: [
    {
      path: '',
      redirect: '/cliente/tabs/tab1'
    },
    {
      path: 'tab1',
      component: () => import('@/views/Cliente/tabs/HomeCliente.vue')
    },
    {
      path: 'tab2',
      component: () => import('@/views/Cliente/tabs/PrenotazioniCliente.vue')
    },
    {
      path: 'tab3',
      component: () => import('@/views/Cliente/tabs/ProfiloCliente.vue')
    }
  ]
},
{
  path: '/gestore/tabs',
  component: TabsPageGestore,
  children: [
    {
      path: '',
      redirect: '/gestore/tabs/tab1gestore'
    },
    {
      path: 'tab1gestore',
      component: () => import('@/views/Gestore/tabs/HomeGestore2.vue')
    },
    {
      path: 'tab2gestore_estetica',
      component: () => import('@/views/Gestore/tabs/PrenotazioniGestoreEstetica.vue')
    },
    {
      path: 'tab3gestore',
      component: () => import('@/views/Gestore/tabs/ProfiloGestore.vue')
    },
    {
      path: 'tab2gestore_alimentari',
      component: () => import('@/views/Gestore/tabs/PrenotazioniGestoreAlimentari.vue') // Tab per Gestore Alimentari
    },
  ]
},
{
  path: '/gestore/tabs/tab1gestore/inserisciServizi',
  name: 'InserisciServizi',
  component: InserisciServizi
},
{
  path: '/gestore/tabs/tab1gestore/inserisciferie',
  name: 'InserisciFerie',
  component: InserisciFerie
},



]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
