import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  user_id: number | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  user_id: null,
  token: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ user_id: number; token: string }>) {
      state.user_id = action.payload.user_id;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    clearUser(state) {
      state.user_id = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer; 