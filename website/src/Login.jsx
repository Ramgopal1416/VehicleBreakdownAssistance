import { useState } from "react";

function Login({ onClose, onLoginSuccess, onRegister }) {
  const [accountType, setAccountType] = useState("CUSTOMER");

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        setMessage(
          typeof data === "string"
            ? data
            : data.message || "Invalid email or password."
        );
        return;
      }

      // Make sure the selected login type matches
      // the role returned by the backend.
      const backendRole =
        String(data.role || "").toUpperCase();

      if (
        accountType === "CUSTOMER" &&
        backendRole !== "USER"
      ) {
        setMessage(
          "This is a mechanic account. Please select Mechanic Login."
        );
        return;
      }

      if (
        accountType === "MECHANIC" &&
        backendRole !== "MECHANIC"
      ) {
        setMessage(
          "This is a customer account. Please select Customer Login."
        );
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify(data)
      );

      setMessage("Login successful.");

      setTimeout(() => {
        onLoginSuccess(data);
      }, 300);

    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">

      <div className="login-box">

        <button
          className="close-btn"
          onClick={onClose}
        >
          ×
        </button>

        <div className="login-icon">
          🚗
        </div>

        <h2>
          Login to VehicleAssist
        </h2>

        <p className="login-subtitle">
          Choose your account type
        </p>

        {/* ACCOUNT TYPE */}
        <div className="login-account-selector">

          <button
            type="button"
            className={
              accountType === "CUSTOMER"
                ? "login-account-card active"
                : "login-account-card"
            }
            onClick={() => {
              setAccountType("CUSTOMER");
              setMessage("");
            }}
          >
            <div className="login-account-icon">
              👤
            </div>

            <div>
              <strong>
                Customer
              </strong>

              <span>
                Book roadside assistance
              </span>
            </div>
          </button>


          <button
            type="button"
            className={
              accountType === "MECHANIC"
                ? "login-account-card mechanic active"
                : "login-account-card mechanic"
            }
            onClick={() => {
              setAccountType("MECHANIC");
              setMessage("");
            }}
          >
            <div className="login-account-icon">
              🔧
            </div>

            <div>
              <strong>
                Mechanic
              </strong>

              <span>
                Manage shop & bookings
              </span>
            </div>
          </button>

        </div>


        {/* SELECTED ACCOUNT */}
        <div className="selected-login-type">
          {accountType === "CUSTOMER"
            ? "👤 Customer Login"
            : "🔧 Mechanic Login"}
        </div>


        {/* FORM */}
        <form onSubmit={handleLogin}>

          <label>
            Email
          </label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />


          <label>
            Password
          </label>

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />


          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : accountType === "CUSTOMER"
              ? "Login as Customer"
              : "Login as Mechanic"}
          </button>

        </form>


        {message && (
          <div className="login-message">
            {message}
          </div>
        )}


        <div className="login-register-row">
          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={onRegister}
          >
            Create Account
          </button>
        </div>

      </div>

    </div>
  );
}

export default Login;