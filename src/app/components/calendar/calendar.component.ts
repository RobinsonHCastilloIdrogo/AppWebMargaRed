import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
    private firebaseService: FirebaseService,
    private cd: ChangeDetectorRef // Agregar ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeCalendarOptions();
    this.loadEmployeesAndMachines();
    this.loadAssignments(); // Cargar las asignaciones para el mes actual

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

  // Función para obtener el nombre del documento en base al mes y año actual
  getAssignmentDocumentName(): string | null {
    try {
      const fecha = new Date();
      const year = fecha.getFullYear();
      const month = (fecha.getMonth() + 1).toString().padStart(2, '0'); // Asegura que el mes sea de 2 dígitos
      return `${year}-${month}`; // Formato YYYY-MM
    } catch (error) {
      console.error('Error al generar el nombre del documento:', error);
      return null;
    }
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
    const documentName = this.getAssignmentDocumentName();

    if (!documentName) {
      console.error('El nombre del documento no es válido:', documentName);
      return;
    }

    this.firebaseService.getAssignments(documentName).subscribe(
      (assignments) => {
        console.log('Asignaciones cargadas desde Firestore:', assignments);

        if (assignments && assignments.length > 0) {
          this.assignments = assignments.map((assignment: any) => ({
            id: assignment.id,
            title: assignment.title,
            start: assignment.start,
            extendedProps: assignment,
          }));

          this.updateCalendarEvents();
        } else {
          console.warn('No se encontraron asignaciones para el mes actual');
        }
      },
      (error) => {
        console.error('Error al cargar asignaciones:', error);
      }
    );
  }

  updateCalendarEvents(): void {
    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...this.assignments],
    };
    this.cd.detectChanges(); // Forzar detección de cambios
  }

  addEventToCalendar(event: any): void {
    const existingEvent = this.assignments.find((e) => e.id === event.id);

    if (!existingEvent) {
      this.assignments.push({
        ...event,
        title: event.nombre || event.nombreProyecto || 'Sin nombre',
        start: event.fecha, // Asegúrate de que sea una fecha válida
        extendedProps: event, // Pasar las propiedades extendidas
      });
      this.updateCalendarEvents();
    } else {
      console.log('El evento ya existe en el calendario:', existingEvent);
    }
  }

  initializeCalendarOptions(): void {
    this.calendarOptions = {
      initialView: 'dayGridMonth',
      plugins: [dayGridPlugin, interactionPlugin],
      selectable: true,
      dateClick: this.handleDateClick.bind(this),
      events: this.assignments,
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

      // Suscribirse al evento del modal
      this.bsModalRef.content.assignmentSaved.subscribe(() => {
        this.loadAssignments(); // Cargar nuevamente las asignaciones después de guardar
      });
    } else {
      console.error('No se pudo abrir el modal de creación de evento.');
    }
  }
}
