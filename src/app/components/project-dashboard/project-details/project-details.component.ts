import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectDataService } from '../../../services/project-data.service';
import { DashboardService } from '../../../services/dashboard.service'; // Importa el servicio

@Component({
  selector: 'app-project-details',
  imports: [DatePipe, CommonModule, FormsModule],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css'],
  standalone: true,
})
export class ProjectDetailsComponent implements OnInit {
  @Input() project: any;
  @Output() statusChanged = new EventEmitter<void>(); // Emisor del evento

  projectId: string | null = null;
  detailId: string = '5QViexI3IOwLj9GiZZzK';

  projectDescription: string = '';
  startDate: string = '';
  endDate: string = '';
  status: string = '';
  employeesArray: string[] = [];
  machinesArray: string[] = [];
  resourcePairs: { employee: string; machine: string }[] = [];
  isEditing: boolean = false;

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute,
    private dashboardService: DashboardService // Inyecta el servicio aquí
  ) {}

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

  async loadProjectDetails(): Promise<void> {
    if (!this.projectId) return;

    try {
      const detailDocRef = doc(
        this.firestore,
        `projects/${this.projectId}/details/${this.detailId}`
      );
      const detailSnapshot = await getDoc(detailDocRef);

      if (detailSnapshot.exists()) {
        const projectData = detailSnapshot.data();
        this.projectDescription = projectData['description'] || '';
        this.startDate = projectData['startDate'] || '';
        this.endDate = projectData['endDate'] || '';
        this.status = projectData['status'] || '';
        this.employeesArray = projectData['employees'] || [];
        this.machinesArray = projectData['machines'] || [];

        this.generateResourcePairs();
      } else {
        console.error('No se encontraron detalles del proyecto.');
      }
    } catch (error) {
      console.error('Error al cargar los detalles del proyecto:', error);
    }
  }

  generateResourcePairs(): void {
    const maxLength = Math.max(
      this.employeesArray.length,
      this.machinesArray.length
    );
    this.resourcePairs = [];

    for (let i = 0; i < maxLength; i++) {
      const employee = this.employeesArray[i] || 'No asignado';
      const machine = this.machinesArray[i] || 'No asignada';
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

    try {
      const detailDocRef = doc(
        this.firestore,
        `projects/${this.projectId}/details/${this.detailId}`
      );

      await setDoc(detailDocRef, {
        description: this.projectDescription,
        startDate: this.startDate,
        endDate: this.endDate,
        status: this.status,
        employees: this.employeesArray,
        machines: this.machinesArray,
      });

      console.log('Detalles del proyecto guardados correctamente');
      alert('Detalles del proyecto actualizados exitosamente.');

      this.isEditing = false;

      // Notificar al dashboard que los proyectos han cambiado
      this.dashboardService.loadProjectStatusCounts();
    } catch (error) {
      console.error('Error al guardar los detalles del proyecto:', error);
    }
  }
}
