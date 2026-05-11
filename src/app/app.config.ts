import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// Firebase Imports
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

// Local Imports
import { routes } from './app.routes';
import { environment } from '../environments/environment.development';
import { firebaseTokenInterceptor } from './core/interceptors/firebase-token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([firebaseTokenInterceptor])),


    // 2. Initialize Firebase
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    // 3. Enable services you need
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ]
};