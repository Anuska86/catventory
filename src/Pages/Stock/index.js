import { Outlet } from "react-router-dom";

export default function Stock() {
  return (
    <div className="stock-layout">
      <Outlet />
    </div>
  );
}
