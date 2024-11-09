import {
  ApplicationConfig,
  NgModule,
  provideZoneChangeDetection,
} from '@angular/core'; // Asegúrate de que esta línea esté presente
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { provideFirebaseApp } from '@angular/fire/app';
import { initializeApp } from 'firebase/app';
import { provideRouter } from '@angular/router';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideHttpClient } from '@angular/common/http';
import { provideAuth, getAuth } from '@angular/fire/auth'; // Importación para Auth

export const appConfig: ApplicationConfig = {
  providers: [
    //provideHttpClient(), // usar back o http post get put. Etc API
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), // Inicializa Firebase
    provideFirestore(() => getFirestore()), // Provee Firestore
    provideAuth(() => getAuth()), // Provee Auth
  ],
};
