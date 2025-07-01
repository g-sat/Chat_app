import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  sender_id?: number;
  sender_name?: string;
}

interface MessageState {
  messages: Message[];
  loading: boolean;
}

const initialState: MessageState = {
  messages: [],
  loading: false,
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setMessages(state, action: PayloadAction<Message[]>) {
      state.messages = action.payload;
    },
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    clearMessages(state) {
      state.messages = [];
    },
  },
});

export const { setMessages, addMessage, setLoading, clearMessages } = messageSlice.actions;
export default messageSlice.reducer; 