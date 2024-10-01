import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employee } from '../../models/employee.model';

@Component({
  selector: 'app-work-hours-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-hours-modal.component.html',
  styleUrls: ['./work-hours-modal.component.css'],
})
export class WorkHoursModalComponent {
  @Input() employees: Employee[] = []; // Recibe la lista de empleados desde el componente padre
  @Output() closeModal = new EventEmitter<void>(); // Para cerrar el modal
  @Output() saveHoursEvent = new EventEmitter<any>(); // Cambiar el nombre para evitar conflictos

  selectedEmployee: string = ''; // Aquí almacenas el id del empleado
  hours = {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  };

  // Función para guardar las horas asignadas
  saveHours() {
    if (!this.selectedEmployee) {
      console.error('Debe seleccionar un empleado');
      return;
    }

    const employeeHours = {
      employeeId: this.selectedEmployee,
      ...this.hours, // Incluye los días con las horas trabajadas
    };

    this.saveHoursEvent.emit(employeeHours); // Emitir el evento con los datos guardados
    this.close(); // Cerrar el modal después de guardar las horas
  }

  // Función para cerrar el modal
  close() {
    this.closeModal.emit(); // Emitir evento para cerrar el modal
  }
}
