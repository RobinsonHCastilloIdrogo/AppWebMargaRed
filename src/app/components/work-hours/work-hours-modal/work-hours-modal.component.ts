import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employee } from '../../../models/employee.model';

@Component({
  selector: 'app-work-hours-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-hours-modal.component.html',
  styleUrls: ['./work-hours-modal.component.css'],
})
export class WorkHoursModalComponent {
  @Input() employees: Employee[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveHoursEvent = new EventEmitter<any>();

  selectedEmployee: string = '';
  hours = {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  };

  saveHours() {
    if (!this.selectedEmployee) {
      console.error('Debe seleccionar un empleado');
      return;
    }

    const employeeHours = {
      employeeId: this.selectedEmployee,
      ...this.hours,
    };

    this.saveHoursEvent.emit(employeeHours);
    this.close(); // Cierra el modal
  }

  close() {
    console.log('Cerrar modal'); // Verifica si esta función se llama
    this.closeModal.emit(); // Emitir evento para cerrar el modal
  }
}
