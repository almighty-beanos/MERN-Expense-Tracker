import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alertMessage, setAlertMessage] = useState(null); // State for alert message
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertMessage(null); // Reset alert before new login attempt

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, { email, password });
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed", error.response?.data?.message || error.message);

      if (error.response?.data?.message === "User not found") {
        setAlertMessage({
          type: "danger",
          text: "Email not found! Please register first.",
        });
      } else {
        setAlertMessage({
          type: "warning",
          text: error.response?.data?.message || "Login failed. Please try again.",
        });
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2>Login</h2>

      {alertMessage && (
        <div className={`alert alert-${alertMessage.type} alert-dismissible fade show`} role="alert">
          {alertMessage.text}
          {alertMessage.type === "danger" && (
            <button className="btn btn-link p-0 ms-2" onClick={() => navigate("/register")}>
              Register Here
            </button>
          )}
          <button type="button" className="btn-close" onClick={() => setAlertMessage(null)}></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          className="form-control mb-2 w-50"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="form-control mb-2 w-50"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn btn-primary">Login</button>
      </form>
    </div>
  );
};

export default Login;
