import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule],
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  get isFormValid(): boolean {
    // Verifica si ambos campos están llenos
    return this.username.trim() !== '' && this.password.trim() !== '';
  }

  handleLogin(event: Event) {
    event.preventDefault();

    this.authService
      .login(this.username, this.password)
      .then(() => {
        // Mostrar una confirmación con SweetAlert
        Swal.fire({
          icon: 'success',
          title: 'Inicio de sesión exitoso',
          text: 'Bienvenido a MargaRed',
          confirmButtonText: 'Continuar',
        }).then(() => {
          this.router.navigate(['/dashboard']); // Redirige al dashboard
        });
      })
      .catch((error) => {
        // Mostrar un error con SweetAlert
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Usuario o contraseña incorrectos',
          confirmButtonText: 'Intentar de nuevo',
        });
        console.error(error);
      });
  }
}
