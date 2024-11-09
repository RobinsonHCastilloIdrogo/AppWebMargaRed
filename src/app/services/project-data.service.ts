import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  collection,
  addDoc,
  setDoc, // Asegúrate de importar setDoc para la función addDetailToProject
  getDocs,
  deleteDoc,
  DocumentData,
  QuerySnapshot,
  where,
  query,
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

  // Obtener empleados asignados a un proyecto
  async getAssignedEmployees(
    projectId: string
  ): Promise<QuerySnapshot<DocumentData>> {
    const employeesCollection = collection(
      this.firestore,
      `projects/${projectId}/team/employees`
    );
    return await getDocs(employeesCollection);
  }

  // Obtener máquinas asignadas a un proyecto
  async getAssignedMachines(
    projectId: string
  ): Promise<QuerySnapshot<DocumentData>> {
    const machinesCollection = collection(
      this.firestore,
      `projects/${projectId}/team/machines`
    );
    return await getDocs(machinesCollection);
  }

  // Añadir un empleado a un proyecto
  async addEmployeeToProject(
    projectId: string,
    employeeData: any
  ): Promise<DocumentData> {
    const employeesCollection = collection(
      this.firestore,
      `projects/${projectId}/team/employees`
    );
    const docRef = await addDoc(employeesCollection, employeeData);
    return { ...employeeData, id: docRef.id };
  }

  // Añadir una máquina a un proyecto
  async addMachineToProject(
    projectId: string,
    machineData: any
  ): Promise<DocumentData> {
    const machinesCollection = collection(
      this.firestore,
      `projects/${projectId}/team/machines`
    );
    const docRef = await addDoc(machinesCollection, machineData);
    return { ...machineData, id: docRef.id };
  }

  // Obtener cualquier colección desde Firestore
  async getCollection(path: string): Promise<QuerySnapshot<DocumentData>> {
    return await getDocs(collection(this.firestore, path));
  }

  // Servicio para añadir un documento a una colección
  async addDocumentToCollection(path: string, data: any) {
    const docRef = doc(this.firestore, path); // Crear referencia de documento
    await setDoc(docRef, data); // Añadir el documento con los datos
  }
}
