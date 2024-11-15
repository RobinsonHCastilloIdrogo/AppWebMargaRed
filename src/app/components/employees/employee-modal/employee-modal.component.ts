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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employee-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-modal.component.html',
  styleUrls: ['./employee-modal.component.css'],
})
export class EmployeeModalComponent implements OnChanges {
  @Output() closeModal = new EventEmitter<void>();
  @Input() selectedEmployee: any = null;

  dni: string = '';
  name: string = '';
  workerType: string = '';
  entryDate: string = '';

  constructor(private firestore: Firestore) {}

  ngOnChanges() {
    if (this.selectedEmployee) {
      this.populateFields();
    } else {
      this.resetFields();
    }
  }

  populateFields() {
    this.dni = this.selectedEmployee.dni;
    this.name = this.selectedEmployee.name;
    this.workerType = this.selectedEmployee.workerType;
    this.entryDate = this.selectedEmployee.entryDate || this.getCurrentDate();
  }

  resetFields() {
    this.dni = '';
    this.name = '';
    this.workerType = '';
    this.entryDate = this.getCurrentDate();
  }

  getCurrentDate(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

 // Método para asegurarse que el DNI solo contenga números
 onDniKeydown(event: KeyboardEvent): void {
  // Permitir solo números y evitar letras y caracteres especiales
  const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight']; // Permitir teclas especiales (retroceso, tab, flechas)
  if (!/^[0-9]$/.test(event.key) && !allowedKeys.includes(event.key)) {
    event.preventDefault(); // Bloquea cualquier tecla que no sea un número o una tecla especial permitida
  }
}

// Método para asegurarse que el Nombre solo contenga letras y espacios
onNameKeydown(event: KeyboardEvent): void {
  // Permitir solo letras y espacios
  const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', ' ']; // Permitir teclas especiales y espacios
  if (!/^[a-zA-ZÀ-ÿ]$/.test(event.key) && !allowedKeys.includes(event.key)) {
    event.preventDefault(); // Bloquea cualquier tecla que no sea una letra o un espacio
  }
}

  validateDNI(): boolean {
    const dniPattern = /^[0-9]{8}$/;
    const repeatedNumbersPattern = /^(.)\1{7}$/;
    const sequentialPattern = /^(01234567|12345678|23456789|34567890|98765432|87654321)$/;

    if (!dniPattern.test(this.dni)) {
      Swal.fire({
        title: 'DNI Inválido',
        text: 'El DNI debe tener 8 dígitos numéricos.',
        icon: 'warning',
      });
      return false;
    }

    if (repeatedNumbersPattern.test(this.dni) || sequentialPattern.test(this.dni)) {
      Swal.fire({
        title: 'DNI Inválido',
        text: 'El DNI no puede ser una secuencia repetida o consecutiva.',
        icon: 'warning',
      });
      return false;
    }

    return true;
  }

  validateName(): boolean {
    const namePattern = /^[A-Za-zÀ-ÿ\s]+$/;
    const repeatedNamePattern = /^(.)\1+$/;

    if (!namePattern.test(this.name) || this.name.trim().length < 8) {
      Swal.fire({
        title: 'Nombre Inválido',
        text: 'El nombre debe tener al menos 8 caracteres y solo contener letras.',
        icon: 'warning',
      });
      return false;
    }

    if (repeatedNamePattern.test(this.name)) {
      Swal.fire({
        title: 'Nombre Inválido',
        text: 'El nombre no puede ser una secuencia repetida.',
        icon: 'warning',
      });
      return false;
    }

    return true;
  }

  async checkIfEmployeeExists(): Promise<boolean> {
    const employeesCollection = collection(this.firestore, 'employees');
    const employeesSnapshot = await getDocs(employeesCollection);

    for (const docSnap of employeesSnapshot.docs) {
      const employee = docSnap.data();
      if (employee['dni'] === this.dni || employee['name'].toLowerCase() === this.name.toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  async addEmployee() {
    if (!this.validateDNI() || !this.validateName() || !this.workerType) {
      return;
    }

    if (await this.checkIfEmployeeExists()) {
      Swal.fire({
        title: 'Empleado Existente',
        text: 'Ya existe un empleado con el mismo DNI o nombre.',
        icon: 'error',
      });
      return;
    }

    try {
      const employeesCollection = collection(this.firestore, 'employees');
      const employeesSnapshot = await getDocs(employeesCollection);

      let maxSequentialId = 0;
      employeesSnapshot.forEach((docSnap) => {
        const id = docSnap.id;
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
        entryDate: this.entryDate,
      };

      await setDoc(doc(this.firestore, `employees/${newId}`), newEmployee);
      this.close();
      Swal.fire({
        title: 'Empleado Agregado',
        text: 'El empleado ha sido agregado exitosamente.',
        icon: 'success',
      });
    } catch (error) {
      console.error('Error al agregar empleado:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al agregar el empleado.',
        icon: 'error',
      });
    }
  }

  async editEmployee() {
    if (!this.validateDNI() || !this.validateName()) {
      return;
    }

    try {
      const employeeDocRef = doc(this.firestore, `employees/${this.selectedEmployee.id}`);
      const updatedEmployee = {
        dni: this.dni,
        name: this.name,
        workerType: this.workerType,
        entryDate: this.entryDate,
      };

      await updateDoc(employeeDocRef, updatedEmployee);
      this.close();
      Swal.fire({
        title: 'Empleado Actualizado',
        text: 'El empleado ha sido actualizado exitosamente.',
        icon: 'success',
      });
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al actualizar el empleado.',
        icon: 'error',
      });
    }
  }

  close() {
    this.resetFields();
    this.closeModal.emit();
  }
}
