import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Importa FormsModule

@Component({
  selector: 'app-login',
  standalone: true, // Asegúrate de que el componente es standalone
  imports: [FormsModule], // Añade FormsModule aquí
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = ''; // Añadir la propiedad errorMessage

  constructor(private router: Router) {}

  handleLogin(event: Event) {
    event.preventDefault();
    if (this.username === 'admin' && this.password === 'margared') {
      this.router.navigate(['/dashboard']); // Redirige al dashboard
    } else {
      this.errorMessage = 'Usuario o contraseña incorrectos'; // Mostrar el mensaje de error
    }
  }
}
