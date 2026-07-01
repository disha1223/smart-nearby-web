import { useState } from "react";

import axios from "axios";

import { useNavigate, Link } from "react-router-dom";

import "./Auth.css";


function Signup() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({

    username: "",
    email: "",
    password: "",

  });


  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value,

    });

  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const res = await axios.post(

        "http://localhost:5000/api/auth/signup",

        formData

      );


      localStorage.setItem(

        "username",

        res.data.user.username

      );


      navigate("/login");

    } catch (error) {

      alert(error.response.data.message);

    }
  };


  return (

    <div className="auth-container">

      <form
        className="auth-card"
        onSubmit={handleSubmit}
      >

        <h1>Create Account</h1>
<p>Join Smart Nearby and discover places that match your mood</p>


        <input
          type="text"
          name="username"
          placeholder="Username"
          onChange={handleChange}
        />


        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />


        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />


        <button type="submit">
          Sign Up
        </button>


        <span>
          Already have an account?

          <Link to="/login">
            Login
          </Link>
        </span>

      </form>

    </div>
  );
}

export default Signup;