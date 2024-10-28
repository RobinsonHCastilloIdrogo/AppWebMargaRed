import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
} from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Task {
  id: string;
  name: string;
  completed: boolean;
}

@Component({
  selector: 'app-project-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-tasks.component.html',
  styleUrls: ['./project-tasks.component.css'],
})
export class ProjectTasksComponent implements OnInit {
  tasks: Task[] = [];
  newTask: string = '';
  projectId: string | null = null;

  // Para el modal de edición
  editingTask: Task | null = null;

  constructor(private firestore: Firestore, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.projectId = params.get('id');
      if (this.projectId) {
        this.loadTasks();
      } else {
        console.error('No se encontró el ID del proyecto.');
      }
    });
  }

  // Cargar tareas desde la subcolección del proyecto en Firestore
  async loadTasks() {
    if (!this.projectId) return;

    const tasksCollection = collection(
      this.firestore,
      `projects/${this.projectId}/tasks`
    );
    const snapshot = await getDocs(tasksCollection);

    this.tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];
  }

  // Agregar una nueva tarea al proyecto
  async addTask() {
    if (this.newTask.trim() === '' || !this.projectId) return;

    const newTask: Partial<Task> = { name: this.newTask, completed: false };
    const tasksCollection = collection(
      this.firestore,
      `projects/${this.projectId}/tasks`
    );

    try {
      const docRef = await addDoc(tasksCollection, newTask);
      this.tasks.push({ id: docRef.id, ...newTask } as Task);
      this.newTask = ''; // Limpiar el input
    } catch (error) {
      console.error('Error al agregar tarea:', error);
    }
  }

  // Abrir modal de edición de tarea
  openEditModal(task: Task) {
    this.editingTask = { ...task };
  }

  // Cerrar modal de edición
  closeEditModal() {
    this.editingTask = null;
  }

  // Guardar cambios de la tarea editada
  async saveEdit() {
    if (!this.projectId || !this.editingTask) return;

    const taskDocRef = doc(
      this.firestore,
      `projects/${this.projectId}/tasks/${this.editingTask.id}`
    );

    try {
      await updateDoc(taskDocRef, { name: this.editingTask.name });
      const index = this.tasks.findIndex(
        (task) => task.id === this.editingTask!.id
      );
      if (index !== -1) {
        this.tasks[index] = { ...this.editingTask };
      }
      this.closeEditModal(); // Cerrar el modal después de guardar
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
    }
  }

  // Eliminar tarea del proyecto
  async deleteTask(taskId: string) {
    if (!this.projectId) return;

    try {
      const taskDocRef = doc(
        this.firestore,
        `projects/${this.projectId}/tasks/${taskId}`
      );
      await deleteDoc(taskDocRef);
      this.tasks = this.tasks.filter((task) => task.id !== taskId); // Eliminar del frontend
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
    }
  }

  // Marcar o desmarcar como completada
  async toggleCompletion(task: Task) {
    if (!this.projectId) return;

    const taskDocRef = doc(
      this.firestore,
      `projects/${this.projectId}/tasks/${task.id}`
    );

    try {
      await updateDoc(taskDocRef, { completed: task.completed });
    } catch (error) {
      console.error('Error al actualizar el estado de la tarea:', error);
    }
  }
}
