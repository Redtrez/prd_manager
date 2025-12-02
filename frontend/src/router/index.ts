import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../layout/Layout.vue'

const routes: Array<RouteRecordRaw> = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { title: 'Login' }
    },
    {
        path: '/preview',
        name: 'Preview',
        component: () => import('../views/Preview.vue'),
        meta: { title: 'Preview' }
    },
    {
        path: '/',
        component: Layout,
        redirect: '/projects',
        children: [
            {
                path: '',
                component: () => import('../layout/ProjectTreeLayout.vue'),
                children: [
                    {
                        path: 'projects',
                        name: 'Projects',
                        component: () => import('../views/Projects.vue'),
                        meta: { title: 'Projects' }
                    },
                    {
                        path: 'projects/:id/versions',
                        name: 'ProductVersions',
                        component: () => import('../views/ProductVersions.vue'),
                        meta: { title: 'Product Versions' }
                    },
                    {
                        path: 'product-versions/:id/designs',
                        name: 'Designs',
                        component: () => import('../views/Designs.vue'),
                        meta: { title: 'Designs' }
                    },
                    {
                        path: 'designs/:id/versions',
                        name: 'DesignVersions',
                        component: () => import('../views/Versions.vue'),
                        meta: { title: 'Design Versions' }
                    }
                ]
            },
            {
                path: 'announcements',
                name: 'Announcements',
                component: () => import('../views/Announcements.vue'),
                meta: { title: 'Announcements' }
            },
            {
                path: 'users',
                name: 'Users',
                component: () => import('../views/UserManagement.vue'),
                meta: { title: 'User Management' }
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, _from, next) => {
    // Update document title
    if (to.meta.title) {
        document.title = `${to.meta.title} - PRD Manager`
    } else {
        document.title = 'PRD Manager'
    }

    const token = localStorage.getItem('token')
    if (to.name !== 'Login' && to.name !== 'Preview' && !token) {
        next({ name: 'Login' })
    } else {
        next()
    }
})

export default router
