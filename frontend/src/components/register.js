import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, { name, email, password });
      navigate("/");
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" className="form-control mb-2 w-50" placeholder="Name" onChange={(e) => setName(e.target.value)} />
        <input type="email" className="form-control mb-2 w-50" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="form-control mb-2 w-50" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <button className="btn btn-primary">Register</button>
      </form>
    </div>
  );
};

export default Register;
