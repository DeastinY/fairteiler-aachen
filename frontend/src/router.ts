import { createRouter, createWebHistory } from 'vue-router'

export const routes = [
  { path: '/', name: 'karte', component: () => import('./views/KarteView.vue') },
  { path: '/liste', name: 'liste', component: () => import('./views/ListeView.vue') },
  {
    path: '/fairteiler/:id',
    name: 'detail',
    component: () => import('./views/DetailView.vue'),
  },
  { path: '/melden', name: 'melden', component: () => import('./views/MeldenView.vue') },
  {
    path: '/aktivitaet',
    name: 'aktivitaet',
    component: () => import('./views/AktivitaetView.vue'),
  },
  { path: '/mehr', name: 'mehr', component: () => import('./views/MehrView.vue') },
  {
    path: '/einstellungen',
    name: 'einstellungen',
    component: () => import('./views/EinstellungenView.vue'),
  },
  { path: '/regeln', name: 'regeln', component: () => import('./views/RegelnView.vue') },
  {
    path: '/impressum',
    name: 'impressum',
    component: () => import('./views/ImpressumView.vue'),
  },
  {
    path: '/datenschutz',
    name: 'datenschutz',
    component: () => import('./views/DatenschutzView.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
