import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import Kanban from './views/Kanban.vue'
import KanbanTryout from './views/KanbanTryout.vue'
import List from './views/List.vue'
import Admin from './views/Admin.vue'
import Arriving from './views/Arriving.vue'
import 'uno.css'


const routes = [
  { path: '/', name: 'dashboard', component: Dashboard, meta: { title: 'Dashboard' } },
  { path: '/kanban', name: 'kanban', component: Kanban, meta: { title: 'Kanban' } },
  { path: '/kanban-tryout', name: 'kanban-tryout', component: KanbanTryout, meta: { title: 'Tryout' } },
  { path: '/list', name: 'list', component: List, meta: { title: 'List' } },
  { path: '/admin', name: 'admin', component: Admin, meta: { title: 'Admin' } },
  { path: '/arriving', name: 'arriving', component: Arriving, meta: { title: 'Arriving' } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  if (sessionStorage.getItem('role') === 'unit') {
    if (to.path !== '/arriving') {
      return { path: '/arriving', query: { mode: 'unit' } }
    }
  } else {
    sessionStorage.removeItem('role')
  }
})

createApp(App).use(router).mount('#app')
