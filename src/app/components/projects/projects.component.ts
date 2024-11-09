import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  orderBy,
  collectionData,
  getDocs,
  doc,
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
  isDetailsModalOpen: boolean = false; // Modal de detalles
  selectedProject: Project | null = null; // Proyecto seleccionado
  teamMembers: any[] = []; // Miembros del equipo
  newProjectName: string = ''; // Nombre del nuevo proyecto

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

  // Función para abrir el modal de detalles del proyecto
  async viewProjectDetails(project: Project): Promise<void> {
    this.selectedProject = project;
    this.teamMembers = await this.getTeamMembers(project.id); // Obtener miembros del equipo
    this.isDetailsModalOpen = true;
  }

  // Función para obtener los miembros del equipo desde la subcolección 'team'
  async getTeamMembers(projectId: string): Promise<any[]> {
    try {
      const teamCollection = collection(this.firestore, `projects/${projectId}/team`);
      const teamSnapshot = await getDocs(teamCollection);
      return teamSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          horaInicio: data['horaInicio'],
          horaFin: data['horaFin'],
          maquinaId: data['maquina']?.['id'], // Acceso con corchetes
          maquinaNombre: data['maquina']?.['nombre'], // Acceso con corchetes
          empleadoNombre: data['nombre'], // Acceso con corchetes
          rol: data['rol'], // Acceso con corchetes
        };
      });
    } catch (error) {
      console.error('Error al cargar los miembros del equipo:', error);
      return [];
    }
  }
  

  handleProjectAdded(): void {
    this.loadProjects(); // Actualizar la lista de proyectos
    this.toggleProjectModal(); // Cerrar el modal de nuevo proyecto
  }

  closeDetailsModal(): void {
    this.isDetailsModalOpen = false;
    this.selectedProject = null; // Limpiar el proyecto seleccionado
    this.teamMembers = []; // Limpiar los miembros del equipo
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
