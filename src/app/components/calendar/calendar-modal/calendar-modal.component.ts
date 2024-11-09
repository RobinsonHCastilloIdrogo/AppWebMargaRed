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
  @Output() assignmentSaved = new EventEmitter<void>();

  isEventSelected: boolean | null = null;

  // Search filters
  employeeSearchTerm: string = '';
  machineSearchTerm: string = '';

  // Lists for original data
  allEmployees: Employee[] = [];
  allMachines: string[] = [];

  // Filtered lists
  employees: Employee[] = [];
  machines: string[] = [];
  projects: Project[] = [];

  // Modal state variables
  eventName: string = '';
  eventDescription: string = '';
  eventStartTime: string = '';
  eventEndTime: string = '';
  selectedProject: string = '';
  descripcionProyecto: string = '';
  projectAssignments: ProjectAssignment[] = [];
  employeeCount: number = 0;
  selectedAssignmentIndex: number | null = null;
  selectedAssignment: ProjectAssignment | null = null;

  constructor(
    public modalRef: BsModalRef,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadProjects();
    this.loadMachines();
  }

  // Filter functions
  filterEmployees(): void {
    if (!this.employeeSearchTerm.trim()) {
      this.employees = [...this.allEmployees];
      return;
    }
    
    const searchTerm = this.employeeSearchTerm.toLowerCase().trim();
    this.employees = this.allEmployees.filter(employee => 
      employee.name.toLowerCase().includes(searchTerm)
    );
  }

  filterMachines(): void {
    if (!this.machineSearchTerm.trim()) {
      this.machines = [...this.allMachines];
      return;
    }
    
    const searchTerm = this.machineSearchTerm.toLowerCase().trim();
    this.machines = this.allMachines.filter(machine => 
      machine.toLowerCase().includes(searchTerm)
    );
  }

  loadEmployees(): void {
    this.firebaseService.getEmployees().subscribe({
      next: (employees) => {
        this.allEmployees = employees;
        this.employees = [...employees];
      },
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
      next: (machines) => {
        this.allMachines = [];
        machines.forEach(doc => {
          const machineData = doc.machines;
          machineData.forEach((machine: Machine) => {
            this.allMachines.push(machine.id);
          });
        });
        this.machines = [...this.allMachines];
        console.log('Máquinas cargadas:', this.machines);
      },
      error: (err) => console.error('Error al cargar maquinarias:', err),
    });
  }

  // Rest of the component methods remain the same...
  // Include all other methods from the original component
  
  getAsignacionCollectionName(): string {
    const fecha = new Date();
    const mes = fecha.toLocaleString('default', { month: 'long' });
    const año = fecha.getFullYear();
    return `asignacion${mes}${año}`;
  }

  onAssignmentTypeChange(): void {
    this.clearProjectAssignments();
    if (this.isEventSelected) {
      this.clearProjectFields();
      this.employeeCount = Math.min(this.employeeCount, 2);
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
      this.employeeCount = 2;
    }
    if (this.employeeCount < 1) {
      this.employeeCount = 1;
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
      this.selectedAssignment = this.projectAssignments[this.selectedAssignmentIndex];
    }
  }

  getEmployeeName(employeeId: string | null): string {
    if (!employeeId) return '';
    const employee = this.allEmployees.find((emp) => emp.id === employeeId);
    return employee ? employee.name : '';
  }

  getMachineName(machineId: string | null): string {
    if (!machineId) return '';
    const machine = this.allMachines.find(m => m === machineId);
    return machine ? machine : '';
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
      .addEventoConId(evento, this.eventName)
      .then(() => {
        this.modalRef.hide();
      })
      .catch((error) => {
        console.error('Error al guardar el evento:', error);
      });
  }

  private guardarProyecto(): void {
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
        maquina: assignment.machineId
          ? {
              id: assignment.machineId,
              nombre: this.getMachineName(assignment.machineId),
            }
          : null,
      })),
    };

    this.firebaseService
      .addProyectoConId(proyecto, this.selectedProject)
      .then(() => {
        this.modalRef.hide();
        this.assignmentSaved.emit();
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