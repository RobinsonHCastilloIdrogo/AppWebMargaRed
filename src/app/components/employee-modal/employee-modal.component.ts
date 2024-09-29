import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-modal.component.html',
  styleUrls: ['./employee-modal.component.css'],
})
export class EmployeeModalComponent {
  @Output() closeModal = new EventEmitter<void>();

  dni: string = '';
  name: string = '';
  workerType: string = '';
  position: string = '';
  area: string = '';

  // Simular la función para guardar un empleado
  addEmployee() {
    console.log({
      dni: this.dni,
      name: this.name,
      workerType: this.workerType,
      position: this.position,
      area: this.area,
    });
    this.close(); // Cierra el modal después de guardar
  }

  // Función para cerrar el modal
  close() {
    this.closeModal.emit(); // Emitir evento para cerrar el modal
  }
}
