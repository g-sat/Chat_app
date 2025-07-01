import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'closed';
  created_at: string;
  isActive: boolean;
}

interface TicketState {
  tickets: Ticket[];
  loading: boolean;
}

const initialState: TicketState = {
  tickets: [],
  loading: false,
};

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setTickets(state, action: PayloadAction<Ticket[]>) {
      state.tickets = action.payload;
    },
    addTicket(state, action: PayloadAction<Ticket>) {
      state.tickets.unshift(action.payload);
    },
    updateTicket(state, action: PayloadAction<Ticket>) {
      const idx = state.tickets.findIndex(t => t.id === action.payload.id);
      if (idx !== -1) state.tickets[idx] = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    clearTickets(state) {
      state.tickets = [];
    },
  },
});

export const { setTickets, addTicket, updateTicket, setLoading, clearTickets } = ticketSlice.actions;
export default ticketSlice.reducer; 