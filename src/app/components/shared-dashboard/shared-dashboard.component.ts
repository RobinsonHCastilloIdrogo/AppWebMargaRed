import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router'; // Asegúrate de importar Router
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shared-dashboard.component.html',
  styleUrls: ['./shared-dashboard.component.css'],
})
export class SharedDashboardComponent {
  showLogoutModal: boolean = false;

  constructor(private router: Router) {} // Inyecta el Router

  // Función para abrir el modal de logout
  openLogoutModal() {
    this.showLogoutModal = true;
  }

  // Función para cerrar el modal de logout
  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  // Función de logout
  logout() {
    this.showLogoutModal = false;
    // Aquí redirige al login
    this.router.navigate(['/login']); // Cambia '/login' a la ruta de tu login
  }
}
