import { firebaseInit } from "./app-firebaseauth.js";
import { routePage } from "./app-route.js";
import { registerSW } from "./app-sw-config.js";

firebaseInit();
registerSW();
routePage();
