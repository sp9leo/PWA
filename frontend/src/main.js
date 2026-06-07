import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import Kanban from './views/Kanban.vue'
import List from './views/List.vue'
import 'uno.css'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard, meta: { title: 'Dashboard' } },
  { path: '/kanban', name: 'kanban', component: Kanban, meta: { title: 'Kanban' } },
  { path: '/list', name: 'list', component: List, meta: { title: 'List' } },
]

const router = createRouter({ history: createWebHistory(), routes })

createApp(App).use(router).mount('#app')
