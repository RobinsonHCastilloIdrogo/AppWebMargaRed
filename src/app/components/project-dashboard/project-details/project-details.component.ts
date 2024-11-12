import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  Injector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, setDoc, docData } from '@angular/fire/firestore';
import { DashboardService } from '../../../services/dashboard.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-project-details',
  imports: [CommonModule, FormsModule],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css'],
  standalone: true,
})
export class ProjectDetailsComponent implements OnInit {
  @Input() project: any;
  @Output() statusChanged = new EventEmitter<void>();

  private firestore: Firestore;

  projectId: string | null = null;
  documentName: string = '2024-11';

  // BehaviorSubject para manejar los detalles del proyecto
  private projectDetailsSubject = new BehaviorSubject<any>(null);
  projectDetails$: Observable<any> = this.projectDetailsSubject.asObservable();

  isEditing: boolean = false;
  resourcePairs: { employee: string; machine: string }[] = [];

  // Variable para almacenar el estado actual del proyecto
  currentStatus: string = '';

  constructor(
    private injector: Injector,
    private route: ActivatedRoute,
    private dashboardService: DashboardService
  ) {
    this.firestore = this.injector.get(Firestore);
  }

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe((params) => {
      this.projectId = params.get('id');
      if (this.projectId) {
        this.loadProjectDetails();
      } else {
        console.error('No se encontró el ID del proyecto.');
      }
    });
  }

  loadProjectDetails(): void {
    if (!this.projectId) return;

    // Ruta corregida según la especificación
    const detailDocRef = doc(
      this.firestore,
      `projects/${this.projectId}/details/${this.projectId}`
    );

    docData(detailDocRef).subscribe(
      (projectData: any) => {
        if (projectData) {
          console.log('Detalles del proyecto encontrados:', projectData);
          this.projectDetailsSubject.next(projectData);
          this.currentStatus = projectData.status || 'En curso'; // Guardar el estado en la variable currentStatus
          this.generateResourcePairs(projectData);
        } else {
          console.error('No se encontraron detalles del proyecto.');
        }
      },
      (error: any) => {
        console.error('Error al cargar los detalles del proyecto:', error);
      }
    );
  }

  generateResourcePairs(projectData: any): void {
    const employeesArray = projectData['employees'] || [];
    const machinesArray = projectData['machines'] || [];
    const maxLength = Math.max(employeesArray.length, machinesArray.length);

    this.resourcePairs = [];
    for (let i = 0; i < maxLength; i++) {
      const employee = employeesArray[i] || 'No asignado';
      const machine = machinesArray[i] || 'No asignada';
      this.resourcePairs.push({ employee, machine });
    }
  }

  enableEditing(): void {
    this.isEditing = true;
  }

  async saveDetails(): Promise<void> {
    if (!this.projectId) {
      console.error('No se encontró el ID del proyecto.');
      return;
    }

    // Obtener los detalles actualizados
    const updatedDetails = this.projectDetailsSubject.getValue();
    updatedDetails.status = this.currentStatus; // Actualizar el estado en los detalles

    const detailDocRef = doc(
      this.firestore,
      `assignments/${this.documentName}/projects/${this.projectId}`
    );

    try {
      await setDoc(detailDocRef, updatedDetails, { merge: true });
      console.log('Detalles del proyecto guardados correctamente');
      alert('Detalles del proyecto actualizados exitosamente.');

      this.isEditing = false;

      // Notificar al dashboard que los proyectos han cambiado
      this.statusChanged.emit();
      this.dashboardService.loadProjectStatusCounts();
    } catch (error) {
      console.error('Error al guardar los detalles del proyecto:', error);
    }
  }
}
