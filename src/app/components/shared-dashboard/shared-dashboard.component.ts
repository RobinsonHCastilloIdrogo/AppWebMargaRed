import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shared-dashboard.component.html',
  styleUrls: ['./shared-dashboard.component.css'],
})
export class SharedDashboardComponent {
  showLogoutModal: boolean = false; // Controla la visibilidad del modal de cierre de sesión
  activeSections: Set<string> = new Set(); // Secciones activas

  constructor(private router: Router) {}

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
    // Redirige al login
    this.router.navigate(['/login']);
  }

  // Función para alternar la visibilidad de una sección
  toggleSection(section: string) {
    if (this.activeSections.has(section)) {
      this.activeSections.delete(section); // Si ya está activa, se cierra
    } else {
      this.activeSections.add(section); // Si no está activa, se abre
    }
  }

  // Verifica si una sección está activa
  isActive(section: string): boolean {
    return this.activeSections.has(section);
  }
}
