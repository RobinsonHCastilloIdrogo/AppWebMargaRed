import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';

interface Employee {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface Machine {
  id: string;
  name: string;
}

interface ProjectAssignment {
  employeeId: string | null;
  employeeName: string | null;
  machineId: string | null;
  machineName?: string | null;
  role: string;
  startHour: string | null;
  endHour: string | null;
}

@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './calendar-modal.component.html',
  styleUrls: ['./calendar-modal.component.css'],
})
export class CalendarModalComponent implements OnInit {
  @Input() selectedDate!: string;
  @Output() assignmentSaved = new EventEmitter<void>(); // Emisor del evento cuando se guarda la asignación

  isEventSelected: boolean | null = null;

  // Variables para el Evento
  eventName: string = '';
  eventDescription: string = '';
  eventStartTime: string = '';
  eventEndTime: string = '';

  // Variables para el Proyecto
  selectedProject: string = '';
  descripcionProyecto: string = '';
  projectAssignments: ProjectAssignment[] = [];
  employeeCount: number = 0; // Cantidad de empleados a asignar
  selectedAssignmentIndex: number | null = null; // Índice del empleado seleccionado
  selectedAssignment: ProjectAssignment | null = null;

  employees: Employee[] = [];
  projects: Project[] = [];
  machines: Machine[] = [];

  constructor(
    public modalRef: BsModalRef,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadProjects();
    this.loadMachines();
  }

  // Obtener el nombre dinámico de la colección en base al mes y año actuales
  getAsignacionCollectionName(): string {
    const fecha = new Date();
    const mes = fecha.toLocaleString('default', { month: 'long' });
    const año = fecha.getFullYear();
    return `asignacion${mes}${año}`;
  }

  loadEmployees(): void {
    this.firebaseService.getEmployees().subscribe({
      next: (employees) => (this.employees = employees),
      error: (err) => console.error('Error al cargar empleados:', err),
    });
  }

  loadProjects(): void {
    this.firebaseService.getProjects().subscribe({
      next: (projects) => (this.projects = projects),
      error: (err) => console.error('Error al cargar proyectos:', err),
    });
  }

  loadMachines(): void {
    this.firebaseService.getMachines().subscribe({
      next: (machines) => (this.machines = machines),
      error: (err) => console.error('Error al cargar maquinarias:', err),
    });
  }

  onAssignmentTypeChange(): void {
    this.clearProjectAssignments();
    if (this.isEventSelected) {
      this.clearProjectFields();
      this.employeeCount = Math.min(this.employeeCount, 2); // Limitar a 2 empleados para eventos
    } else {
      this.clearEventFields();
    }
  }

  clearProjectAssignments(): void {
    this.projectAssignments = [];
    this.selectedAssignmentIndex = null;
    this.selectedAssignment = null;
  }

  clearEventFields(): void {
    this.eventName = '';
    this.eventDescription = '';
    this.eventStartTime = '';
    this.eventEndTime = '';
  }

  clearProjectFields(): void {
    this.selectedProject = '';
    this.descripcionProyecto = '';
    this.projectAssignments = [];
    this.employeeCount = 0;
    this.selectedAssignmentIndex = null;
    this.selectedAssignment = null;
  }

  generateEmployeeAssignments(): void {
    if (this.isEventSelected && this.employeeCount > 2) {
      this.employeeCount = 2; // Limitar a 2 empleados si es un evento
    }
    if (this.employeeCount < 1) {
      this.employeeCount = 1; // Evitar números negativos o cero
    }

    this.projectAssignments = [];
    for (let i = 0; i < this.employeeCount; i++) {
      this.projectAssignments.push({
        employeeId: null,
        employeeName: null,
        machineId: null,
        role: 'Obrero',
        startHour: null,
        endHour: null,
      });
    }
    this.selectedAssignmentIndex = null;
    this.selectedAssignment = null;
  }

  selectEmployeeAssignment(): void {
    if (this.selectedAssignmentIndex !== null) {
      this.selectedAssignment =
        this.projectAssignments[this.selectedAssignmentIndex];
    }
  }

  getEmployeeName(employeeId: string | null): string {
    if (!employeeId) return '';
    const employee = this.employees.find((emp) => emp.id === employeeId);
    return employee ? employee.name : '';
  }

  getMachineName(machineId: string | null): string {
    if (!machineId) return '';
    const machine = this.machines.find((mac) => mac.id === machineId);
    return machine ? machine.name : '';
  }

  guardarAsignacion(): void {
    if (this.isEventSelected === true) {
      this.guardarEvento();
    } else if (this.isEventSelected === false) {
      this.guardarProyecto();
    } else {
      alert('Seleccione una asignación válida antes de guardar.');
    }
  }

  private guardarEvento(): void {
    // Validar los campos
    if (!this.eventName || !this.selectedDate) {
      alert('Por favor, ingrese el nombre del evento y la fecha.');
      return;
    }

    const evento = {
      nombre: this.eventName,
      descripcion: this.eventDescription,
      fecha: this.selectedDate,
      empleados: this.projectAssignments.map((assignment) => ({
        nombre: this.getEmployeeName(assignment.employeeId),
        rol: assignment.role,
        horaInicio: assignment.startHour,
        horaFin: assignment.endHour,
      })),
    };

    this.firebaseService
      .addEvento(evento)
      .then(() => {
        this.modalRef.hide();
      })
      .catch((error) => {
        console.error('Error al guardar el evento:', error);
      });
  }

  private guardarProyecto(): void {
    // Validar los campos
    if (!this.selectedProject || !this.selectedDate) {
      alert('Por favor, selecciona un proyecto y una fecha.');
      return;
    }

    const proyecto = {
      proyectoId: this.selectedProject,
      nombreProyecto: this.projects.find(
        (proj) => proj.id === this.selectedProject
      )?.name,
      descripcion: this.descripcionProyecto,
      fecha: this.selectedDate,
      empleados: this.projectAssignments.map((assignment) => ({
        nombre: this.getEmployeeName(assignment.employeeId),
        rol: assignment.role,
        horaInicio: assignment.startHour,
        horaFin: assignment.endHour,
        // Añadir la información de la máquina asignada
        maquina: assignment.machineId
          ? {
              id: assignment.machineId,
              nombre: this.getMachineName(assignment.machineId),
            }
          : null,
      })),
    };

    this.firebaseService
      .addProyecto(proyecto)
      .then(() => {
        this.modalRef.hide();
        this.assignmentSaved.emit(); // Emitir evento cuando se guarda una asignación
      })
      .catch((error) => {
        console.error('Error al guardar el proyecto:', error);
      });
  }

  updateAssignmentRole(index: number, role: string): void {
    const assignment = this.projectAssignments[index];
    assignment.role = role;
    if (role === 'Obrero') {
      assignment.machineId = null;
      assignment.machineName = null;
    }
  }
}
