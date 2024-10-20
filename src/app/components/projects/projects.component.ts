import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Importa Router
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Project } from '../../models/projects.model';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { ProjectModalComponent } from '../projects/project-modal/project-modal.component';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedDashboardComponent,
    ProjectModalComponent,
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
})
export class ProjectComponent {
  projects$: Observable<Project[]>; // Observable para los proyectos
  selectedProjectId: string | null = null;
  isModalOpen: boolean = false;

  constructor(private firestore: Firestore, private router: Router) {
    const projectsCollection = collection(this.firestore, 'projects'); // Referencia a la colección 'projects'
    this.projects$ = collectionData(projectsCollection, {
      idField: 'id',
    }) as Observable<Project[]>; // Obtener los datos de Firestore

    // Mostrar los datos en la consola del navegador para verificar
    this.projects$.subscribe((data) => {
      console.log('Proyectos obtenidos:', data); // Mostrar los datos obtenidos
    });
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  handleProjectAdded() {
    // Aquí puedes realizar cualquier acción adicional después de agregar un proyecto
    console.log('Se ha agregado un nuevo proyecto.');
  }

  goToProjectDetails(projectId: string) {
    this.router.navigate(['/project', projectId]); // Asegúrate de que la ruta esté configurada correctamente
  }
}
