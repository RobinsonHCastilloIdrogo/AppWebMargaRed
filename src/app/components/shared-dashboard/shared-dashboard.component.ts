import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
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
  projects: { id: string; name: string }[] = []; // Lista de proyectos cargada desde Firebase
  projectsLoaded: boolean = false; // Indica si los proyectos ya fueron cargados

  constructor(private router: Router, private firestore: Firestore) {}

  ngOnInit(): void {
    // Inicializamos la carga de proyectos en caso de que ya se necesite disponible
    this.loadProjects();
  }

  // Carga los proyectos desde Firebase Firestore
  async loadProjects(): Promise<void> {
    if (this.projectsLoaded) return; // Evitar múltiples recargas

    try {
      const projectsCollection = collection(this.firestore, 'projects');
      const snapshot = await getDocs(projectsCollection);

      this.projects = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data()['name'] ?? 'Sin Nombre',
      }));

      this.projectsLoaded = true; // Marcar los proyectos como cargados
      console.log('Proyectos cargados:', this.projects); // Depuración
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  }

  // Alterna la apertura del dropdown
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    console.log('Dropdown abierto:', this.isDropdownOpen); // Depuración
  }

  // Navega al dashboard del proyecto seleccionado
  selectProject(project: { id: string; name: string }): void {
    this.isDropdownOpen = false;
    console.log(`Navegando al proyecto: ${project.name}`); // Depuración
    this.router.navigate([`/projects/${project.id}`]); // Redirige usando el ID del proyecto
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
