import { Injectable } from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  addDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  docData,
  DocumentData,
} from '@angular/fire/firestore';
import { getDoc, getDocs } from 'firebase/firestore';
import { Observable, from, Subject, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private nuevoEventoSubject = new Subject<any>(); // Nuevo Subject para emitir eventos
  afs: any;

  constructor(private firestore: Firestore) {}

  // Obtener el nombre dinámico del documento según el mes y año actuales (YYYY-MM)
  private obtenerNombreDocumento(): string {
    const fechaActual = new Date();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0'); // Asegura que siempre sea 2 dígitos
    const año = fechaActual.getFullYear();
    return `${año}-${mes}`; // Formato: YYYY-MM
  }

  // Obtener un documento específico por su ID utilizando Promesas (versión RxJS 6)
  getDocumentAsPromise(collectionName: string, docId: string): Promise<any> {
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return docData(docRef, { idField: 'id' }).toPromise();
  }

  // Agregar un evento en la subcolección dinámica
  addEvento(evento: any): Promise<void> {
    const documentName = this.obtenerNombreDocumento(); // Documento del mes actual
    const eventoData = {
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fechaInicio: evento.fechaInicio, // Nueva fecha de inicio
      fechaFin: evento.fechaFin, // Nueva fecha de finalización
      fecha: evento.fecha,
      cantidadEmpleados: evento.empleados.length,
      empleados: evento.empleados.map((emp: any) => ({
        nombre: emp.nombre,
        rol: emp.rol,
        horaInicio: emp.horaInicio,
        horaFin: emp.horaFin,
      })),
    };

    return addDoc(
      collection(this.firestore, `assignments/${documentName}/events`),
      eventoData
    ).then((docRef) => {
      this.emitirEvento({ id: docRef.id, ...eventoData });
    });
  }

  getEventDetails(documentName: string, eventId: string): Observable<any> {
    return this.afs
      .collection('assignments')
      .doc(documentName)
      .collection('events')
      .doc(eventId)
      .valueChanges();
  }

  getEventById(eventId: string): Observable<any> {
    const documentName = this.obtenerNombreDocumento(); // O ajusta este método si es necesario
    const eventPath = `assignments/${documentName}/events/${eventId}`;
    return docData(doc(this.firestore, eventPath), { idField: 'id' });
  }

  addEventoConId(evento: any, eventId: string): Promise<void> {
    const documentName = this.obtenerNombreDocumento(); // Documento del mes actual
    const eventoData = {
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fechaInicio: evento.fechaInicio, // Nueva fecha de inicio
      fechaFin: evento.fechaFin, // Nueva fecha de finalización
      fecha: evento.fecha,
      cantidadEmpleados: evento.empleados.length,
      empleados: evento.empleados.map((emp: any) => ({
        nombre: emp.nombre,
        rol: emp.rol,
        horaInicio: emp.horaInicio,
        horaFin: emp.horaFin,
        maquina: emp.maquina, // Incluye la máquina aquí (debe existir en `emp`)
      })),
    };

    // Utiliza `setDoc` para agregar el evento con un ID específico
    const eventoDocRef = doc(
      this.firestore,
      `assignments/${documentName}/events/${eventId}`
    );

    return setDoc(eventoDocRef, eventoData)
      .then(() => {
        this.emitirEvento({ id: eventId, ...eventoData });
      })
      .catch((error) => {
        console.error('Error al agregar evento:', error);
        throw error;
      });
  }

  // Nuevo método: Agregar un proyecto usando un ID específico
  addProyectoConId(proyecto: any, proyectoId: string): Promise<void> {
    const documentName = this.obtenerNombreDocumento(); // Documento del mes actual
    const proyectoData = {
      proyectoId: proyecto.proyectoId,
      nombreProyecto: proyecto.nombreProyecto,
      descripcion: proyecto.descripcion,
      fechaInicio: proyecto.fechaInicio, // Nueva fecha de inicio
      fechaFin: proyecto.fechaFin, // Nueva fecha de finalización
      fecha: proyecto.fecha,
      cantidadEmpleados: proyecto.empleados.length,
      empleados: proyecto.empleados.map((emp: any) => ({
        nombre: emp.nombre,
        rol: emp.rol,
        horaInicio: emp.horaInicio,
        horaFin: emp.horaFin,
        maquina: emp.maquina
          ? { id: emp.maquina.id, nombre: emp.maquina.nombre }
          : null, // Añadir info de la máquina
      })),
    };

    // Utiliza `setDoc` para agregar el proyecto con un ID específico en assignments
    const proyectoDocRef = doc(
      this.firestore,
      `assignments/${documentName}/projects/${proyectoId}`
    );

    return setDoc(proyectoDocRef, proyectoData)
      .then(() => {
        this.emitirEvento({ id: proyectoId, ...proyectoData });

        // Después de agregar el proyecto, guarda los detalles del proyecto en la subcolección 'details'
        const detailsDocRef = doc(
          this.firestore,
          `projects/${proyectoId}/details/${proyectoId}`
        );

        const detailsData = {
          nombreProyecto: proyecto.nombreProyecto,
          descripcion: proyecto.descripcion,
          fechaInicio: proyecto.fechaInicio,
          fechaFin: proyecto.fechaFin,
          createdAt: new Date(), // Agrega la fecha de creación
        };

        // Guardar los detalles en la subcolección 'details'
        return setDoc(detailsDocRef, detailsData, { merge: true });
      })
      .then(() => {
        // Después de guardar los detalles, guarda los miembros del equipo en la subcolección 'team'
        const teamCollectionRef = collection(
          this.firestore,
          `projects/${proyectoId}/team`
        );

        const teamPromises = proyecto.empleados.map((emp: any) => {
          const teamMemberData = {
            nombre: emp.nombre,
            rol: emp.rol,
            horaInicio: emp.horaInicio,
            horaFin: emp.horaFin,
            maquina: emp.maquina
              ? { id: emp.maquina.id, nombre: emp.maquina.nombre }
              : null, // Añadir info de la máquina
          };
          return addDoc(teamCollectionRef, teamMemberData);
        });

        return Promise.all(teamPromises).then(() => {});
      })
      .catch((error) => {
        console.error(
          'Error al agregar proyecto, detalles y miembros del equipo:',
          error
        );
        throw error;
      });
  }

  // Observable para nuevos eventos del calendario
  get nuevoEvento$(): Observable<any> {
    return this.nuevoEventoSubject.asObservable();
  }

  // Emitir un nuevo evento
  emitirEvento(event: any) {
    this.nuevoEventoSubject.next(event);
  }

  // Obtener empleados desde la colección 'employees'
  getEmployees(): Observable<any[]> {
    const employeesCollection = collection(this.firestore, 'employees');
    return collectionData(employeesCollection, { idField: 'id' });
  }

  // Obtener máquinas desde la colección 'machines'
  getMachines(): Observable<any[]> {
    const machinesCollection = collection(this.firestore, 'machines');
    return collectionData(machinesCollection, { idField: 'id' });
  }

  getEmployeeName(id: string): Promise<string> {
    return this.getDocumentAsPromise('employees', id).then(
      (data) => data?.name || 'Unknown employee'
    );
  }

  getMachineName(id: string): Promise<string> {
    return this.getDocumentAsPromise('machines', id).then(
      (data) => data?.name || 'Unknown machine'
    );
  }

  // Obtener proyectos desde la colección 'projects'
  getProjects(): Observable<{ id: string; name: string }[]> {
    const projectsCollection = collection(this.firestore, 'projects');

    return collectionData(projectsCollection, { idField: 'id' }).pipe(
      map((projects: any[]) =>
        projects.map((project) => ({
          id: project.id,
          name: project.name || 'No Name', // Manejo seguro del campo 'name'
        }))
      ),
      catchError((error) => {
        console.error('Error loading projects:', error);
        return []; // Retornar un array vacío en caso de error
      })
    );
  }

  // Obtener todas las asignaciones de eventos y proyectos por mes
  getAssignments(documentName: string): Observable<any[]> {
    console.log('Cargando asignaciones desde el documento:', documentName);

    const docRef = doc(this.firestore, `assignments/${documentName}`);

    const eventsCollection = collection(docRef, 'events');
    const projectsCollection = collection(docRef, 'projects');

    const events$ = collectionData(eventsCollection, { idField: 'id' });
    const projects$ = collectionData(projectsCollection, { idField: 'id' });

    return from(
      Promise.all([
        firstValueFrom(events$ as Observable<any[]>),
        firstValueFrom(projects$ as Observable<any[]>),
      ])
    ).pipe(
      map(([events, projects]) => {
        console.log('Eventos:', events);
        console.log('Proyectos:', projects);
        return [
          ...events.map((event: any) => ({
            id: event.id,
            title: event.nombre || event.descripcion || 'Sin título',
            start: event.fechaInicio, // Usar fechaInicio para obtener el inicio del evento
            end: event.fechaFin, // Nueva fecha de finalización para el evento
            type: 'event',
          })),
          ...projects.map((project: any) => ({
            id: project.id,
            title:
              project.nombreProyecto || project.descripcion || 'Sin título',
            start: project.fechaInicio, // Usar fechaInicio para obtener el inicio del proyecto
            end: project.fechaFin, // Nueva fecha de finalización para el proyecto
            type: 'project',
          })),
        ];
      }),
      catchError((error) => {
        console.error('Error al cargar asignaciones:', error);
        return [];
      })
    );
  }

  // Obtener combustible asignado de una máquina específica
  async getFuelAssignment(machineId: string): Promise<any> {
    const fuelDocRef = doc(this.firestore, `machineFuelTotals/${machineId}`);
    const fuelDoc = await getDoc(fuelDocRef);
    return fuelDoc.exists() ? fuelDoc.data() : null;
  }

  getAllAssignments(): Observable<
    { nombre: string; fecha: string; horaInicio: string; horaFin: string }[]
  > {
    const projectsPath = '/assignments/2024-11/projects';
    return this.getCollection(projectsPath).pipe(
      map((projects) => {
        // Declara explícitamente el tipo de la variable 'eventos'
        const eventos: {
          nombre: string;
          fecha: string;
          horaInicio: string;
          horaFin: string;
        }[] = [];

        projects.forEach((project: any) => {
          const empleados = project.empleados || [];
          const fechaInicio = new Date(project.fechaInicio); // Convertir a fecha
          const fechaFin = new Date(project.fechaFin); // Convertir a fecha

          // Iterar por cada día en el rango de fechas
          for (
            let fecha = fechaInicio;
            fecha <= fechaFin;
            fecha.setDate(fecha.getDate() + 1)
          ) {
            empleados.forEach((empleado: any) => {
              eventos.push({
                nombre: empleado.nombre || 'Sin Nombre',
                fecha: new Date(fecha).toISOString().split('T')[0], // YYYY-MM-DD
                horaInicio: empleado.horaInicio || '00:00:00',
                horaFin: empleado.horaFin || '00:00:00',
              });
            });
          }
        });

        return eventos;
      }),
      catchError((error) => {
        console.error('Error al cargar las asignaciones:', error);
        return [];
      })
    );
  }

  async getAssignmentsFromDocument(
    documentId: string
  ): Promise<
    { nombre: string; fecha: string; horaInicio: string; horaFin: string }[]
  > {
    try {
      const docRef = doc(
        this.firestore,
        `/assignments/2024-11/projects/${documentId}`
      );
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const empleados = data?.['empleados'] || [];

        return empleados.map((empleado: any) => ({
          nombre: empleado.nombre || 'Sin Nombre',
          fecha: data['fecha'] || 'Sin Fecha',
          horaInicio: empleado.horaInicio || '00:00:00',
          horaFin: empleado.horaFin || '00:00:00',
        }));
      } else {
        console.error('No se encontraron datos en el documento.');
        return [];
      }
    } catch (error) {
      console.error('Error al obtener datos de Firestore:', error);
      return [];
    }
  }

  getCollection(path: string): Observable<any[]> {
    const collectionRef = collection(this.firestore, path);
    return collectionData(collectionRef, { idField: 'id' }).pipe(
      map((documents) => {
        console.log('Documentos obtenidos de:', path, documents);
        return documents;
      }),
      catchError((error) => {
        console.error('Error al obtener la colección:', error);
        return [];
      })
    );
  }

  // Método genérico para guardar un documento con ID específico
  saveDocument(
    collectionPath: string,
    docId: string,
    data: any
  ): Promise<void> {
    const docRef = doc(this.firestore, `${collectionPath}/${docId}`);
    return setDoc(docRef, data).catch((error) => {
      console.error('Error al guardar documento:', error);
      throw error;
    });
  }

  // Método para obtener un documento específico
  getDocument(path: string): Observable<any> {
    const docRef = doc(this.firestore, path);
    return docData(docRef, { idField: 'id' }).pipe(
      catchError((error) => {
        console.error('Error al obtener documento:', error);
        throw error;
      })
    );
  }
}
