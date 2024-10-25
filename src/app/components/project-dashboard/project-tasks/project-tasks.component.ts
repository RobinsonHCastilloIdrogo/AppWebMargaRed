import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { FormsModule, NgModel } from '@angular/forms';
import { getDocs } from '@firebase/firestore';

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

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.loadTasks();
  }

  // Cargar tareas desde Firestore
  async loadTasks() {
    const tasksCollection = collection(this.firestore, 'tasks');
    const snapshot = await getDocs(tasksCollection);

    this.tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];
  }

  // Agregar una nueva tarea
  async addTask() {
    if (this.newTask.trim() === '') return;

    const newTask: Partial<Task> = { name: this.newTask, completed: false };
    const tasksCollection = collection(this.firestore, 'tasks');

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
    if (updatedName && updatedName.trim() !== '') {
      const taskDocRef = doc(this.firestore, `tasks/${task.id}`);
      await updateDoc(taskDocRef, { name: updatedName });
      task.name = updatedName; // Actualizar la tarea en el frontend
    }
  }

  // Eliminar tarea
  async deleteTask(taskId: string) {
    try {
      const taskDocRef = doc(this.firestore, `tasks/${taskId}`);
      await deleteDoc(taskDocRef);
      this.tasks = this.tasks.filter((task) => task.id !== taskId); // Eliminar del frontend
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
    }
  }

  // Marcar o desmarcar como completada
  async toggleCompletion(task: Task) {
    const taskDocRef = doc(this.firestore, `tasks/${task.id}`);
    await updateDoc(taskDocRef, { completed: task.completed });
  }
}
