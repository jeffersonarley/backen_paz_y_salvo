import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Dialog, Loading } from 'quasar'
import lang from 'quasar/lang/es'

import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())

app.use(Quasar, {
  lang,
  plugins: {
    Notify,
    Dialog,
    Loading
  }
})

app.use(router)

app.mount('#app')
