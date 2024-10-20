import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Firestore,
  collectionData,
  collection,
  doc,
  deleteDoc,
  query,
  orderBy,
  DocumentData,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Project } from '../../models/projects.model';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { ProjectModalComponent } from './project-modal/project-modal.component';

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
export class ProjectComponent implements OnInit {
  projects$: Observable<Project[]> = of([]); // Inicializa como Observable vacío para evitar errores
  isModalOpen: boolean = false;

  constructor(private firestore: Firestore, private router: Router) {}

  ngOnInit(): void {
    this.loadProjects(); // Cargar proyectos al iniciar
  }

  // Método para cargar los proyectos desde Firestore ordenados por fecha
  loadProjects(): void {
    const projectsCollection = collection(this.firestore, 'projects');
    const projectsQuery = query(
      projectsCollection,
      orderBy('createdAt', 'asc') // Ordenar por fecha de creación ascendente
    );

    // Asignar el Observable con manejo de errores
    this.projects$ = collectionData(projectsQuery, { idField: 'id' }).pipe(
      catchError((error) => {
        console.error('Error al cargar los proyectos:', error);
        return of([]); // En caso de error, devolver un Observable vacío
      })
    );
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  handleProjectAdded(): void {
    console.log('Se ha agregado un nuevo proyecto.');
    this.loadProjects(); // Recargar proyectos después de agregar uno
  }

  goToProjectDetails(projectId: string): void {
    this.router.navigate(['/project', projectId]);
  }

  editProject(projectId: string, event: Event): void {
    event.stopPropagation(); // Evitar activar el clic en la tarjeta
    this.router.navigate([`/edit-project/${projectId}`]);
  }

  async deleteProject(projectId: string, event: Event): Promise<void> {
    event.stopPropagation(); // Evitar activar el clic en la tarjeta
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      try {
        const projectDoc = doc(this.firestore, `projects/${projectId}`);
        await deleteDoc(projectDoc);
        console.log(`Proyecto ${projectId} eliminado.`);
        this.loadProjects(); // Recargar proyectos después de eliminar uno
      } catch (error) {
        console.error('Error al eliminar el proyecto:', error);
      }
    }
  }
}
