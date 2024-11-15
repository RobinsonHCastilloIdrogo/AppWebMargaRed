import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import {
  Firestore,
  collection,
  setDoc,
  doc,
  getDoc,
} from '@angular/fire/firestore';
import { Machine, MachineryData } from '../../../models/machine.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-machinery-modal',
  templateUrl: './machinery-modal.component.html',
  standalone: true,
  imports: [FormsModule, NgIf],
  styleUrls: ['./machinery-modal.component.css'],
})
export class MachineryModalComponent implements OnInit {
  @Input() machinery: any = {
    id: '',
    name: '',
    quantity: 0,
    status: 'Disponible',
  }; // Datos de la maquinaria seleccionada
  @Output() machineryAdded = new EventEmitter<void>(); // Evento para notificar que se agregó o editó maquinaria
  @Output() closeModal = new EventEmitter<void>(); // Evento para cerrar el modal

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    if (!this.machinery) {
      this.machinery = { id: '', name: '', quantity: 0, status: 'Disponible' };
    }
    console.log('Machinery input:', this.machinery); // Debugging
  }

  // Método para asegurar que solo se ingresen letras en el campo 'name'
  onNameKeydown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', ' ']; // Permitir teclas especiales y espacios
    if (!/^[a-zA-ZÀ-ÿ]$/.test(event.key) && !allowedKeys.includes(event.key)) {
      event.preventDefault(); // Bloquea cualquier tecla que no sea una letra o un espacio
    }
  }

  // Guardar maquinaria (agregar o editar)
  async saveMachinery(): Promise<void> {
    if (this.isValidInput()) {
      try {
        const machineryCollection = collection(this.firestore, 'machines');
        const machineryDocRef = doc(machineryCollection, this.machinery.name); // Usa el nombre como ID

        const existingDataSnapshot = await getDoc(machineryDocRef);
        let existingData: MachineryData;
        let isEditMode = !!this.machinery.id; // Modo de edición si existe ID

        if (existingDataSnapshot.exists()) {
          existingData = existingDataSnapshot.data() as MachineryData;

          if (isEditMode) {
            // Editar: Actualiza la cantidad
            existingData.quantity = this.machinery.quantity;
          } else {
            // Agregar: Sumar la cantidad existente con la nueva
            existingData.quantity += this.machinery.quantity;
          }

          // Actualizar el array de máquinas con la cantidad adecuada
          const machines: Machine[] = Array.from(
            { length: existingData.quantity },
            (_, index) => ({
              id: this.generateMachineryCode(this.machinery.name, index + 1),
              name: this.machinery.name,
              quantity: 1,
              status: 'Disponible',
            })
          );

          existingData.machines = machines; // Reemplazar el array de máquinas
        } else {
          // Si no existe, inicializarlo
          const machines: Machine[] = Array.from(
            { length: this.machinery.quantity },
            (_, index) => ({
              id: this.generateMachineryCode(this.machinery.name, index + 1),
              name: this.machinery.name,
              quantity: 1,
              status: 'Disponible',
            })
          );

          existingData = {
            id: this.machinery.name,
            name: this.machinery.name,
            quantity: this.machinery.quantity,
            status: 'Disponible',
            machines: machines,
          };
        }

        await setDoc(machineryDocRef, existingData); // Guardar los datos

        // Confirmación de que la maquinaria fue agregada o editada
        Swal.fire({
          title: '¡Éxito!',
          text: isEditMode ? 'La maquinaria ha sido editada correctamente.' : 'La maquinaria ha sido agregada correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        });

        console.log('✅ Maquinaria guardada con éxito:', existingData);
        this.resetForm();
        this.machineryAdded.emit();
        this.closeModal.emit();
      } catch (error) {
        console.error('❌ Error al guardar maquinaria:', error);
      }
    } else {
      console.error('❌ Entrada inválida: Completa los campos correctamente.');
    }
  }

  // Validar que los campos no estén vacíos
  isValidInput(): boolean {
    console.log('Validating input:', this.machinery); // Debugging
    return this.machinery.name.trim() !== '' && this.machinery.quantity > 0;
  }

  // Cerrar el modal y limpiar el formulario
  close(): void {
    this.resetForm();
    this.closeModal.emit();
  }

  // Limpiar el formulario
  private resetForm(): void {
    this.machinery = { id: '', name: '', quantity: 0, status: 'Disponible' };
  }

  // Función para generar un código único para la maquinaria
  private generateMachineryCode(name: string, index: number): string {
    const categoryCode = name.substring(0, 3).toUpperCase(); // Toma las primeras 3 letras del nombre como código de categoría
    const numericId = index; // Usar el índice para el número secuencial
    return `${categoryCode}-${String(numericId).padStart(4, '0')}`; // Retorna el código con la categoría
  }
}
