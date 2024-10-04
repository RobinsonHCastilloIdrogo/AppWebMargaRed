import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './calendar-modal.component.html',
  styleUrls: ['./calendar-modal.component.css'],
})
export class CalendarModalComponent {
  @Input() selectedDate!: string; // Fecha seleccionada
  empleado!: string; // Nombre del empleado
  maquina!: string; // Nombre de la maquinaria
  descripcion!: string; // Descripción de la tarea

  constructor(public modalRef: BsModalRef) {}

  // Función para guardar la asignación y cerrar el modal
  guardarAsignacion() {
    const asignacion = {
      date: this.selectedDate,
      empleado: this.empleado,
      maquina: this.maquina,
      descripcion: this.descripcion,
    };
    console.log(asignacion); // Aquí puedes manejar la lógica de guardado
    this.modalRef.hide(); // Cierra el modal
  }
}
