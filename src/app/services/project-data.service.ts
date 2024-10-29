import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  DocumentData,
  QuerySnapshot,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ProjectDataService {
  constructor(private firestore: Firestore) {}

  // Añadir o actualizar un detalle a un proyecto específico
  async addDetailToProject(projectId: string, detailData: any): Promise<void> {
    const detailDocRef = doc(
      this.firestore,
      `projects/${projectId}/details/main`
    );
    await setDoc(detailDocRef, detailData, { merge: true });
  }

  // Añadir una tarea a un proyecto específico
  async addTaskToProject(projectId: string, taskData: any): Promise<void> {
    const tasksCollection = collection(
      this.firestore,
      `projects/${projectId}/tasks`
    );
    await addDoc(tasksCollection, taskData);
  }

  // Añadir un miembro del equipo a un proyecto específico
  async addTeamMemberToProject(
    projectId: string,
    teamData: any
  ): Promise<void> {
    const teamCollection = collection(
      this.firestore,
      `projects/${projectId}/team`
    );
    await addDoc(teamCollection, teamData);
  }

  // Obtener todos los miembros del equipo de un proyecto específico
  async getTeamMembers(
    projectId: string
  ): Promise<QuerySnapshot<DocumentData>> {
    const teamCollection = collection(
      this.firestore,
      `projects/${projectId}/team`
    );
    return await getDocs(teamCollection);
  }

  // Eliminar un miembro del equipo por su ID de empleado
  async deleteTeamMember(
    projectId: string,
    employeeId: string
  ): Promise<boolean> {
    try {
      const teamCollection = collection(
        this.firestore,
        `projects/${projectId}/team`
      );
      const q = query(teamCollection, where('employeeId', '==', employeeId));
      const querySnapshot = await getDocs(q);

      for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(docSnapshot.ref); // Eliminar el documento encontrado
      }

      return true;
    } catch (error) {
      console.error('Error al eliminar el miembro del equipo:', error);
      return false;
    }
  }

  // Obtener cualquier colección desde Firestore
  async getCollection(path: string): Promise<QuerySnapshot<DocumentData>> {
    return await getDocs(collection(this.firestore, path));
  }
}
