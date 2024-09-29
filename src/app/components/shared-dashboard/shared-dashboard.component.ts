import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
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
    // Aquí puedes redirigir al login, si es necesario
  }
}
