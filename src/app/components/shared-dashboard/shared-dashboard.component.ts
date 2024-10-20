import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import {
  Firestore,
  collection,
  getDocs,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './shared-dashboard.component.html',
  styleUrls: ['./shared-dashboard.component.css'],
})
export class SharedDashboardComponent implements OnInit {
  showLogoutModal: boolean = false; // Controla la visibilidad del modal de cierre de sesión
  activeSections: Set<string> = new Set(); // Secciones activas
  isDropdownOpen: boolean = false; // Controla la apertura del dropdown de proyectos
  projects: { id: string; name: string; createdAt: Date }[] = []; // Lista de proyectos cargada desde Firebase
  projectsLoaded: boolean = false; // Indica si los proyectos ya fueron cargados

  constructor(private router: Router, private firestore: Firestore) {}

  ngOnInit(): void {
    // Cargar proyectos al inicializar
    this.loadProjects();
  }

  // Carga y ordena los proyectos desde Firebase Firestore por fecha de creación
  async loadProjects(): Promise<void> {
    if (this.projectsLoaded) return; // Evita recargas múltiples

    try {
      const projectsCollection = collection(this.firestore, 'projects');
      const projectsQuery = query(
        projectsCollection,
        orderBy('createdAt', 'asc')
      ); // Ordenar por fecha y hora

      const snapshot = await getDocs(projectsQuery);

      this.projects = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data()['name'] ?? 'Sin Nombre',
        createdAt: doc.data()['createdAt'].toDate() ?? new Date(), // Convertir timestamp a Date
      }));

      this.projectsLoaded = true; // Marcar como cargado
      console.log('Proyectos cargados:', this.projects);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  }

  // Alterna la apertura del dropdown
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    console.log('Dropdown abierto:', this.isDropdownOpen);
  }

  // Navega al dashboard del proyecto seleccionado
  selectProject(project: { id: string; name: string }): void {
    this.isDropdownOpen = false;
    console.log(`Navegando al proyecto: ${project.name}`);
    this.router.navigate([`/projects/${project.id}`]);
  }

  // Control del modal de logout
  openLogoutModal(): void {
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  logout(): void {
    this.showLogoutModal = false;
    this.router.navigate(['/login']);
  }

  // Alterna la visibilidad de una sección
  toggleSection(section: string): void {
    if (this.activeSections.has(section)) {
      this.activeSections.delete(section);
    } else {
      this.activeSections.add(section);
    }
  }

  // Verifica si una sección está activa
  isActive(section: string): boolean {
    return this.activeSections.has(section);
  }
}
