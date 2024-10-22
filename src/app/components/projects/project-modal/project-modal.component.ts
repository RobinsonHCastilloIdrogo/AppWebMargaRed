import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-project-modal',
  templateUrl: './project-modal.component.html',
  standalone: true,
  imports: [FormsModule],
  styleUrls: ['./project-modal.component.css'],
})
export class ProjectModalComponent {
  projectName: string = ''; // Nombre del proyecto

  @Output() projectAdded = new EventEmitter<void>(); // Notificación de proyecto agregado
  @Output() closeModal = new EventEmitter<void>(); // Notificación para cerrar el modal

  constructor(private firestore: Firestore) {}

  // Función para agregar un proyecto
  async addProject(): Promise<void> {
    if (this.projectName.trim()) {
      const projectsCollection = collection(this.firestore, 'projects'); // Colección de Firebase

      try {
        const creationTimestamp = Timestamp.now(); // Obtener la fecha y hora actual

        // Guardar el proyecto en Firebase
        await addDoc(projectsCollection, {
          name: this.projectName,
          createdAt: creationTimestamp,
        });

        console.log('Proyecto agregado:', {
          name: this.projectName,
          createdAt: creationTimestamp.toDate(),
        });

        this.resetForm(); // Limpiar el input
        this.projectAdded.emit(); // Emitir evento para notificar al padre
        this.closeModal.emit(); // Emitir evento para cerrar el modal
      } catch (error) {
        console.error('Error al agregar proyecto:', error);
      }
    }
  }

  // Función para cerrar el modal y limpiar el input
  close(): void {
    this.resetForm();
    this.closeModal.emit();
  }

  // Función para limpiar el formulario
  private resetForm(): void {
    this.projectName = '';
  }
}
