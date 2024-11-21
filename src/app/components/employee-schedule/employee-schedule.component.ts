import { Component, OnInit } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { FirebaseService } from '../../services/firebase.service';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-employee-schedule',
  standalone: true,
  imports: [FullCalendarModule, SharedDashboardComponent, NgFor, NgIf],
  templateUrl: './employee-schedule.component.html',
  styleUrls: ['./employee-schedule.component.css'],
})
export class EmployeeScheduleComponent implements OnInit {
  calendarOptions: any;
  allAssignments: any[] = []; // Lista completa de asignaciones
  filteredAssignments: any[] = []; // Lista filtrada de asignaciones
  selectedEmployee: any = null; // Empleado seleccionado
  selectedEmployeeAssignments: any[] = []; // Asignaciones del empleado seleccionado
  inputError: boolean = false; // Indica si hay un error en el cuadro de texto
  employeeColors: Map<string, string> = new Map(); // Colores únicos por empleado

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.loadAllAssignments(); // Carga las asignaciones desde Firestore

    // Configuración inicial del calendario
    this.calendarOptions = {
      initialView: 'timeGridWeek', // Vista inicial: semana con horas
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay', // Botones para cambiar entre vistas
      },
      editable: true, // Permitir editar eventos
      selectable: true, // Permitir seleccionar fechas
      slotMinTime: '07:00:00', // Horario inicial: 7:00 AM
      slotMaxTime: '23:00:00', // Horario final: 11:00 PM
      events: [], // Eventos dinámicos
      eventClick: this.handleEventClick.bind(this), // Evento al hacer clic
    };
  }

  // Cargar todas las asignaciones desde Firebase
  loadAllAssignments(): void {
    this.firebaseService.getAllAssignments().subscribe(
      (assignments) => {
        this.allAssignments = this.processAssignments(assignments); // Procesar asignaciones para eliminar duplicados
        this.filteredAssignments = []; // Lista cerrada por defecto

        // Asignar colores únicos a cada empleado
        this.assignColorsToEmployees(this.allAssignments);

        // Configurar eventos iniciales
        this.updateCalendarEvents(this.allAssignments);
      },
      (error) => {
        console.error('Error al cargar las asignaciones:', error);
      }
    );
  }

  // Procesar asignaciones para evitar duplicados y respetar rangos de fechas
  processAssignments(assignments: any[]): any[] {
    const processedAssignments: any[] = [];
    const assignmentMap = new Map(); // Map para evitar duplicados

    assignments.forEach((assignment) => {
      const uniqueKey = `${assignment.nombre}-${assignment.fecha}-${assignment.horaInicio}-${assignment.horaFin}`;
      if (!assignmentMap.has(uniqueKey)) {
        assignmentMap.set(uniqueKey, assignment);
        processedAssignments.push(assignment);
      }
    });

    return processedAssignments;
  }

  // Asignar colores únicos a cada empleado
  assignColorsToEmployees(assignments: any[]): void {
    assignments.forEach((assignment) => {
      if (!this.employeeColors.has(assignment.nombre)) {
        const color = this.generateDarkColor();
        this.employeeColors.set(assignment.nombre, color);
      }
    });
  }

  // Generar un color oscuro aleatorio
  generateDarkColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      const randomValue = Math.floor(Math.random() * 9); // 0-8 para tonos oscuros
      color += letters[randomValue];
    }
    return color;
  }

  // Actualizar los eventos del calendario
  updateCalendarEvents(assignments: any[]): void {
    const events = assignments.map((assignment: any) => ({
      title: assignment.nombre,
      start: `${assignment.fecha}T${assignment.horaInicio}`,
      end: `${assignment.fecha}T${assignment.horaFin}`,
      color: this.employeeColors.get(assignment.nombre), // Color único del empleado
    }));

    this.calendarOptions = { ...this.calendarOptions, events };
  }

  // Filtrar asignaciones por empleado
  filterByEmployee(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const searchValue = inputElement.value.trim();

    // Validar entrada: solo letras
    const isValid = /^[a-zA-Z\s]*$/.test(searchValue);
    this.inputError = !isValid;

    if (!isValid || !searchValue) {
      // Si la entrada no es válida o está vacía, cerrar la lista y restablecer el calendario
      this.filteredAssignments = [];
      this.selectedEmployee = null;
      this.selectedEmployeeAssignments = [];
      this.updateCalendarEvents(this.allAssignments); // Mostrar todas las asignaciones
      return;
    }

    // Filtrar empleados por el texto ingresado
    this.filteredAssignments = this.allAssignments.filter((assignment) =>
      assignment.nombre.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Actualizar el calendario con los empleados filtrados
    this.updateCalendarEvents(this.filteredAssignments);
  }

  // Seleccionar un empleado de la lista
  selectEmployee(employee: any): void {
    this.selectedEmployee = employee;

    // Mostrar solo las asignaciones del empleado seleccionado
    this.selectedEmployeeAssignments = this.allAssignments.filter(
      (assignment) => assignment.nombre === employee.nombre
    );

    // Actualizar el calendario solo con las asignaciones del empleado
    this.updateCalendarEvents(this.selectedEmployeeAssignments);

    // Restablecer el cuadro de búsqueda
    const inputElement = document.getElementById(
      'search-employee'
    ) as HTMLInputElement;
    if (inputElement) {
      inputElement.value = ''; // Limpiar el campo de texto
    }

    // Cerrar la lista de resultados
    this.filteredAssignments = [];
  }

  handleEventClick(eventInfo: any): void {
    alert(`Evento: ${eventInfo.event.title}`);
  }
}
