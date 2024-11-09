import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  getDocs,
} from '@angular/fire/firestore';
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
  tasks: any[] = []; // Almacena las tareas del proyecto
  details: any[] = []; // Almacena los detalles del proyecto
  team: any[] = []; // Almacena los miembros del equipo del proyecto

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore
  ) {}

  async ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id'); // Obtener el ID del proyecto
    console.log('ID del proyecto obtenido:', this.projectId); // Verificar si se está obteniendo el ID correctamente
    if (this.projectId) {
      try {
        await this.loadProject(this.projectId); // Cargar los datos del proyecto
        await this.loadSubcollections(this.projectId); // Cargar las subcolecciones del proyecto
      } catch (error) {
        console.error('Error al cargar los datos del proyecto:', error);
        this.router.navigate(['/projects']); // Redirigir si ocurre algún error durante la carga
      }
    } else {
      console.error('No se encontró un ID de proyecto en la ruta');
      this.router.navigate(['/projects']); // Redirigir si no se encuentra el ID del proyecto
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
        throw new Error('El proyecto no existe'); // Lanzar error para manejarlo en el bloque catch del ngOnInit
      }
    } catch (error) {
      console.error('Error al cargar el proyecto:', error);
      throw error; // Relanzar el error para que el ngOnInit lo maneje
    }
  }

  // Carga las subcolecciones del proyecto desde Firestore
  async loadSubcollections(projectId: string) {
    try {
      // Cargar tareas
      const tasksCollection = collection(
        this.firestore,
        `projects/${projectId}/tasks`
      );
      const tasksSnapshot = await getDocs(tasksCollection);
      this.tasks = tasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('Tareas cargadas:', this.tasks);

      // Cargar detalles
      const detailsCollection = collection(
        this.firestore,
        `projects/${projectId}/details`
      );
      const detailsSnapshot = await getDocs(detailsCollection);
      this.details = detailsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('Detalles cargados:', this.details);

      // Cargar equipo
      const teamCollection = collection(
        this.firestore,
        `projects/${projectId}/team`
      );
      const teamSnapshot = await getDocs(teamCollection);
      this.team = teamSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('Equipo cargado:', this.team);
    } catch (error) {
      console.error('Error al cargar las subcolecciones:', error);
    }
  }

  // Navega a una vista específica del proyecto
  navigateTo(subroute: string) {
    if (this.projectId) {
      this.router.navigate([`/projects/${this.projectId}/${subroute}`]);
    } else {
      console.error('No se puede navegar, el ID del proyecto es nulo');
    }
  }

  // Regresa al dashboard principal
  returnToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
