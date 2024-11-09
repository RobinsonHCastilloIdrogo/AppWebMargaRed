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
  @Output() closeModal = new EventEmitter<void>(); // Evento para cerrar el modal
  @Input() selectedEmployee: any = null; // Recibe el empleado seleccionado

  // Variables para los campos del formulario
  dni: string = '';
  name: string = '';
  workerType: string = '';
  entryDate: string = ''; // Se va a establecer a la fecha actual

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
    this.entryDate = this.selectedEmployee.entryDate || this.getCurrentDate(); // Establecer fecha actual si no hay
  }

  // Función para limpiar los campos
  resetFields() {
    this.dni = '';
    this.name = '';
    this.workerType = '';
    this.entryDate = this.getCurrentDate(); // Establecer fecha actual por defecto
  }

  // Función para obtener la fecha actual en formato yyyy-mm-dd
  getCurrentDate(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Validar el DNI (8 dígitos numéricos)
  validateDNI(): boolean {
    const dniPattern = /^[0-9]{8}$/;
    if (!dniPattern.test(this.dni)) {
      return false; // El DNI no es válido
    }

    // Validar que no sean secuencias de números repetidos o consecutivos
    const repeatedNumbersPattern = /^(.)\1{7}$/; // Repite el mismo número 8 veces
    const sequentialPattern = /^(01234567|12345678|23456789|34567890|98765432|87654321)$/; // Secuencias ascendentes o descendentes

    if (repeatedNumbersPattern.test(this.dni) || sequentialPattern.test(this.dni)) {
      return false; // DNI no válido por ser secuencia repetitiva o ascendente/descendente
    }

    return true; // El DNI es válido
  }

  // Validar el nombre (solo letras y espacios, no vacío)
  validateName(): boolean {
    const namePattern = /^[A-Za-zÀ-ÿ\s]+$/; // Permite letras con acentos y espacios
    if (!namePattern.test(this.name) || this.name.trim().length < 8) {
      return false; // No es un nombre válido
    }

    // Validar que no sea una secuencia de letras repetidas
    const repeatedNamePattern = /^(.)\1+$/; // Detecta secuencias repetidas de letras (ejemplo: aaaaaaa)
    if (repeatedNamePattern.test(this.name)) {
      return false; // Nombre es una secuencia repetida
    }

    return true;
  }

  // Validar si el nombre o el DNI ya existen
  async checkIfEmployeeExists(): Promise<boolean> {
  const employeesCollection = collection(this.firestore, 'employees');
  const employeesSnapshot = await getDocs(employeesCollection);
  let exists = false;

  employeesSnapshot.forEach((doc) => {
    const employee = doc.data();
    // Acceder a las propiedades usando la notación de corchetes
    if (employee['dni'] === this.dni) {
      exists = true; // Ya existe un empleado con ese DNI
    }
    if (employee['name'].toLowerCase() === this.name.toLowerCase()) {
      exists = true; // Ya existe un empleado con ese nombre
    }
  });

  return exists;
  }

  // Agregar un empleado a Firestore con ID secuencial
  async addEmployee() {
    if (!this.validateDNI()) {
      alert('DNI inválido:\n' +
        '-El DNI debe tener 8 dígitos numéricos.\n' +
        '-No número repetitivos.\n' +
        '-No debe ser una secuencia de número.'
      );
      return;
    }

    if (!this.validateName()) {
      alert('Nombre inválido:\n' +
        '-El nombre no puede contener números.\n' +
        '-El nombre debe tener mínimo 8 caracteres.\n' + 
        '-Debe ser un nombre real.\n' +
        '-El nombre no puede estar vacío.\n');
      return;
    }

    if (!this.workerType) {
      alert('Por favor, selecciona un tipo de trabajador:\n' + 
        '-OPERADOR\n' + 
        '-OBRERO');
      return;
    }

    // Verificar si ya existe un empleado con el mismo DNI o nombre
    const employeeExists = await this.checkIfEmployeeExists();
    if (employeeExists) {
      Swal.fire({
        title: 'Empleado ya existe',
        text: 'Ya existe un empleado con el mismo nombre o DNI.',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
      return;
    }

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
        entryDate: this.entryDate, // Guardamos la fecha actual
      };

      await setDoc(doc(this.firestore, `employees/${newId}`), newEmployee);
      console.log('Empleado agregado con ID:', newId, newEmployee);
      this.close(); // Cierra el modal después de agregar
      Swal.fire('Agregado!', 'El empleado ha sido agregado.', 'success');
    } catch (error) {
      console.error('Error al agregar empleado:', error);
      Swal.fire('Error', 'Hubo un problema al agregar el empleado.', 'error');
    }
  }

  // Editar un empleado existente en Firestore
  async editEmployee() {
    if (!this.validateDNI()) {
      alert('DNI inválido:\n' +
        '-El DNI debe tener 8 dígitos numéricos.\n' +
        '-No número repetitivos.\n' +
        '-No debe ser una secuencia de número.'
      );
      return;
    }

    if (!this.validateName()) {
      alert('Nombre inválido:\n' +
        '-El nombre no puede contener números.\n' +
        '-El nombre debe tener mínimo 8 caracteres.\n' + 
        '-Debe ser un nombre real.\n' +
        '-El nombre no puede estar vacío.\n'
      );
      return;
    }
    try {
      const employeeDocRef = doc(
        this.firestore,
        `employees/${this.selectedEmployee.id}`
      );

      const updatedEmployee = {
        dni: this.dni,
        name: this.name,
        workerType: this.workerType,
        entryDate: this.entryDate, // Fecha que no se modifica
      };

      await updateDoc(employeeDocRef, updatedEmployee);
      console.log('Empleado actualizado:', updatedEmployee);
      this.close(); // Cierra el modal después de actualizar
      Swal.fire('Actualizado!', 'El empleado ha sido actualizado.', 'success');
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      Swal.fire('Error', 'Hubo un problema al actualizar el empleado.', 'error');
    }
  }

  // Función para cerrar el modal
  close() {
    this.resetFields(); // Limpia los campos del formulario
    this.closeModal.emit(); // Emitir evento para cerrar el modal
  }
}
