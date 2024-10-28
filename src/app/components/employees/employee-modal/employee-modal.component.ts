import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
} from '@angular/core';
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
export class EmployeeModalComponent implements OnChanges {
  @Output() closeModal = new EventEmitter<void>(); // Evento para cerrar el modal
  @Input() selectedEmployee: any = null; // Recibe el empleado seleccionado

  // Variables para los campos del formulario
  dni: string = '';
  name: string = '';
  workerType: string = '';
  position: string = '';
  area: string = '';
  entryDate: string = '';

  constructor(private firestore: Firestore) {}

  // Detectar cambios en el empleado seleccionado
  ngOnChanges() {
    if (this.selectedEmployee) {
      this.populateFields(); // Rellenar los campos si hay un empleado seleccionado
    } else {
      this.resetFields(); // Limpiar los campos si no hay empleado seleccionado
    }
  }

  // Función para rellenar los campos del formulario
  populateFields() {
    this.dni = this.selectedEmployee.dni;
    this.name = this.selectedEmployee.name;
    this.workerType = this.selectedEmployee.workerType;
    this.position = this.selectedEmployee.position;
    this.area = this.selectedEmployee.area;
    this.entryDate = this.selectedEmployee.entryDate;
  }

  // Función para limpiar los campos
  resetFields() {
    this.dni = '';
    this.name = '';
    this.workerType = '';
    this.position = '';
    this.area = '';
    this.entryDate = '';
  }

  // Agregar un empleado a Firestore con ID secuencial
  async addEmployee() {
    try {
      const employeesCollection = collection(this.firestore, 'employees');
      const employeesSnapshot = await getDocs(employeesCollection);

      let maxSequentialId = 0;

      // Determinar el ID secuencial más alto existente
      employeesSnapshot.forEach((doc) => {
        const id = doc.id;
        if (/^\d{4}$/.test(id)) {
          const numericId = parseInt(id);
          if (numericId > maxSequentialId) {
            maxSequentialId = numericId;
          }
        }
      });

      const newId = String(maxSequentialId + 1).padStart(4, '0');

      const newEmployee = {
        dni: this.dni,
        name: this.name,
        workerType: this.workerType,
        position: this.position,
        area: this.area,
        entryDate: this.entryDate,
      };

      await setDoc(doc(this.firestore, `employees/${newId}`), newEmployee);
      console.log('Empleado agregado con ID:', newId, newEmployee);
      this.close(); // Cierra el modal después de agregar
    } catch (error) {
      console.error('Error al agregar empleado:', error);
    }
  }

  // Editar un empleado existente en Firestore
  async editEmployee() {
    try {
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

      await updateDoc(employeeDocRef, updatedEmployee);
      console.log('Empleado actualizado:', updatedEmployee);
      this.close(); // Cierra el modal después de actualizar
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
    }
  }

  // Función para cerrar el modal
  close() {
    this.resetFields(); // Limpia los campos del formulario
    this.closeModal.emit(); // Emitir evento para cerrar el modal
  }
}
