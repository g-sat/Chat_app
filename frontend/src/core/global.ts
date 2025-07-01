import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import userReducer from './userSlice';
import ticketReducer from './ticketSlice';
import messageReducer from './messageSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    tickets: ticketReducer,
    messages: messageReducer,
  },
});

// Types for use throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
