import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { LogAudit } from "../../Utils/UsersTrack/AuditLogger";

import { Button, Form, FormGroup, Label, Input, Alert } from "reactstrap";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      LogAudit({
        user: email,
        action: "Login",
        entity: "Auth",
        details: "User logged in successfully",
      });
    } catch (err) {
      setError("Failed to log in: " + err.message);
      LogAudit({
        user: email,
        action: "Login Failed",
        entity: "Auth",
        details: `Login failed: ${err.message}`,
      });
    }

    setLoading(false);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert color="danger">{error}</Alert>}
      <FormGroup>
        <Label for="email">Email</Label>
        <Input
          type="email"
          name="email"
          id="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </FormGroup>
      <FormGroup>
        <Label for="password">Password</Label>
        <Input
          type="password"
          name="password"
          id="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </FormGroup>
      <Button color="primary" type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Log In"}
      </Button>
    </Form>
  );
};

export default LoginForm;
