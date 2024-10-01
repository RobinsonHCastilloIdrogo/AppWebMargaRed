import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore'; // Importar Firestore

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
  entryDate: string = ''; // Fecha de ingreso

  constructor(private firestore: Firestore) {}

  // Función para agregar un empleado a Firestore
  addEmployee() {
    const employeesCollection = collection(this.firestore, '/employees'); // Referencia a la colección 'employees'

    // Crear un nuevo empleado
    const newEmployee = {
      dni: this.dni,
      name: this.name,
      workerType: this.workerType,
      position: this.position,
      area: this.area,
      entryDate: this.entryDate,
    };

    // Agregar el empleado a Firestore
    addDoc(employeesCollection, newEmployee)
      .then(() => {
        console.log('Empleado agregado a Firestore:', newEmployee);
        this.close(); // Cerrar el modal después de agregar el empleado
      })
      .catch((err) => {
        console.error('Error al agregar empleado:', err);
      });
  }

  // Función para cerrar el modal
  close() {
    this.closeModal.emit(); // Emitir evento para cerrar el modal
  }
}
