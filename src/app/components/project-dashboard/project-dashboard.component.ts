import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  templateUrl: './project-dashboard.component.html',
  styleUrls: ['./project-dashboard.component.css'],
  imports: [RouterModule, CommonModule], // ¡Importante para las rutas y directivas!
})
export class ProjectDashboardComponent implements OnInit {
  project: any = null; // Almacena los datos del proyecto seleccionado
  projectId: string | null = null; // Almacena el ID del proyecto

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore
  ) {}

  async ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id'); // Obtener el ID del proyecto
    if (this.projectId) {
      await this.loadProject(this.projectId); // Cargar los datos del proyecto
    }
  }

  // Carga los datos del proyecto desde Firestore
  async loadProject(id: string) {
    try {
      const projectDoc = doc(this.firestore, `projects/${id}`);
      const projectSnapshot = await getDoc(projectDoc);

      if (projectSnapshot.exists()) {
        this.project = { id, ...projectSnapshot.data() };
        console.log('Proyecto cargado:', this.project);
      } else {
        console.error('El proyecto no existe');
        this.router.navigate(['/projects']); // Redirigir si no se encuentra el proyecto
      }
    } catch (error) {
      console.error('Error al cargar el proyecto:', error);
      this.router.navigate(['/projects']); // Redirigir en caso de error
    }
  }

  // Navega a una vista específica del proyecto
  navigateTo(subroute: string) {
    if (this.projectId) {
      this.router.navigate([`/projects/${this.projectId}/${subroute}`]);
    }
  }

  // Regresa al dashboard principal
  returnToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
