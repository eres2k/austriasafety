import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/inspections',
    name: 'inspections',
    component: () => import('@/views/Inspections.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/inspections/create',
    name: 'create-inspection',
    component: () => import('@/views/CreateInspection.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/inspections/:id',
    name: 'inspection-detail',
    component: () => import('@/views/InspectionDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
  path: '/inspections/:id/execute',
  name: 'inspection-execute',
  component: () => import('@/views/InspectionExecution.vue'),
  meta: { requiresAuth: true }
},
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/views/Reports.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }
  
  if (to.meta.requiresRole) {
    const requiredRoles = to.meta.requiresRole as string[]
    if (!requiredRoles.includes(authStore.user?.role || '')) {
      return next({ name: 'dashboard' })
    }
  }
  
  next()
})

export default router
