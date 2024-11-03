import { Component, OnInit, OnDestroy } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { FirebaseService } from '../../services/firebase.service';
import { CalendarModalComponent } from './calendar-modal/calendar-modal.component';
import { EventDetailsModalComponent } from './event-details-modal/event-details-modal.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CommonModule } from '@angular/common';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    FullCalendarModule,
    CommonModule,
    SharedDashboardComponent,
    EventDetailsModalComponent,
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit, OnDestroy {
  calendarOptions: any = {};
  assignments: any[] = [];
  employees: any[] = []; // Almacena los empleados cargados
  machines: any[] = []; // Almacena las máquinas cargadas
  bsModalRef?: BsModalRef;
  eventSubscription?: Subscription;

  constructor(
    private modalService: BsModalService,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.initializeCalendarOptions();
    this.loadEmployeesAndMachines();
    this.loadAssignments();

    this.eventSubscription = this.firebaseService.nuevoEvento$.subscribe(
      (evento) => {
        console.log('Evento recibido:', evento);
        this.addEventToCalendar(evento);
      }
    );
  }

  ngOnDestroy(): void {
    this.eventSubscription?.unsubscribe();
  }

  loadEmployeesAndMachines(): void {
    this.firebaseService.getEmployees().subscribe((employees) => {
      this.employees = employees;
    });

    this.firebaseService.getMachines().subscribe((machines) => {
      this.machines = machines;
    });
  }

  loadAssignments(): void {
    this.assignments = [];
    this.firebaseService.getAssignments().subscribe((assignments) => {
      console.log('Asignaciones cargadas:', assignments);
      this.assignments = assignments.map((assignment) => {
        // Verificación de la fecha
        const assignmentDate = assignment.fecha || assignment.start;
        if (!assignmentDate) {
          console.warn('La asignación no tiene fecha:', assignment);
        }

        return {
          id: assignment.id,
          title:
            assignment.tipo === 'evento'
              ? 'Evento: ' + (assignment.nombre || 'Sin nombre')
              : 'Proyecto: ' + (assignment.nombreProyecto || 'Sin nombre'),
          start: assignmentDate, // Asegúrate de que la fecha esté correcta
          extendedProps: { ...assignment }, // Pasar todos los props adicionales
        };
      });
      console.log('Eventos para el calendario:', this.assignments);
      this.updateCalendarEvents();
    });
  }

  updateCalendarEvents(): void {
    if (this.assignments && this.assignments.length > 0) {
      console.log('Actualizando eventos en el calendario:', this.assignments);
    } else {
      console.warn('No hay eventos asignados para mostrar.');
    }

    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...this.assignments],
    };
  }

  addEventToCalendar(event: any): void {
    const existingEvent = this.assignments.find((e) => e.id === event.id);

    if (!existingEvent) {
      const eventType = event.tipo === 'evento' ? 'Evento: ' : 'Proyecto: '; // Diferenciar entre eventos y proyectos

      this.assignments.push({
        ...event,
        title:
          eventType + (event.nombre || event.nombreProyecto || 'Sin nombre'), // Usar tipo y nombre correcto
        start: event.start || event.fecha, // Usar la fecha correcta
      });
      this.updateCalendarEvents();
    }
  }

  initializeCalendarOptions(): void {
    this.calendarOptions = {
      initialView: 'dayGridMonth',
      plugins: [dayGridPlugin, interactionPlugin],
      selectable: true,
      dateClick: this.handleDateClick.bind(this),
      events: this.assignments, // Cargar eventos desde las asignaciones
      eventClick: this.handleEventClick.bind(this),
    };
  }

  getEmployeeName(employeeId: string): string {
    const employee = this.employees.find((emp) => emp.id === employeeId);
    return employee ? employee.name : 'Empleado desconocido';
  }

  getMachineName(machineId: string): string {
    const machine = this.machines.find((mac) => mac.id === machineId);
    return machine ? machine.name : 'Maquinaria desconocida';
  }

  handleEventClick(arg: any): void {
    const { empleado, maquina } = arg.event.extendedProps;

    const nombreEmpleado = this.getEmployeeName(empleado);
    const nombreMaquina = this.getMachineName(maquina);

    const initialState = {
      eventDetails: {
        ...arg.event.extendedProps,
        empleado: nombreEmpleado,
        maquina: nombreMaquina,
      },
    };

    this.bsModalRef = this.modalService.show(EventDetailsModalComponent, {
      initialState,
    });

    if (this.bsModalRef.content) {
      this.bsModalRef.content.closeBtnName = 'Cerrar';
    } else {
      console.error('El contenido del modal no se cargó correctamente.');
    }
  }

  handleDateClick(arg: any): void {
    const initialState = { selectedDate: arg.dateStr };

    this.bsModalRef = this.modalService.show(CalendarModalComponent, {
      initialState,
    });

    if (this.bsModalRef?.content) {
      this.bsModalRef.content.closeBtnName = 'Cerrar';
      console.log('Modal de creación de evento abierto correctamente.');
    } else {
      console.error('No se pudo abrir el modal de creación de evento.');
    }
  }
}
