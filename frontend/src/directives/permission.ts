import type { Directive } from 'vue';
import { useAuthStore } from '../stores/auth';

export const permission: Directive = {
    mounted(el, binding) {
        const { value } = binding;
        const authStore = useAuthStore();
        const user = authStore.user;

        if (user && user.role === 'ADMIN') {
            return;
        }

        if (value && value instanceof Array && value.length > 0) {
            const requiredPermissions = value;
            const hasPermission = user?.permissions?.some((permission: string) => {
                return requiredPermissions.includes(permission);
            });

            if (!hasPermission) {
                el.parentNode && el.parentNode.removeChild(el);
            }
        } else {
            throw new Error(`need roles! Like v-permission="['project:view','user:edit']"`);
        }
    },
};
