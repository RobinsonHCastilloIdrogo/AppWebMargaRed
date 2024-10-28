import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
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

  constructor(private firestore: Firestore, private route: ActivatedRoute) {}

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id'); // Obtener el ID del proyecto
    if (this.projectId) {
      this.loadTasks();
    }
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

  // Editar tarea (abre un prompt para editar el nombre)
  async editTask(task: Task) {
    const updatedName = prompt('Editar tarea:', task.name);
    if (updatedName && updatedName.trim() !== '' && this.projectId) {
      const taskDocRef = doc(
        this.firestore,
        `projects/${this.projectId}/tasks/${task.id}`
      );
      await updateDoc(taskDocRef, { name: updatedName });
      task.name = updatedName; // Actualizar la tarea en el frontend
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
    await updateDoc(taskDocRef, { completed: task.completed });
  }

  // Método para actualizar los detalles de la tarea en Firestore
  async updateTask(
    projectId: string,
    taskId: string,
    data: any
  ): Promise<void> {
    const taskDoc = doc(
      this.firestore,
      `projects/${projectId}/tasks/${taskId}`
    );
    await setDoc(taskDoc, data, { merge: true });
    console.log('Tarea actualizada correctamente');
  }
}
