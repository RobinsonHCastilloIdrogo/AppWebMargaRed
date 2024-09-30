import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CommonModule } from '@angular/common';

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

  name: string = '';
  quantity: number = 0;

  constructor(private firestore: AngularFirestore) {}

  handleAddMachine() {
    if (this.quantity <= 0) {
      alert('Por favor, ingresa una cantidad válida.');
      return;
    }

    this.firestore
      .collection('machines')
      .add({
        name: this.name,
        quantity: this.quantity,
        status: 'Disponible',
      })
      .then(() => {
        alert('Maquinaria agregada');
        this.resetForm();
        this.close.emit();
      })
      .catch((error) => {
        console.error('Error al agregar maquinaria: ', error);
      });
  }

  resetForm() {
    this.name = '';
    this.quantity = 0;
  }

  closeModal() {
    this.close.emit();
  }
}
