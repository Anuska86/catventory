import React from "react";
import "./style/index.css";
import LoginForm from "./LoginForm";

const Login = () => {
  return (
    <div className="login-bg">
      <div className="login-overlay fade-in">
        <div className="login-wrapper">
          <h2 className="login-title">Welcome back</h2>

          <div className="divider" />

          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
