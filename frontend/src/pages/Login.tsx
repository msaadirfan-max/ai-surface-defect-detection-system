import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { token, id, name, email: userEmail, role } = response.data;
      login(token, { id, username: name, email: userEmail, role });
      navigate("/upload", { replace: true });
    } catch (error: any) {
      const serverError =
        error.response?.data?.error || "An error occurred during login.";
      setError(serverError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg tracking-wide">
          AI Surface Defect Detection
        </span>
        <span className="text-sm text-gray-400">Quality Assurance System</span>
      </nav>

      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800">Welcome back</h1>

            <p className="mt-1 text-sm text-gray-500">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
