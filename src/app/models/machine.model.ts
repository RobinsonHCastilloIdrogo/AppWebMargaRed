  export interface Machine {
    id: string; // Puedes usar el código único como ID
    name: string; // Nombre de la máquina
    quantity: number; // Cantidad
    status: string; // Estado
    code?: string; // Si necesitas almacenar el código también
    fuel?: number; // Cantidad de combustible, puede ser opcional
  }
  export interface MachineryData {
    id: string;
    name: string;
    quantity: number;
    status: string;
    machines: Machine[]; // Usar la interfaz Machine aquí
  }