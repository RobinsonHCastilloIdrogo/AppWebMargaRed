import { Injectable } from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  docData,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  constructor(private firestore: Firestore) {}

  // Obtener datos de una colección en tiempo real
  getData(collectionName: string): Observable<any[]> {
    const collectionRef = collection(this.firestore, collectionName);
    return collectionData(collectionRef, { idField: 'id' });
  }

  // Obtener un documento específico por su ID
  getDocument(collectionName: string, docId: string): Observable<any> {
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return docData(docRef, { idField: 'id' });
  }

  // Agregar un nuevo documento a una colección
  addData(collectionName: string, data: any) {
    const collectionRef = collection(this.firestore, collectionName);
    return addDoc(collectionRef, data);
  }

  // Actualizar un documento existente
  updateData(collectionName: string, docId: string, data: any) {
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return updateDoc(docRef, data);
  }

  // Eliminar un documento
  deleteData(collectionName: string, docId: string) {
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return deleteDoc(docRef);
  }

  // Obtener empleados desde la colección 'employees'
  getEmployees(): Observable<any[]> {
    const employeesCollection = collection(this.firestore, 'employees');
    return collectionData(employeesCollection, { idField: 'id' }); // Incluyendo el 'id'
  }

  // Obtener máquinas desde la colección 'machines'
  getMachines(): Observable<any[]> {
    const machinesCollection = collection(this.firestore, 'machines');
    return collectionData(machinesCollection, { idField: 'id' });
  }

  addEmployee(employee: any) {
    const employeesCollection = collection(this.firestore, 'employees');
    return addDoc(employeesCollection, employee); // El 'id' será generado automáticamente
  }
}
