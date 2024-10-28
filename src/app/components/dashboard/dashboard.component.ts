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
  monthlyFuelData: number[] = new Array(12).fill(0); // Inicializa con 0 para 12 meses

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.getCounts();
    await this.loadEvents();
    await this.loadProjects();
    await this.loadMonthlyFuelTotals(); // Cargar datos de combustible mensual
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
      this.resources = projectsSnapshot.docs.map(
        (doc) => doc.data()['name'] ?? 'Proyecto sin nombre'
      );
      console.log('Proyectos cargados:', this.resources);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  }

  async loadMonthlyFuelTotals() {
    try {
      const monthlyFuelCollection = collection(
        this.firestore,
        'monthlyFuelTotals'
      );
      const monthlyFuelSnapshot = await getDocs(monthlyFuelCollection);

      monthlyFuelSnapshot.forEach((doc) => {
        const month = doc.id; // Nombre del mes, ej: 'octubre'
        const totalFuel = doc.data()['totalFuel'] ?? 0; // Obtén el total de combustible

        // Mapeo de meses a índices de arreglo
        const monthIndex = this.getMonthIndex(month);
        if (monthIndex !== -1) {
          this.monthlyFuelData[monthIndex] = totalFuel; // Asigna el total al índice correspondiente
        }
      });

      console.log('Datos de combustible mensual:', this.monthlyFuelData);
    } catch (error) {
      console.error('Error al cargar los totales de combustible:', error);
    }
  }

  getMonthIndex(month: string): number {
    const monthMapping: { [key: string]: number } = {
      enero: 0,
      febrero: 1,
      marzo: 2,
      abril: 3,
      mayo: 4,
      junio: 5,
      julio: 6,
      agosto: 7,
      septiembre: 8,
      octubre: 9,
      noviembre: 10,
      diciembre: 11,
    };
    return monthMapping[month.toLowerCase()] ?? -1; // Retorna -1 si no se encuentra el mes
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

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Litros de Combustible',
            data: this.monthlyFuelData,
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
