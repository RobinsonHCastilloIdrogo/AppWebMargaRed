import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-machinery-modal',
  templateUrl: './machinery-modal.component.html',
  standalone: true,
  imports: [FormsModule, NgIf],
  styleUrls: ['./machinery-modal.component.css'],
})
export class MachineryModalComponent {
  @Input() machinery: any = {
    id: '',
    name: '',
    quantity: 0,
    status: 'Disponible',
  }; // Datos de la maquinaria seleccionada
  @Output() machineryAdded = new EventEmitter<void>(); // Evento para notificar que se agregó o editó maquinaria
  @Output() closeModal = new EventEmitter<void>(); // Evento para cerrar el modal

  constructor(private firestore: Firestore) {}

  // Guardar maquinaria (agregar o editar)
  async saveMachinery(): Promise<void> {
    if (this.isValidInput()) {
      try {
        if (this.machinery.id) {
          // Editar maquinaria existente
          const machineryDocRef = doc(
            this.firestore,
            `machines/${this.machinery.id}`
          );
          await updateDoc(machineryDocRef, {
            name: this.machinery.name,
            quantity: this.machinery.quantity,
          });
          console.log(`✅ Maquinaria con ID ${this.machinery.id} actualizada.`);
        } else {
          // Agregar nueva maquinaria
          const machineryCollection = collection(this.firestore, 'machines');
          const creationTimestamp = Timestamp.now();

          await addDoc(machineryCollection, {
            name: this.machinery.name,
            quantity: this.machinery.quantity,
            status: 'Disponible',
            createdAt: creationTimestamp,
          });

          console.log('✅ Nueva maquinaria agregada:', {
            name: this.machinery.name,
            quantity: this.machinery.quantity,
            createdAt: creationTimestamp.toDate(),
          });
        }

        this.resetForm();
        this.machineryAdded.emit(); // Notificar al padre
        this.closeModal.emit(); // Cerrar el modal
      } catch (error) {
        console.error('❌ Error al guardar maquinaria:', error);
      }
    } else {
      console.error('❌ Entrada inválida: Completa los campos correctamente.');
    }
  }

  // Validar que los campos no estén vacíos
  isValidInput(): boolean {
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
}
