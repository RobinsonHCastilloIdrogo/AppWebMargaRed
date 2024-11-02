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
  nombreEvento: string = '';
  selectedEmployee: string = '';
  selectedMachine: string = '';
  horaInicio: string = '';
  horaFin: string = '';
  descripcion: string = '';

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
    // Lógica adicional al cambiar el tipo de asignación
    this.clearProjectAssignments();
  }

  // Método para generar las asignaciones de empleados en función de la cantidad especificada
  generateEmployeeAssignments(): void {
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

  // Método para eliminar un empleado de la asignación del proyecto
  removeProjectAssignment(index: number): void {
    this.projectAssignments.splice(index, 1);
    if (this.selectedAssignmentIndex === index) {
      this.selectedAssignmentIndex = null;
      this.selectedAssignment = null;
    }
  }

  // Método para obtener el nombre del empleado basado en su ID
  getEmployeeName(employeeId: string): string {
    const employee = this.employees.find((emp) => emp.id === employeeId);
    return employee ? employee.name : '';
  }

  // Método para obtener el nombre de la máquina basado en su ID
  getMachineName(machineId: string): string {
    const machine = this.machines.find((mac) => mac.id === machineId);
    return machine ? machine.name : '';
  }

  // Método para guardar la asignación del proyecto con todos los empleados
  guardarAsignacion(): void {
    if (this.isEventSelected === false) {
      this.guardarProyecto();
    } else {
      alert('Seleccione una asignación válida antes de guardar.');
    }
  }

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
      id: this.selectedProject,
      date: this.selectedDate,
      nombreProyecto: proyectoSeleccionado.name,
      descripcion: this.descripcionProyecto,
      assignments: this.projectAssignments.map((assignment) => ({
        employeeId: assignment.employeeId,
        employeeName: assignment.employeeName
          ? this.getEmployeeName(assignment.employeeId!)
          : '',
        machineId: assignment.machineId || null,
        machineName: assignment.machineId
          ? this.getMachineName(assignment.machineId)
          : null,
        role: assignment.role,
        startHour: assignment.startHour,
        endHour: assignment.endHour,
      })),
    };

    this.firebaseService.addAssignment(proyecto).then(() => {
      const newEvent = {
        title: proyecto.nombreProyecto,
        start: proyecto.date,
        extendedProps: { ...proyecto },
      };
      this.firebaseService.emitirEvento(newEvent);
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

  // Método para limpiar las asignaciones del proyecto
  clearProjectAssignments(): void {
    this.projectAssignments = [];
    this.selectedAssignmentIndex = null;
    this.selectedAssignment = null;
  }
}
