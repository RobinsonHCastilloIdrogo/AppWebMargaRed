import { Component, OnInit } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { FirebaseService } from '../../services/firebase.service';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import moment from 'moment';
import 'moment/locale/es'; // Importar la localización en español
import esLocale from '@fullcalendar/core/locales/es';

@Component({
  selector: 'app-employee-schedule',
  standalone: true,
  imports: [
    FullCalendarModule,
    SharedDashboardComponent,
    NgFor,
    NgIf,
    CommonModule,
  ],
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
  allEmployees: any[] = []; // Lista de empleados únicos para la búsqueda
  totalAssignedHours: number = 0; // Total de horas asignadas al empleado seleccionado

  constructor(private firebaseService: FirebaseService) {
    moment.locale('es'); // Configurar moment para usar el idioma español
  }

  ngOnInit(): void {
    this.loadAllAssignments(); // Carga las asignaciones desde Firestore

    // Configuración inicial del calendario
    this.calendarOptions = {
      initialView: 'dayGridMonth',
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      },
      buttonText: {
        today: 'Hoy',
        month: 'Mes',
        week: 'Semana',
        day: 'Día',
      },
      editable: true,
      selectable: true,
      slotMinTime: '07:00:00',
      slotMaxTime: '23:00:00',
      events: [],
      slotEventOverlap: false,
      eventMaxStack: 3,
      eventClick: this.handleEventClick.bind(this),
      locale: esLocale, // Configuración del idioma a español
      dayHeaderFormat: { weekday: 'long' },
      eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: false },
    };
  }

  // Cargar todas las asignaciones desde Firebase
  loadAllAssignments(): void {
    this.firebaseService
      .getCollection('/assignments/2024-11/projects')
      .subscribe(
        (projects) => {
          const eventos: {
            title: string;
            start: Date;
            end: Date;
            color: string;
          }[] = [];

          const employeesSet = new Set();

          projects.forEach((project: any) => {
            const empleados = project.empleados || [];
            empleados.forEach((empleado: any) => {
              const startDate = moment(project.fechaInicio);
              const endDate = moment(project.fechaFin);

              if (!employeesSet.has(empleado.nombre)) {
                employeesSet.add(empleado.nombre);
                this.allEmployees.push(empleado);
              }

              // Iterar desde fechaInicio hasta fechaFin para generar eventos diarios
              while (startDate.isSameOrBefore(endDate)) {
                const color =
                  this.employeeColors.get(empleado.nombre) ||
                  this.generateDarkColor();
                this.employeeColors.set(empleado.nombre, color);

                eventos.push({
                  title: empleado.nombre,
                  start: new Date(
                    startDate.year(),
                    startDate.month(),
                    startDate.date(),
                    ...empleado.horaInicio.split(':')
                  ),
                  end: new Date(
                    startDate.year(),
                    startDate.month(),
                    startDate.date(),
                    ...empleado.horaFin.split(':')
                  ),
                  color: color,
                });

                startDate.add(1, 'day'); // Incrementar día usando moment
              }
            });
          });

          this.allAssignments = eventos;

          // Actualizar las opciones del calendario
          this.calendarOptions = { ...this.calendarOptions, events: eventos };
          console.log('Eventos generados:', eventos);
        },
        (error) => {
          console.error('Error al cargar asignaciones:', error);
        }
      );
  }

  // Filtrar asignaciones por empleado
  filterByEmployee(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const searchValue = inputElement.value.trim();

    // Validar entrada: solo letras
    const isValid = /^[a-zA-Z\s]*$/.test(searchValue);
    this.inputError = !isValid;

    if (!isValid || !searchValue) {
      // Si la entrada no es válida o está vacía, cerrar la lista
      this.filteredAssignments = [];
      return;
    }

    // Filtrar empleados en los eventos usando el nombre del empleado
    const uniqueNames = new Set();
    this.filteredAssignments = this.allAssignments
      .filter((assignment) =>
        assignment.title.toLowerCase().includes(searchValue.toLowerCase())
      )
      .filter((assignment) => {
        // Filtrar solo empleados únicos por nombre
        if (!uniqueNames.has(assignment.title)) {
          uniqueNames.add(assignment.title);
          return true;
        }
        return false;
      });
  }

  // Calcular el total de horas asignadas
  getTotalHours(assignments: any[]): number {
    return assignments.reduce((total, assignment) => {
      const start = moment(assignment.start);
      const end = moment(assignment.end);
      const duration = moment.duration(end.diff(start)).asHours();
      return total + duration;
    }, 0);
  }

  // Seleccionar un empleado de la lista
  selectEmployee(employee: any): void {
    this.selectedEmployee = employee;

    // Filtrar eventos del empleado seleccionado
    this.selectedEmployeeAssignments = this.allAssignments.filter(
      (assignment) => assignment.title === employee.title
    );

    // Formatear las fechas con moment
    this.selectedEmployeeAssignments = this.selectedEmployeeAssignments.map(
      (assignment) => {
        return {
          ...assignment,
          formattedStart: moment(assignment.start).format(
            'dddd, D [de] MMMM [de] YYYY, HH:mm'
          ),
          formattedEnd: moment(assignment.end).format('HH:mm'),
        };
      }
    );

    // Calcular las horas totales
    this.totalAssignedHours = this.getTotalHours(
      this.selectedEmployeeAssignments
    );
    console.log(`Total de horas asignadas: ${this.totalAssignedHours}`);

    // Actualizar el calendario
    this.updateCalendarEvents(this.selectedEmployeeAssignments);

    // Limpiar el cuadro de búsqueda
    const inputElement = document.getElementById(
      'search-employee'
    ) as HTMLInputElement;
    if (inputElement) {
      inputElement.value = ''; // Limpiar el campo de texto
    }

    // Cerrar la lista de resultados
    this.filteredAssignments = [];
  }

  // Actualizar los eventos del calendario
  updateCalendarEvents(assignments: any[]): void {
    const events = assignments.map((assignment: any) => ({
      title: assignment.title,
      start: assignment.start,
      end: assignment.end,
      color: assignment.color,
    }));

    this.calendarOptions = { ...this.calendarOptions, events };
  }

  handleEventClick(eventInfo: any): void {
    alert(`Evento: ${eventInfo.event.title}`);
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
}
