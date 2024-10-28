import { Component, Input, OnInit } from '@angular/core';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectDataService } from '../../../services/project-data.service';

@Component({
  selector: 'app-project-details',
  imports: [DatePipe, CommonModule, FormsModule],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css'],
  standalone: true,
})
export class ProjectDetailsComponent implements OnInit {
  @Input() project: any; // Recibe los datos del proyecto desde el componente padre
  projectId: string | null = null;

  // Variables para almacenar los detalles del proyecto
  projectDescription: string = '';
  startDate: string = '';
  endDate: string = '';
  status: string = '';
  employeesArray: string[] = []; // Lista de empleados
  machinesArray: string[] = []; // Lista de máquinas
  resourcePairs: { employee: string; machine: string }[] = []; // Lista de pares (empleado, máquina)
  isEditing: boolean = false;

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute,
    private projectDataService: ProjectDataService
  ) {}

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe((params) => {
      this.projectId = params.get('id');
      if (!this.projectId) {
        console.error('No se encontró el ID del proyecto.');
      } else {
        this.loadProjectDetails();
      }
    });
  }

  loadProjectDetails(): void {
    if (this.project) {
      // Asignar los valores iniciales a las variables del formulario
      this.projectDescription = this.project.description || '';
      this.startDate = this.project.startDate || '';
      this.endDate = this.project.endDate || '';
      this.status = this.project.status || '';
      this.employeesArray = this.project.employees || [];
      this.machinesArray = this.project.machines || [];

      // Emparejar empleados y máquinas
      this.generateResourcePairs();
    }
  }

  // Método para emparejar empleados y máquinas
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

  // Método para habilitar la edición de los detalles del proyecto
  enableEditing(): void {
    this.isEditing = true;
  }

  // Método para actualizar o crear los detalles del proyecto en Firestore
  async saveDetails(): Promise<void> {
    if (!this.projectId) {
      console.error('No se encontró el ID del proyecto.');
      return;
    }

    try {
      await this.projectDataService.addDetailToProject(this.projectId, {
        description: this.projectDescription,
        startDate: this.startDate,
        endDate: this.endDate,
        status: this.status,
        employees: this.employeesArray,
        machines: this.machinesArray,
      });

      console.log('Detalles del proyecto actualizados correctamente');
      alert('Detalles del proyecto actualizados exitosamente.');
      this.isEditing = false;
    } catch (error) {
      console.error('Error al actualizar el proyecto:', error);
    }
  }
}
