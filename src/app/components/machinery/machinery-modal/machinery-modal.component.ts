import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore'; // Importar Firestore

@Component({
  selector: 'app-machinery-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './machinery-modal.component.html',
  styleUrls: ['./machinery-modal.component.css'],
})
export class MachineryModalComponent {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  name: string = ''; // Nombre de la maquinaria
  quantity: number = 0; // Cantidad de la maquinaria

  constructor(private firestore: Firestore) {}

  // Función para agregar maquinaria a Firestore
  addMachine() {
    const machinesCollection = collection(this.firestore, 'machines'); // Referencia a la colección 'machines'

    // Crear una nueva maquinaria
    const newMachine = {
      name: this.name,
      quantity: this.quantity,
      status: 'Disponible', // Estado por defecto
    };

    // Agregar la maquinaria a Firestore
    addDoc(machinesCollection, newMachine)
      .then(() => {
        console.log('Maquinaria agregada a Firestore:', newMachine);
        this.closeModal(); // Emitir el evento para cerrar el modal después de agregar la maquinaria
      })
      .catch((err) => {
        console.error('Error al agregar maquinaria:', err);
      });
  }

  // Función para cerrar el modal
  closeModal() {
    this.close.emit(); // Emitir evento para que el padre cierre el modal
  }
}
