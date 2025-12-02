import { createI18n } from 'vue-i18n'
import zhCn from './locales/zh-cn'
import en from './locales/en'

const i18n = createI18n({
    legacy: false, // Use Composition API
    locale: localStorage.getItem('locale') || 'zh-cn',
    fallbackLocale: 'en',
    messages: {
        'zh-cn': zhCn,
        en
    }
})

export default i18n
