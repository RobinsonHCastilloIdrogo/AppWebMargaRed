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
import { Router } from '@angular/router'; // Asegúrate de importar Router

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
    private cd: ChangeDetectorRef,
    private router: Router // Agrega Router como una dependencia
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
            title:
              assignment.title || assignment.nombreProyecto || 'Sin nombre', // Mostrar el título del evento o nombre del proyecto
            start: assignment.start || assignment.fecha, // Asegúrate de que `start` o `fecha` esté correctamente asignada
            extendedProps: {
              ...assignment,
              type:
                assignment.type ||
                (assignment.nombreProyecto ? 'project' : 'event'), // Diferenciar entre proyecto o evento
              projectId: assignment.id, // Agrega el ID del proyecto para la navegación si es un proyecto
            },
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
    const { type, nombre, descripcion, fecha, empleados } =
      arg.event.extendedProps;

    // Verificar si el tipo de asignación está definido
    if (!type) {
      console.error('No se pudo determinar el tipo de asignación.');
      return;
    }

    if (type === 'event') {
      // Lógica para los eventos: abrir modal con la información correcta
      const initialState = {
        eventDetails: {
          nombre: nombre,
          descripcion: descripcion,
          fecha: fecha,
          empleados: empleados,
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
    } else if (type === 'project') {
      // Lógica para los proyectos: redirigir al project-dashboard
      const projectId = arg.event.id || arg.event.extendedProps.proyectoId;

      // Verificar si el ID del proyecto está definido
      if (!projectId) {
        console.error('El ID del proyecto no está definido.');
        return;
      }

      // Navegar al project-dashboard pasando el ID del proyecto
      this.router
        .navigate([`/projects/${projectId}`])
        .then((navigated: boolean) => {
          if (!navigated) {
            console.error('Error al navegar al proyecto con ID:', projectId);
          }
        })
        .catch((error) => {
          console.error('Error durante la navegación:', error);
        });
    } else {
      console.error('Tipo de asignación desconocido:', type);
    }
  }

  handleDateClick(arg: any): void {
    // Crear el estado inicial para el modal con la fecha seleccionada
    const initialState = { selectedDate: arg.dateStr };

    // Mostrar el modal de creación de evento
    this.bsModalRef = this.modalService.show(CalendarModalComponent, {
      initialState,
    });

    // Verificar si `bsModalRef` y su contenido existen antes de intentar suscribirse
    if (this.bsModalRef?.content && this.bsModalRef.content.assignmentSaved) {
      this.bsModalRef.content.assignmentSaved.subscribe(() => {
        this.loadAssignments(); // Cargar nuevamente las asignaciones después de guardar
      });
    } else {
      console.error('El modal o el evento assignmentSaved no están definidos.');
    }
  }
}
