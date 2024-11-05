import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms'; // Importa FormsModule aquí

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule], // Incluye FormsModule aquí para habilitar [(ngModel)]
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  handleLogin(event: Event) {
    event.preventDefault();

    this.authService
      .login(this.username, this.password)
      .then(() => {
        this.router.navigate(['/dashboard']); // Redirige al dashboard si el inicio de sesión es exitoso
      })
      .catch((error) => {
        this.errorMessage = 'Usuario o contraseña incorrectos';
        console.error(error);
      });
  }
}
