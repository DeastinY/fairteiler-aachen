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
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
