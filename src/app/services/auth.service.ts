import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  User,
  onAuthStateChanged,
} from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<User | null>;

  constructor(private auth: Auth) {
    // Observa el estado de autenticación
    this.user$ = new Observable((subscriber) => {
      onAuthStateChanged(auth, subscriber);
    });
  }

  // Método para iniciar sesión
  login(email: string, password: string): Promise<any> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // Método para cerrar sesión
  logout(): Promise<void> {
    return signOut(this.auth);
  }

  // Método para obtener el usuario autenticado
  getUser(): Observable<User | null> {
    return this.user$;
  }
}
