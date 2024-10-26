import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from '@angular/fire/firestore';
import { Chart, registerables } from 'chart.js';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  imports: [SharedDashboardComponent, NgIf, NgFor, DatePipe, FormsModule],
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  employeesCount: number = 0;
  machinesCount: number = 0;
  projectsCount: number = 0;
  events: {
    id: string;
    name: string;
    date: Date;
    horaInicio: string;
    horaFin: string;
  }[] = [];
  chart: any;
  lineChart: any;
  showLogoutModal: boolean = false;

  resources: string[] = []; // Para almacenar los nombres de los proyectos
  selectedResource: string = ''; // Para el proyecto seleccionado

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.getCounts();
    await this.loadEvents();
    await this.loadProjects();
    this.createChart();
    this.createLineChart();
  }

  async getCounts() {
    const employeesCollection = collection(this.firestore, '/employees');
    const machinesCollection = collection(this.firestore, '/machines');
    const projectsCollection = collection(this.firestore, '/projects');

    const employeesSnapshot = await getDocs(employeesCollection);
    const machinesSnapshot = await getDocs(machinesCollection);
    const projectsSnapshot = await getDocs(projectsCollection);

    this.employeesCount = employeesSnapshot.size;
    this.projectsCount = projectsSnapshot.size;
    this.machinesCount = 0;
    machinesSnapshot.forEach((doc) => {
      const machineData = doc.data();
      this.machinesCount += machineData['quantity'];
    });
  }

  async loadEvents() {
    try {
      const eventsCollection = collection(this.firestore, '/assignments');
      const eventsSnapshot = await getDocs(eventsCollection);

      this.events = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data()['nombreEvento'] ?? 'Evento sin nombre',
        date: new Date(doc.data()['date']),
        horaInicio: doc.data()['horaInicio'] ?? '00:00',
        horaFin: doc.data()['horaFin'] ?? '00:00',
      }));

      console.log('Eventos cargados:', this.events);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  }

  async loadProjects() {
    try {
      const projectsCollection = collection(this.firestore, '/projects');
      const projectsSnapshot = await getDocs(projectsCollection);
      this.resources = projectsSnapshot.docs.map((doc) => doc.data()['name'] ?? 'Proyecto sin nombre');
      console.log('Proyectos cargados:', this.resources);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  }

  async deleteEvent(eventId: string) {
    try {
      await deleteDoc(doc(this.firestore, `assignments/${eventId}`));
      console.log(`Evento ${eventId} eliminado`);
      this.events = this.events.filter((event) => event.id !== eventId);
    } catch (error) {
      console.error('Error al eliminar evento:', error);
    }
  }

  viewEvent(eventId: string) {
    console.log(`Visualizando evento con ID: ${eventId}`);
  }

  openLogoutModal() {
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  logout() {
    this.closeLogoutModal();
    console.log('Cierre de sesión exitoso');
  }

  createChart() {
    const ctx = document.getElementById('myPieChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Empleados', 'Máquinas'],
        datasets: [
          {
            label: 'Cantidad',
            data: [this.employeesCount, this.machinesCount],
            backgroundColor: ['rgba(0, 123, 255, 0.8)', 'rgba(255, 0, 0, 0.8)'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Cantidad de Empleados y Máquinas' },
        },
      },
    });
  }

  createLineChart() {
    const ctx = document.getElementById('myLineChart') as HTMLCanvasElement;
    const labels = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const data = [300, 400, 250, 500, 450, 600, 700, 800, 650, 900, 750, 1000];

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Litros de Combustible',
            data: data,
            backgroundColor: 'rgba(0, 123, 255, 0.2)',
            borderColor: 'rgba(0, 123, 255, 1)',
            borderWidth: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: 'Consumo de Combustible a lo Largo del Tiempo',
          },
        },
        scales: {
          y: { beginAtZero: true },
          x: { beginAtZero: true },
        },
      },
    });
  }
  onResourceChange() {
    console.log('Proyecto seleccionado:', this.selectedResource);
    // Aquí puedes agregar la lógica que necesites al cambiar el proyecto seleccionado
  }
}