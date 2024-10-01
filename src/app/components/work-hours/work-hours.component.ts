import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { FirebaseService } from '../../services/firebase.service'; // Asegúrate de tener el servicio de Firebase configurado
import { Employee } from '../../models/employee.model';
import { WorkHoursModalComponent } from './work-hours-modal/work-hours-modal.component';

interface WorkHours {
  employeeId: string;
  employeeName: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

@Component({
  selector: 'app-work-hours',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedDashboardComponent,
    WorkHoursModalComponent,
  ],
  templateUrl: './work-hours.component.html',
  styleUrls: ['./work-hours.component.css'],
})
export class WorkHoursComponent implements OnInit {
  employees: Employee[] = []; // Array para empleados
  workHours: WorkHours[] = []; // Array de horas laborales para cada empleado
  showModal: boolean = false; // Estado del modal
  searchTerm: string = ''; // Variable para el término de búsqueda
  isEditing: boolean = false; // Variable para controlar si los inputs son editables

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    // Obtener empleados de Firebase
    this.firebaseService.getEmployees().subscribe((employees: any[]) => {
      this.employees = employees;
      this.workHours = this.employees.map((employee) => ({
        employeeId: employee.id,
        employeeName: employee.name,
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      }));
    });
  }

  // Función para abrir el modal y habilitar la edición
  openModal() {
    this.showModal = true;
    this.isEditing = true; // Habilita la edición cuando se abre el modal
  }

  // Función para cerrar el modal y deshabilitar la edición
  closeModal() {
    this.showModal = false; // Cambia el estado de showModal a false
  }

  // Función para filtrar empleados por el término de búsqueda
  filteredEmployees() {
    return this.workHours.filter((workHour) =>
      workHour.employeeName
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase())
    );
  }

  // Función para manejar el evento de guardar horas del modal
  handleSaveHours(event: any) {
    const { employeeId, hours } = event;
    const employeeWorkHours = this.workHours.find(
      (workHour) => workHour.employeeId === employeeId
    );
    if (employeeWorkHours) {
      employeeWorkHours.monday = hours.monday;
      employeeWorkHours.tuesday = hours.tuesday;
      employeeWorkHours.wednesday = hours.wednesday;
      employeeWorkHours.thursday = hours.thursday;
      employeeWorkHours.friday = hours.friday;
      employeeWorkHours.saturday = hours.saturday;
      employeeWorkHours.sunday = hours.sunday;
    }
    this.closeModal();
  }
}
