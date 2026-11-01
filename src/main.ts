import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "@fontsource/roboto/latin-400.css";
import "@fontsource/roboto/latin-500.css";
import "@fontsource/roboto/latin-600.css";
import "@fontsource/roboto/latin-700.css";
import "./style.css";

createApp(App).use(router).mount("#app");
