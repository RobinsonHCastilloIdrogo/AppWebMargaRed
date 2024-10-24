import { Component, Input, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-event-details-modal',
  templateUrl: './event-details-modal.component.html',
  styleUrls: ['./event-details-modal.component.css'],
  standalone: true,
  imports: [NgIf],
})
export class EventDetailsModalComponent implements OnInit {
  @Input() eventDetails: any = {};

  isEvent!: boolean;

  constructor(public modalRef: BsModalRef) {}

  ngOnInit(): void {
    // Determinar si es un evento o un proyecto
    this.isEvent = !!this.eventDetails.nombreEvento;
  }

  close(): void {
    this.modalRef.hide();
  }
}
