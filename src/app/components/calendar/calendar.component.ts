import { Component } from '@angular/core';
import { ModalService } from '../../services/modal.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CommonModule } from '@angular/common';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, CommonModule, SharedDashboardComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {
  calendarOptions: any;

  constructor(private modalService: ModalService) {
    this.calendarOptions = {
      initialView: 'dayGridMonth',
      plugins: [dayGridPlugin, interactionPlugin],
      selectable: true,
      dateClick: this.handleDateClick.bind(this),
      events: [
        { title: 'Evento 1', date: '2024-10-10' },
        { title: 'Evento 2', date: '2024-10-15' },
      ],
    };
  }

  handleDateClick(arg: any) {
    this.modalService.openModal(arg.dateStr); // Usa el nuevo servicio para abrir el modal
  }
}
