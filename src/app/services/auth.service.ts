import { Injectable } from '@angular/core';
import { Auth, onAuthStateChanged, signInWithEmailAndPassword, User } from '@angular/fire/auth';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor(private auth: Auth) {
    // Observa los cambios en el estado de autenticación
    onAuthStateChanged(this.auth, (user) => {
      this.isAuthenticatedSubject.next(!!user);
    });
  }

  // Método para iniciar sesión
  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password).then(() => {
      this.isAuthenticatedSubject.next(true); // Cambiar estado a autenticado
    });
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  // Método para cerrar sesión
  logout(): Promise<void> {
    return this.auth.signOut().then(() => {
      this.isAuthenticatedSubject.next(false); // Cambiar estado a no autenticado
    });
  }
}
