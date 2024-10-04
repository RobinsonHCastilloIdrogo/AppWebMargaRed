import { Injectable } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { CalendarModalComponent } from '../components/calendar/calendar-modal/calendar-modal.component';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  modalRef!: BsModalRef;

  constructor(private modalService: BsModalService) {}

  openModal(selectedDate: string) {
    const initialState = { selectedDate };
    this.modalRef = this.modalService.show(CalendarModalComponent, {
      initialState,
    });

    this.modalRef.content.onClose = (result: any) => {
      console.log('Modal cerrado con:', result);
    };
  }
}
