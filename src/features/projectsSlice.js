import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [
    {
      id: 1,
      nombre: 'Implementación ERP Fase 1',
      client_id: 2,
      company_id: 1,
      cuenta_ingreso_id: 12,
      monto_contrato: 5000000,
      moneda: 'ARS',
      fecha_inicio: '2026-01-15',
      fecha_fin_estimada: '2026-06-30',
      estado: 'activo',
      avance: { '2026-01': 10, '2026-02': 25, '2026-03': 45 }
    },
    {
      id: 2,
      nombre: 'Licencia Anual Software XYZ',
      client_id: 2,
      company_id: 1,
      cuenta_ingreso_id: 12,
      monto_contrato: 2400000,
      moneda: 'ARS',
      fecha_inicio: '2026-01-01',
      fecha_fin_estimada: '2026-12-31',
      estado: 'activo',
      avance: { '2026-01': 8, '2026-02': 17, '2026-03': 25 }
    },
    {
      id: 3,
      nombre: 'Consultoría Estratégica Q1',
      client_id: 2,
      company_id: 2,
      cuenta_ingreso_id: 13,
      monto_contrato: 15000,
      moneda: 'USD',
      fecha_inicio: '2026-01-10',
      fecha_fin_estimada: '2026-03-31',
      estado: 'completado',
      avance: { '2026-01': 30, '2026-02': 65, '2026-03': 100 }
    }
  ]
};

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    addProject: (state, action) => {
      state.items.push({
        ...action.payload,
        id: Math.max(...state.items.map(p => p.id), 0) + 1,
        avance: action.payload.avance || {}
      });
    },
    updateProject: (state, action) => {
      const index = state.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    deleteProject: (state, action) => {
      state.items = state.items.filter(p => p.id !== action.payload);
    },
    setProjectAvance: (state, action) => {
      const { projectId, month, percentage } = action.payload;
      const project = state.items.find(p => p.id === projectId);
      if (project) {
        if (!project.avance) project.avance = {};
        project.avance[month] = Math.min(100, Math.max(0, parseFloat(percentage) || 0));
      }
    }
  },
});

export const { addProject, updateProject, deleteProject, setProjectAvance } = projectsSlice.actions;
export default projectsSlice.reducer;
