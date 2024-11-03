import { Component, Input, OnInit } from '@angular/core';
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

  // Método para limpiar las asignaciones del proyecto
  clearProjectAssignments(): void {
    this.projectAssignments = [];
    this.selectedAssignmentIndex = null;
    this.selectedAssignment = null;
  }

  // Método para limpiar los campos específicos del evento
  clearEventFields(): void {
    this.eventName = '';
    this.eventDescription = '';
    this.eventStartTime = '';
    this.eventEndTime = '';
  }

  // Método para limpiar los campos específicos del proyecto
  clearProjectFields(): void {
    this.selectedProject = '';
    this.descripcionProyecto = '';
    this.projectAssignments = [];
    this.employeeCount = 0;
    this.selectedAssignmentIndex = null;
    this.selectedAssignment = null;
  }

  // Método para generar las asignaciones de empleados en función de la cantidad especificada
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

  // Método para seleccionar un empleado para edición
  selectEmployeeAssignment(): void {
    if (this.selectedAssignmentIndex !== null) {
      this.selectedAssignment =
        this.projectAssignments[this.selectedAssignmentIndex];
    }
  }

  // Método para obtener el nombre del empleado basado en su ID
  getEmployeeName(employeeId: string | null): string {
    if (!employeeId) return '';
    const employee = this.employees.find((emp) => emp.id === employeeId);
    return employee ? employee.name : '';
  }

  // Método para obtener el nombre de la máquina basado en su ID
  getMachineName(machineId: string | null): string {
    if (!machineId) return '';
    const machine = this.machines.find((mac) => mac.id === machineId);
    return machine ? machine.name : '';
  }

  // Método para guardar la asignación del evento o proyecto
  guardarAsignacion(): void {
    if (this.isEventSelected === true) {
      this.guardarEvento();
    } else if (this.isEventSelected === false) {
      this.guardarProyecto();
    } else {
      alert('Seleccione una asignación válida antes de guardar.');
    }
  }

  // Guardar un evento en la subcolección `eventos` dentro de `asignaciones`
  private guardarEvento(): void {
    if (!this.eventName) {
      alert('Por favor, ingrese el nombre del evento.');
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

    this.firebaseService.addEvento(evento).then(() => {
      this.modalRef.hide();
    });
  }

  // Guardar un proyecto en la subcolección `proyectos` dentro de `asignaciones`
  private guardarProyecto(): void {
    if (!this.selectedProject) {
      alert('Por favor, selecciona un proyecto.');
      return;
    }

    const proyectoSeleccionado = this.projects.find(
      (proj) => proj.id === this.selectedProject
    );

    if (!proyectoSeleccionado) {
      alert('El proyecto seleccionado no es válido.');
      return;
    }

    const proyecto = {
      proyectoId: this.selectedProject,
      nombreProyecto: proyectoSeleccionado.name,
      descripcion: this.descripcionProyecto,
      fecha: this.selectedDate,
      empleados: this.projectAssignments.map((assignment) => ({
        nombre: this.getEmployeeName(assignment.employeeId),
        rol: assignment.role,
        horaInicio: assignment.startHour,
        horaFin: assignment.endHour,
      })),
    };

    this.firebaseService.addProyecto(proyecto).then(() => {
      this.modalRef.hide();
    });
  }

  // Método para actualizar la información de un empleado y su máquina
  updateAssignmentRole(index: number, role: string): void {
    const assignment = this.projectAssignments[index];
    assignment.role = role;
    if (role === 'Obrero') {
      assignment.machineId = null;
      assignment.machineName = null;
    }
  }
}
