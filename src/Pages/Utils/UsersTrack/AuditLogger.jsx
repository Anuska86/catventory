import { logAuditAction } from "./Store/AuditSlice.jsx";
import { getStore } from "../../../config/configureStore";

export const LogAudit = ({ user, action, entity, details }) => {
  const safeUser = user || "Unknown";
  const timestamp = new Date().toISOString();

  getStore().dispatch(
    logAuditAction({
      user: safeUser,
      action,
      entity,
      details,
      timestamp,
    })
  );
};
