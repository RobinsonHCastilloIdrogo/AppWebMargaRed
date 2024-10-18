import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-employee-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-modal.component.html',
  styleUrls: ['./employee-modal.component.css'],
})
export class EmployeeModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Input() selectedEmployee: any; // Para recibir el empleado seleccionado

  dni: string = '';
  name: string = '';
  workerType: string = '';
  position: string = '';
  area: string = '';
  entryDate: string = '';

  constructor(private firestore: Firestore) {}

  ngOnChanges() {
    if (this.selectedEmployee) {
      // Rellenar los campos del modal si hay un empleado seleccionado
      this.dni = this.selectedEmployee.dni;
      this.name = this.selectedEmployee.name;
      this.workerType = this.selectedEmployee.workerType;
      this.position = this.selectedEmployee.position;
      this.area = this.selectedEmployee.area;
      this.entryDate = this.selectedEmployee.entryDate;
    } else {
      // Limpiar campos si no hay empleado seleccionado
      this.resetFields();
    }
  }

  resetFields() {
    this.dni = '';
    this.name = '';
    this.workerType = '';
    this.position = '';
    this.area = '';
    this.entryDate = '';
  }

  // Función para agregar un empleado a Firestore con ID secuencial
  async addEmployee() {
    const employeesCollection = collection(this.firestore, '/employees'); // Referencia a la colección 'employees'

    // Obtener todos los empleados existentes
    const employeesSnapshot = await getDocs(employeesCollection);

    let maxSequentialId = 0;

    // Buscar el ID secuencial más alto (considerando IDs de 4 dígitos)
    employeesSnapshot.forEach((doc) => {
      const id = doc.id;

      if (/^\d{4}$/.test(id)) {
        const numericId = parseInt(id);
        if (numericId > maxSequentialId) {
          maxSequentialId = numericId;
        }
      }
    });

    // Generar el nuevo ID secuencial
    const newId = String(maxSequentialId + 1).padStart(4, '0');

    // Crear un nuevo empleado
    const newEmployee = {
      dni: this.dni,
      name: this.name,
      workerType: this.workerType,
      position: this.position,
      area: this.area,
      entryDate: this.entryDate,
    };

    // Guardar el empleado con el nuevo ID secuencial en Firestore
    setDoc(doc(this.firestore, `employees/${newId}`), newEmployee)
      .then(() => {
        console.log('Empleado agregado con ID secuencial:', newId, newEmployee);
        this.close(); // Cerrar el modal después de agregar el empleado
      })
      .catch((err) => {
        console.error('Error al agregar empleado:', err);
      });
  }

  editEmployee() {
    const employeeDocRef = doc(
      this.firestore,
      `employees/${this.selectedEmployee.id}`
    );
    const updatedEmployee = {
      dni: this.dni,
      name: this.name,
      workerType: this.workerType,
      position: this.position,
      area: this.area,
      entryDate: this.entryDate,
    };

    updateDoc(employeeDocRef, updatedEmployee)
      .then(() => {
        console.log('Empleado actualizado en Firestore:', updatedEmployee);
        this.close();
      })
      .catch((err) => {
        console.error('Error al actualizar empleado:', err);
      });
  }

  // Función para cerrar el modal
  close() {
    this.closeModal.emit(); // Emitir evento para cerrar el modal
  }
}
