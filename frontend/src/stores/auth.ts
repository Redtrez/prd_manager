import { defineStore } from 'pinia'
import api from '../utils/api'
import router from '../router'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        token: localStorage.getItem('token') || null,
    }),
    actions: {
        async login(credentials: any) {
            try {
                const response = await api.post('/auth/login', credentials)
                this.token = response.data.access_token
                this.user = response.data.user
                if (this.token) {
                    localStorage.setItem('token', this.token)
                }
                localStorage.setItem('user', JSON.stringify(this.user))
                router.push('/projects')
            } catch (error) {
                console.error('Login failed', error)
                throw error
            }
        },
        logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            router.push('/login')
        }
    }
})
