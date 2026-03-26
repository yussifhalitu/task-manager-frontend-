import React, { useState } from 'react';
import { register } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function Register() {
  const [form,    setForm]    = useState({ username: '', password: '', full_name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Task Manager</h1>
        <h2>Create Account</h2>
        <form onSubmit={handleRegister}>
          <input type="text"     name="full_name" placeholder="Full Name" onChange={handleChange} required />
          <input type="text"     name="username"  placeholder="Username"  onChange={handleChange} required />
          <input type="email"    name="email"     placeholder="Email"     onChange={handleChange} required />
          <input type="password" name="password"  placeholder="Password"  onChange={handleChange} required />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

export default Register;