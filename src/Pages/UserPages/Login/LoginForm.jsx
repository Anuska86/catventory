import React, { useState } from "react";
import "./style/LoginForm.css";

import { LogAudit } from "../../Utils/UsersTrack/AuditLogger";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);

      LogAudit({
        user: email,
        action: "Login Success",
        entity: "Auth",
        details: { rememberMe },
      });

      navigate("/dashboards/crm");
    } catch (err) {
      setError("Failed to log in: " + err.message);

      LogAudit({
        user: email,
        action: "Login Failed",
        entity: "Auth",
        details: { error: err.message },
      });
    }

    setLoading(false);
  };

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit}>
        {error && <div className="error-alert">{error}</div>}

        <div className="form-block">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-block">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="checkbox-block align-left">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="rememberMe">Remember me</label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
