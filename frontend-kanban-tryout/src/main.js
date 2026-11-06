import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import KanbanTryout from './views/KanbanTryout.vue'
import Admin from './views/Admin.vue'
import HQ from './views/HQ.vue'
import 'uno.css'
import './style.css'


const routes = [
  { path: '/', name: 'home', component: KanbanTryout, meta: { title: 'Kanban Tryout' } },
  { path: '/kanban-tryout', name: 'kanban-tryout', component: KanbanTryout, meta: { title: 'Kanban Tryout' } },
  { path: '/admin', name: 'admin', component: Admin, meta: { title: 'Admin' } },
  { path: '/hq', name: 'hq', component: HQ, meta: { title: 'HQ' } },
]

const router = createRouter({ history: createWebHistory(), routes })

createApp(App).use(router).mount('#app')
