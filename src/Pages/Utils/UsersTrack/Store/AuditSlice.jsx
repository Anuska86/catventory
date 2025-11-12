import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { db } from "../../../../utils/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const logAuditAction = createAsyncThunk(
  "audit/logAuditAction",
  async ({ user, action, entity, details }, thunkAPI) => {
    try {
      const docRef = await addDoc(collection(db, "auditTrail"), {
        user,
        action,
        entity,
        details,
        timestamp: serverTimestamp(),
      });

      console.log("Audit log dispatched:", { user, action, entity, details });

      return { id: docRef.id, user, action, entity, details };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const AuditSlice = createSlice({
  name: "audit",
  initialState: {
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(logAuditAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logAuditAction.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(logAuditAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default AuditSlice.reducer;
