import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios';
import 'ant-design-vue/dist/reset.css';
import Antd from 'ant-design-vue';

axios.defaults.baseURL = '/';
createApp(App).use(Antd).mount('#app')
