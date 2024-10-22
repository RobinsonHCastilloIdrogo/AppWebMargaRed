import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  orderBy,
  collectionData,
  Timestamp,
} from '@angular/fire/firestore';
import { Project } from '../../models/projects.model';
import { map, catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ProjectModalTableComponent } from './project-modal-table/project-modal-table.component';
import { FormsModule } from '@angular/forms';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { ProjectModalComponent } from './project-modal/project-modal.component';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    CommonModule,
    ProjectModalTableComponent,
    FormsModule,
    SharedDashboardComponent,
    ProjectModalComponent,
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
})
export class ProjectComponent implements OnInit {
  projects: Project[] = [];
  isModalOpen: boolean = false;
  isProjectModalOpen: boolean = false;
  newProjectName: string = ''; // Propiedad para el nombre del nuevo proyecto

  constructor(private firestore: Firestore, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    const projectsCollection = collection(this.firestore, 'projects');
    const projectsQuery = query(
      projectsCollection,
      orderBy('createdAt', 'asc')
    );

    collectionData(projectsQuery, { idField: 'id' })
      .pipe(
        map((projects: Project[]) =>
          projects.map((project) => ({
            ...project,
            createdAt: this.convertTimestampToDate(project.createdAt),
          }))
        ),
        catchError((error) => {
          console.error('Error al cargar los proyectos:', error);
          return [];
        })
      )
      .subscribe((projects: Project[]) => {
        this.projects = projects;
        this.cdr.detectChanges();
      });
  }

  convertTimestampToDate(timestamp: any): Date {
    return timestamp instanceof Timestamp
      ? timestamp.toDate()
      : new Date(timestamp);
  }

  toggleTableModal(): void {
    this.isModalOpen = !this.isModalOpen;
  }

  toggleProjectModal(): void {
    this.isProjectModalOpen = !this.isProjectModalOpen;
  }
  handleProjectAdded(): void {
    this.loadProjects(); // Actualiza la lista de proyectos
    this.toggleProjectModal(); // Cierra el modal
  }

  addNewProject(): void {
    const projectsCollection = collection(this.firestore, 'projects');
    addDoc(projectsCollection, {
      name: this.newProjectName,
      createdAt: new Date(),
    })
      .then(() => {
        console.log('Proyecto agregado correctamente');
        this.newProjectName = ''; // Limpiar el input
        this.loadProjects(); // Actualizar la lista de proyectos
        this.toggleProjectModal(); // Cerrar el modal
      })
      .catch((error) => {
        console.error('Error al agregar el proyecto:', error);
      });
  }
}
