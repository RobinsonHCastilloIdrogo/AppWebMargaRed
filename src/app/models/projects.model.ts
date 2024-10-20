export interface Project {
  id: string;
  name: string;
  employeeIds: string[]; // Lista de IDs de empleados asignados
  machineIds: string[]; // Lista de IDs de máquinas asignadas
  createdAt: Date; // Campo para registrar la fecha de creación
}
