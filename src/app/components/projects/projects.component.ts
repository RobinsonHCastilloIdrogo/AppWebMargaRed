import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  getDocs,
  Timestamp,
  CollectionReference,
  Query,
  collectionData,
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  projects$ = this.projectsSubject.asObservable();
  isModalOpen: boolean = false;
  showEditTable: boolean = false;
  editingProjectId: string | null = null;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  // Cargar los proyectos desde Firestore
  loadProjects(): void {
    const projectsCollection = collection(
      this.firestore,
      'projects'
    ) as CollectionReference<Project>;

    const projectsQuery = query(
      projectsCollection,
      orderBy('createdAt', 'asc')
    ) as Query<Project>;

    collectionData(projectsQuery, { idField: 'id' }).pipe(
      map((projects: Project[]) =>
        projects.map((project) => ({
          ...project,
          createdAt: this.getValidDate(project.createdAt),
        }))
      ),
      catchError((error) => {
        console.error('Error al cargar los proyectos:', error);
        return of([]); // Observable vacío en caso de error
      })
    );
  }

  // Validar y convertir Timestamp a Date
  getValidDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    } else if (timestamp && !isNaN(Date.parse(timestamp))) {
      return new Date(timestamp);
    } else {
      console.warn('Fecha inválida encontrada:', timestamp);
      return new Date(); // Fecha actual como fallback
    }
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  handleProjectAdded(): void {
    console.log('Se ha agregado un nuevo proyecto.');
    this.loadProjects();
  }

  goToProjectDetails(projectId: string): void {
    this.router.navigate(['/project', projectId]);
  }

  toggleEditTable(): void {
    this.showEditTable = !this.showEditTable;
    if (this.showEditTable) {
      this.loadProjects();
    }
  }

  startEditProject(project: Project): void {
    this.editingProjectId = project.id;
  }

  isEditing(project: Project): boolean {
    return this.editingProjectId === project.id;
  }

  async saveProject(project: Project): Promise<void> {
    try {
      const projectDoc = doc(this.firestore, `projects/${project.id}`);
      await updateDoc(projectDoc, { name: project.name });
      console.log(`Proyecto ${project.name} actualizado.`);
      this.editingProjectId = null;
      this.loadProjects();
    } catch (error) {
      console.error('Error al actualizar el proyecto:', error);
    }
  }

  async deleteProject(projectId: string, event: Event): Promise<void> {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      try {
        const projectDoc = doc(this.firestore, `projects/${projectId}`);
        await deleteDoc(projectDoc);
        this.loadProjects();
      } catch (error) {
        console.error('Error al eliminar el proyecto:', error);
      }
    }
  }

  async deleteAllProjects(event: Event): Promise<void> {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar todos los proyectos?')) {
      try {
        const projectsCollection = collection(this.firestore, 'projects');
        const snapshot = await getDocs(projectsCollection);
        const batchDeletePromises = snapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );
        await Promise.all(batchDeletePromises);
        this.loadProjects();
      } catch (error) {
        console.error('Error al eliminar todos los proyectos:', error);
      }
    }
  }
}
