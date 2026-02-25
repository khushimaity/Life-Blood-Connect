import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "./AuthContext";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DonorLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log('Attempting login with:', { email, isAdmin });
      
      const result = await login(email, password, isAdmin);
      
      console.log('Login result:', result);
      
      if (result.success) {
        toast.success('Login successful! Redirecting...');
        
        // Navigate based on role after a short delay
        setTimeout(() => {
          if (result.user?.role === 'admin') {
            navigate("/admin-dashboard");
          } else {
            navigate("/donor-dashboard");
          }
        }, 1500);
      } else {
        // Show error message
        const errorMsg = result.message || 'Invalid email or password';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.message || 'Login failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-[#fff8f8] rounded-lg shadow-md">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-3xl font-bold mb-6 text-[#1c0d0d]">Login</h2>

      {/* Error Message Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Email Address</label>
          <input
            type="email"
            placeholder="Enter your email address"
            className="w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none focus:ring-2 focus:ring-red-300"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="relative">
          <label className="block mb-1 font-medium">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none focus:ring-2 focus:ring-red-300 pr-10"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <span
            className="absolute right-3 top-10 transform -translate-y-1/2 cursor-pointer text-[#a94442]"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="adminCheck"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="h-4 w-4"
            disabled={loading}
          />
          <label htmlFor="adminCheck" className="text-sm text-[#522525]">
            Login as Admin
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md transition disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {!isAdmin && (
        <div className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-red-600 hover:underline">
            Register now
          </Link>
        </div>
      )}

      {/* Forgot password link - optional */}
      <div className="mt-2 text-center text-sm">
        <Link to="/forgot-password" className="text-gray-500 hover:text-red-600 hover:underline">
          Forgot password?
        </Link>
      </div>
    </div>
  );
};

export default DonorLogin;
