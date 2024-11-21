import { Component, OnInit } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-employee-schedule',
  standalone: true,
  imports: [FullCalendarModule, SharedDashboardComponent],
  templateUrl: './employee-schedule.component.html',
  styleUrls: ['./employee-schedule.component.css'],
})
export class EmployeeScheduleComponent implements OnInit {
  calendarOptions: any;

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

  loadAllAssignments(): void {
    this.firebaseService.getAllAssignments().subscribe(
      (assignments) => {
        console.log('Asignaciones obtenidas:', assignments);

        // Mapear los datos al formato de FullCalendar
        const events = assignments.map((assignment: any) => ({
          title: assignment.nombre, // Nombre del empleado
          start: `${assignment.fecha}T${assignment.horaInicio}`, // Fecha y hora de inicio
          end: `${assignment.fecha}T${assignment.horaFin}`, // Fecha y hora de fin
          color: '#D2691E', // Color opcional
        }));

        console.log('Eventos configurados para FullCalendar:', events);

        // Forzar actualización del calendario
        this.calendarOptions = { ...this.calendarOptions, events };
      },
      (error) => {
        console.error('Error al cargar las asignaciones:', error);
      }
    );
  }

  handleEventClick(eventInfo: any): void {
    alert(`Evento: ${eventInfo.event.title}`);
  }
}
