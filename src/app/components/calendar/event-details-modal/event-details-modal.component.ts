import { Component, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-event-details-modal',
  templateUrl: './event-details-modal.component.html',
  styleUrls: ['./event-details-modal.component.css'],
  standalone: true,
})
export class EventDetailsModalComponent {
  @Input() eventDetails: any;

  constructor(public bsModalRef: BsModalRef) {}

  close() {
    this.bsModalRef.hide(); // Cerrar el modal
  }
}
