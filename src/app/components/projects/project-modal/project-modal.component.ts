import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
  doc,
  setDoc,
  CollectionReference,
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
      const projectsCollection = collection(this.firestore, 'projects'); // Colección de proyectos

      try {
        const creationTimestamp = Timestamp.now(); // Fecha y hora actuales

        // Crear el proyecto en Firestore
        const docRef = await addDoc(projectsCollection, {
          name: this.projectName,
          createdAt: creationTimestamp,
        });

        console.log('Proyecto agregado:', {
          name: this.projectName,
          createdAt: creationTimestamp.toDate(),
        });

        // Crear las subcolecciones dentro del proyecto creado
        await this.createInitialSubcollections(docRef.id, creationTimestamp);

        // Emitir eventos y limpiar el formulario
        this.resetForm();
        this.projectAdded.emit();
        this.closeModal.emit();
      } catch (error) {
        console.error('Error al agregar proyecto:', error);
      }
    }
  }

  // Función para crear las subcolecciones iniciales
  private async createInitialSubcollections(
    projectId: string,
    timestamp: Timestamp
  ) {
    try {
      // Crear las subcolecciones básicas (tasks, details)
      const basicSubcollections = ['tasks', 'details'];
      for (const subcollection of basicSubcollections) {
        const subcollectionRef = collection(
          this.firestore,
          `projects/${projectId}/${subcollection}`
        );
        await addDoc(subcollectionRef, {
          message: `Elemento inicial de ${subcollection}`,
          createdAt: timestamp,
        });
      }

      // Crear el documento intermedio 'members' dentro de 'team'
      const membersDocRef = doc(
        this.firestore,
        `projects/${projectId}/team/members`
      );
      await setDoc(membersDocRef, {
        name: 'Información del equipo',
        createdAt: timestamp,
      });

      // Crear las subcolecciones 'employees' y 'machines' dentro de 'members'
      await this.createTeamSubcollections(projectId, timestamp);

      console.log('Subcolecciones creadas exitosamente.');
    } catch (error) {
      console.error('Error al crear subcolecciones:', error);
    }
  }

  // Crear las subcolecciones 'employees' y 'machines' dentro del documento 'members'
  private async createTeamSubcollections(
    projectId: string,
    timestamp: Timestamp
  ) {
    try {
      const employeesCollectionRef: CollectionReference = collection(
        this.firestore,
        `projects/${projectId}/team/members/employees`
      );

      const machinesCollectionRef: CollectionReference = collection(
        this.firestore,
        `projects/${projectId}/team/members/machines`
      );

      console.log('Subcolecciones employees y machines creadas exitosamente.');
    } catch (error) {
      console.error('Error al crear subcolecciones de equipo:', error);
    }
  }

  // Función para cerrar el modal y resetear el formulario
  close(): void {
    this.resetForm();
    this.closeModal.emit();
  }

  // Resetear el formulario
  private resetForm(): void {
    this.projectName = '';
  }
}
