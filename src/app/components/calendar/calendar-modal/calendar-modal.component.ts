import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

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
  machineSearchQuery?: string;
  filteredMachines: Machine[]; // Inicializa como una lista vacía
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

  // Lists for original data
  allEmployees: Employee[] = [];
  allMachines: Machine[] = [];

  // Filtered lists
  employees: Employee[] = [];
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
  startDate: string = ''; // Fecha de inicio (autocompletada)
  endDate: string = ''; // Fecha de finalización (seleccionada por el usuario)

  constructor(
    public modalRef: BsModalRef,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.startDate = this.selectedDate; // Autocompleta la fecha de inicio con la fecha seleccionada
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
    this.employees = this.allEmployees.filter((employee) =>
      employee.name.toLowerCase().includes(searchTerm)
    );
  }

  filterMachinesForAssignment(assignment: ProjectAssignment): void {
    const query = assignment.machineSearchQuery?.toLowerCase().trim() || '';
    assignment.filteredMachines = query
      ? this.allMachines.filter(
          (machine) =>
            machine.name.toLowerCase().includes(query) ||
            machine.id.toString().includes(query)
        )
      : [];
  }

  selectMachine(assignment: ProjectAssignment, machine: Machine): void {
    assignment.machineId = machine.id;
    assignment.machineName = machine.name; // Asigna el nombre de la máquina seleccionada al objeto de asignación
    assignment.machineSearchQuery = machine.name; // Muestra el nombre de la máquina seleccionada en el campo de búsqueda
    assignment.filteredMachines = []; // Oculta la lista desplegable
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
        machines.forEach((doc) => {
          const machineData = doc.machines;
          machineData.forEach((machine: Machine) => {
            this.allMachines.push(machine);
          });
        });
        console.log('Máquinas cargadas:', this.allMachines);
      },
      error: (err) => console.error('Error al cargar maquinarias:', err),
    });
  }

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
        machineSearchQuery: '', // Inicialización de la búsqueda
        filteredMachines: [], // Inicialización de lista vacía
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
    const employee = this.allEmployees.find((emp) => emp.id === employeeId);
    return employee ? employee.name : '';
  }

  getMachineName(machineId: string | null): string {
    if (!machineId) return '';
    const machine = this.allMachines.find((m) => m.id === machineId);
    return machine ? machine.name : '';
  }

  guardarAsignacion(): void {
    if (this.isEventSelected === true) {
      if (this.validateEventFields()) {
        this.guardarEvento();
      }
    } else if (this.isEventSelected === false) {
      if (this.validateProjectFields()) {
        this.guardarProyecto();
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Seleccione una asignación válida antes de guardar.',
      });
    }
  }

  private validateEventFields(): boolean {
    if (
      !this.eventName ||
      !this.startDate ||
      !this.endDate ||
      this.projectAssignments.length < 1
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Debe completar todos los campos, incluyendo las fechas de inicio y finalización, y asignar al menos un empleado para crear un evento.',
      });
      return false;
    }

    const hasEmployee = this.projectAssignments.some(
      (assignment) => assignment.employeeId !== null
    );
    if (!hasEmployee) {
      Swal.fire({
        icon: 'warning',
        title: 'Empleado no seleccionado',
        text: 'Debe seleccionar al menos un empleado para guardar el evento.',
      });
      return false;
    }

    const selectedEmployeeIds = new Set<string>();
    for (const assignment of this.projectAssignments) {
      const employeeId = assignment.employeeId;
      if (employeeId && selectedEmployeeIds.has(employeeId)) {
        Swal.fire({
          icon: 'warning',
          title: 'Empleado duplicado',
          text: `El empleado ${this.getEmployeeName(
            employeeId
          )} ya ha sido asignado.`,
        });
        return false;
      }
      if (employeeId) {
        selectedEmployeeIds.add(employeeId);
      }
    }

    for (const assignment of this.projectAssignments) {
      if (assignment.role === 'Operador' && !assignment.machineId) {
        Swal.fire({
          icon: 'warning',
          title: 'Máquina no asignada',
          text: 'Si el rol es "Operador", debe asignarse una máquina para el evento.',
        });
        return false;
      }
    }

    const selectedMachineIds = new Set<string>();
    for (const assignment of this.projectAssignments) {
      const machineId = assignment.machineId;
      if (machineId && selectedMachineIds.has(machineId)) {
        Swal.fire({
          icon: 'warning',
          title: 'Máquina duplicada',
          text: `La máquina ${this.getMachineName(
            machineId
          )} ya ha sido asignada.`,
        });
        return false;
      }
      if (machineId) {
        selectedMachineIds.add(machineId);
      }
    }

    for (const assignment of this.projectAssignments) {
      if (!assignment.startHour || !assignment.endHour) {
        Swal.fire({
          icon: 'warning',
          title: 'Horas incompletas',
          text: 'Por favor, complete las horas de inicio y fin para cada asignación.',
        });
        return false;
      }
    }

    return true;
  }

  private guardarEvento(): void {
    const evento = {
      nombre: this.eventName,
      descripcion: this.eventDescription,
      fechaInicio: this.startDate, // Nueva fecha de inicio
      fechaFin: this.endDate, // Nueva fecha de finalización
      fecha: this.selectedDate,
      cantidadEmpleados: this.projectAssignments.length,
      type: 'event', // Agregar el tipo de asignación como 'event'
      empleados: this.projectAssignments.map((assignment) => {
        const maquina = assignment.machineId ? assignment.machineId : null;
        return {
          nombre: this.getEmployeeName(assignment.employeeId),
          rol: assignment.role,
          horaInicio: assignment.startHour,
          horaFin: assignment.endHour,
          maquina: maquina,
        };
      }),
    };

    this.firebaseService
      .addEventoConId(evento, this.eventName)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Evento guardado con éxito',
          text: 'El evento ha sido guardado exitosamente.',
        });
        this.modalRef.hide();
        this.assignmentSaved.emit(); // Emitir el evento para actualizar el calendario
      })
      .catch((error) => {
        console.error('Error al guardar el evento:', error);
      });
  }

  private validateProjectFields(): boolean {
    if (
      !this.selectedProject ||
      !this.startDate ||
      !this.endDate ||
      this.employeeCount < 1
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, selecciona un proyecto, una fecha de inicio y finalización, y especifica la cantidad de empleados.',
      });
      return false;
    }

    const hasEmployee = this.projectAssignments.some(
      (assignment) => assignment.employeeId !== null
    );
    if (!hasEmployee) {
      Swal.fire({
        icon: 'warning',
        title: 'Empleado no seleccionado',
        text: 'Debe seleccionar al menos un empleado para guardar el proyecto.',
      });
      return false;
    }

    const selectedEmployeeIds = new Set<string>();
    for (let i = 0; i < this.employeeCount; i++) {
      const employeeId = this.projectAssignments[i]?.employeeId;
      if (employeeId && selectedEmployeeIds.has(employeeId)) {
        Swal.fire({
          icon: 'warning',
          title: 'Empleado duplicado',
          text: `El empleado ${this.getEmployeeName(
            employeeId
          )} ya ha sido asignado.`,
        });
        return false;
      }
      if (employeeId) {
        selectedEmployeeIds.add(employeeId);
      }
    }

    for (let i = 0; i < this.employeeCount; i++) {
      const assignment = this.projectAssignments[i];
      if (assignment.role === 'Operador' && !assignment.machineId) {
        Swal.fire({
          icon: 'warning',
          title: 'Máquina no asignada',
          text: 'Si el rol es "Operador", debe asignarse una máquina.',
        });
        return false;
      }
    }

    const selectedMachineIds = new Set<string>();
    for (let i = 0; i < this.employeeCount; i++) {
      const machineId = this.projectAssignments[i]?.machineId;
      if (machineId && selectedMachineIds.has(machineId)) {
        Swal.fire({
          icon: 'warning',
          title: 'Máquina duplicada',
          text: `La máquina ${this.getMachineName(
            machineId
          )} ya ha sido asignada.`,
        });
        return false;
      }
      if (machineId) {
        selectedMachineIds.add(machineId);
      }
    }

    for (let i = 0; i < this.employeeCount; i++) {
      const assignment = this.projectAssignments[i];
      if (
        !assignment.employeeId ||
        !assignment.role ||
        !assignment.startHour ||
        !assignment.endHour
      ) {
        Swal.fire({
          icon: 'warning',
          title: 'Campos incompletos',
          text: 'Por favor, complete todos los campos, incluyendo las horas de inicio y fin, para todos los empleados.',
        });
        return false;
      }
    }

    return true;
  }

  private guardarProyecto(): void {
    const proyecto = {
      proyectoId: this.selectedProject,
      nombreProyecto: this.projects.find(
        (proj) => proj.id === this.selectedProject
      )?.name,
      descripcion: this.descripcionProyecto,
      fechaInicio: this.startDate, // Nueva fecha de inicio
      fechaFin: this.endDate, // Nueva fecha de finalización
      fecha: this.selectedDate,
      type: 'project', // Agregar el tipo de asignación como 'project'
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
        Swal.fire({
          icon: 'success',
          title: 'Proyecto guardado con éxito',
          text: 'El proyecto ha sido guardado exitosamente.',
        });
        this.modalRef.hide();
        this.assignmentSaved.emit(); // Emitir el evento para actualizar el calendario
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
