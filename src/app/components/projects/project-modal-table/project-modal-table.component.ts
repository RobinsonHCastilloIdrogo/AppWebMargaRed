import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Project } from '../../../models/projects.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-modal-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-modal-table.component.html',
  styleUrls: ['./project-modal-table.component.css'],
})
export class ProjectModalTableComponent {
  @Input() projects: Project[] = []; // Proyectos recibidos del componente padre
  @Output() closeModal = new EventEmitter<void>(); // Evento para cerrar el modal
  @Output() projectUpdated = new EventEmitter<void>(); // Emitir cambios

  editingProjectId: string | null = null; // Control de edición

  constructor(private firestore: Firestore) {}

  // Iniciar la edición de un proyecto
  startEditing(projectId: string): void {
    this.editingProjectId = projectId;
  }

  // Guardar los cambios del proyecto
  async saveChanges(project: Project): Promise<void> {
    const projectDocRef = doc(this.firestore, `projects/${project.id}`);
    try {
      await updateDoc(projectDocRef, { name: project.name });
      console.log(`Proyecto ${project.name} actualizado.`);
      this.editingProjectId = null; // Finaliza la edición
      this.projectUpdated.emit(); // Emitir evento para actualizar la lista
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
    }
  }

  // Eliminar proyecto
  async deleteProject(projectId: string): Promise<void> {
    const projectDocRef = doc(this.firestore, `projects/${projectId}`);
    try {
      await deleteDoc(projectDocRef);
      console.log(`Proyecto con ID ${projectId} eliminado.`);
      this.projectUpdated.emit(); // Emitir evento para actualizar la lista
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
    }
  }

  // Cerrar el modal
  close(): void {
    this.closeModal.emit();
  }

  // Verifica si un proyecto está en modo de edición
  isEditing(projectId: string): boolean {
    return this.editingProjectId === projectId;
  }
}
