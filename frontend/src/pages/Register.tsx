import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import toast  from "react-hot-toast";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setLoading(true);
      const response = await apiClient.post("/auth/register", {
        username,
        email,
        password,
      });
      const { token, user: registeredUser } = response.data;
      login(token, registeredUser);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (error: any) {
      const serverError =
        error.response?.data?.error || "An error occurred during registration.";
      setError(serverError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-wide">
            AI Surface Defect Detection
          </span>
          <span className="text-xs text-gray-400">
            Quality Assurance Dashboard
          </span>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Create an account
            </h1>

            <p className="mt-1 text-sm text-gray-500">Sign up to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="userName"
                className="text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                type="text"
                id="userName"
                placeholder="John Doe"
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="userEmail"
                className="text-sm font-medium text-gray-700"
              >
                Email address
              </label>

              <input
                type="email"
                id="userEmail"
                placeholder="user@example.com"
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="userPassword"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="userPassword"
                placeholder="••••••••"
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="••••••••"
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              toast.error(error)
            )}
            {success && (
              toast.success("Registration successful! Redirecting to login...")
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 font-medium hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
