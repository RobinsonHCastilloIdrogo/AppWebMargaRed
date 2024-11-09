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
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    FullCalendarModule,
    CommonModule,
    SharedDashboardComponent,
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit, OnDestroy {
  calendarOptions: any = {};
  assignments: any[] = [];
  employees: any[] = [];
  machines: any[] = [];
  bsModalRef?: BsModalRef;
  eventSubscription?: Subscription;

  constructor(
    private modalService: BsModalService,
    private firebaseService: FirebaseService,
    private cd: ChangeDetectorRef,
    private router: Router
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

  getAssignmentDocumentName(): string | null {
    try {
      const fecha = new Date();
      const year = fecha.getFullYear();
      const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
      return `${year}-${month}`;
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
    this.cd.detectChanges();
  }

  addEventToCalendar(event: any): void {
    const existingEvent = this.assignments.find((e) => e.id === event.id);

    if (!existingEvent) {
      this.assignments.push({
        ...event,
        title: event.nombre || event.nombreProyecto || 'Sin nombre',
        start: event.fecha,
        extendedProps: event,
      });
      this.updateCalendarEvents();
    } else {
      console.log('El evento ya existe en el calendario:', existingEvent);
    }
  }

  initializeCalendarOptions(): void {
    const currentDate = new Date();
  
    this.calendarOptions = {
      initialView: 'dayGridMonth',
      plugins: [dayGridPlugin, interactionPlugin],
      selectable: true,
      events: this.assignments,  // Mantener los eventos cargados sin restricciones
      dateClick: (arg: any) => this.handleDateClick(arg, currentDate),  // Llamar al nuevo método para manejar el clic
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
    const { type, nombre, descripcion, fecha, empleados } = arg.event.extendedProps;
    const eventId = arg.event.id;

    if (!eventId) {
      console.error('No se pudo obtener el ID del evento.');
      return;
    }

    if (!type) {
      console.error('No se pudo determinar el tipo de asignación.');
      return;
    }

    if (type === 'event') {
      this.firebaseService.getEventById(eventId).subscribe(
        (eventDetails: any) => {
          if (eventDetails) {
            const initialState = {
              eventDetails: {
                nombre: eventDetails.nombre || nombre,
                descripcion: eventDetails.descripcion || descripcion,
                fecha: eventDetails.fecha || fecha,
                empleados: eventDetails.empleados || empleados,
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
          } else {
            console.error('No se encontró el evento con ID:', eventId);
          }
        },
        (error: any) => {
          console.error('Error al cargar los detalles del evento:', error);
        }
      );
    } else if (type === 'project') {
      const projectId = arg.event.id || arg.event.extendedProps.projectId;

      if (!projectId) {
        console.error('El ID del proyecto no está definido.');
        return;
      }

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

  handleDateClick(arg: any, currentDate: Date): void {
    // Establecemos el formato de fecha para hacer la comparación más sencilla
    const clickedDate = arg.date;
    
    // Convertir la fecha a la medianoche para comparar solo el día, sin la parte de la hora
    const currentDateAtMidnight = new Date(currentDate.setHours(0, 0, 0, 0));
    const clickedDateAtMidnight = new Date(clickedDate.setHours(0, 0, 0, 0));
    
    // Verificar si la fecha seleccionada es pasada (solo comparar el día)
    if (clickedDateAtMidnight < currentDateAtMidnight) {
      // Si es una fecha pasada, mostrar un mensaje con SweetAlert2
      Swal.fire({
        icon: 'warning',
        title: 'Fecha no válida',
        text: 'No puedes agregar eventos en fechas pasadas. Solo puedes agregar en la fecha actual o futuras.',
        confirmButtonText: 'Aceptar',
      });
      return;  // No hacer nada si se hace clic en una fecha pasada
    } else {
      // Si es la fecha actual o futura, permitir agregar un nuevo evento
      const initialState = { selectedDate: arg.dateStr };
  
      this.bsModalRef = this.modalService.show(CalendarModalComponent, {
        initialState,
      });
  
      if (this.bsModalRef?.content) {
        this.bsModalRef.content.assignmentSaved.subscribe(() => {
          this.loadAssignments(); // Cargar las asignaciones después de guardar
        });
      } else {
        console.error('El modal o el evento assignmentSaved no están definidos.');
      }
    }
  }
}
