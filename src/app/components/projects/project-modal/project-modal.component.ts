import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
  doc,
  setDoc,
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
        const docRef = await addDoc(projectsCollection, {
          name: this.projectName,
          createdAt: creationTimestamp,
        });

        console.log('Proyecto agregado:', {
          name: this.projectName,
          createdAt: creationTimestamp.toDate(),
        });

        // Crear subcolecciones (tasks, details, team) dentro del proyecto creado
        await this.createInitialSubcollections(docRef.id, creationTimestamp);

        // Emitir eventos y limpiar el formulario
        this.resetForm(); // Limpiar el input
        this.projectAdded.emit(); // Emitir evento para notificar al padre
        this.closeModal.emit(); // Emitir evento para cerrar el modal
      } catch (error) {
        console.error('Error al agregar proyecto:', error);
      }
    }
  }

  // Función para crear subcolecciones iniciales (tasks, details, team)
  private async createInitialSubcollections(
    projectId: string,
    timestamp: Timestamp
  ) {
    try {
      // Crear las subcolecciones básicas (tasks, details, team)
      const subcollections = ['tasks', 'details', 'team'];
      for (const subcollection of subcollections) {
        const subcollectionRef = collection(
          this.firestore,
          `projects/${projectId}/${subcollection}`
        );
        await addDoc(subcollectionRef, {
          message: `Elemento inicial de ${subcollection}`,
          createdAt: timestamp,
        });
      }

      // Crear subcolecciones específicas para empleados y máquinas dentro de `team`
      const teamDocRef = doc(
        this.firestore,
        `projects/${projectId}/team/teamDoc`
      );
      await setDoc(teamDocRef, {
        name: 'Información del equipo',
        createdAt: timestamp,
      });

      const employeesCollectionRef = collection(
        this.firestore,
        `projects/${projectId}/team/teamDoc/employees`
      );
      const machinesCollectionRef = collection(
        this.firestore,
        `projects/${projectId}/team/teamDoc/machines`
      );

      // Añadir un elemento inicial en `employees` y `machines` subcolecciones
      await addDoc(employeesCollectionRef, {
        message: 'Empleado inicial asociado al proyecto',
        createdAt: timestamp,
      });

      await addDoc(machinesCollectionRef, {
        message: 'Máquina inicial asociada al proyecto',
        createdAt: timestamp,
      });

      console.log(
        'Subcolecciones team/employees y team/machines creadas exitosamente'
      );
    } catch (error) {
      console.error('Error al crear subcolecciones:', error);
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
