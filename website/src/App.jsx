import { useState } from "react";
import "./App.css";

import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import MechanicDashboard from "./MechanicDashboard";

function App() {

  const [showLogin, setShowLogin] = useState(false);

  const [showRegister, setShowRegister] =
    useState(false);


  const [loggedInUser, setLoggedInUser] =
    useState(() => {

      const savedUser =
        localStorage.getItem("user");

      if (!savedUser) {
        return null;
      }

      try {
        return JSON.parse(savedUser);
      } catch {
        localStorage.removeItem("user");
        return null;
      }
    });


  // =========================
  // LOGIN SUCCESS
  // =========================

  const handleLoginSuccess = (user) => {

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    setLoggedInUser(user);

    setShowLogin(false);
  };


  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {

    localStorage.removeItem("user");

    setLoggedInUser(null);

    setShowLogin(false);

    setShowRegister(false);
  };


  // =========================
  // MECHANIC DASHBOARD
  // =========================

  if (
    loggedInUser &&
    loggedInUser.role &&
    loggedInUser.role.toUpperCase() ===
      "MECHANIC"
  ) {

    return (
      <MechanicDashboard
        mechanicId={
          loggedInUser.mechanicId
        }
        mechanicName={
          loggedInUser.mechanicName ||
          loggedInUser.name ||
          "Mechanic"
        }
        onLogout={handleLogout}
      />
    );
  }


  // =========================
  // CUSTOMER DASHBOARD
  // =========================

  if (loggedInUser) {

    return (
      <Dashboard
        user={loggedInUser}
        onLogout={handleLogout}
      />
    );
  }


  // =========================
  // HOME PAGE
  // =========================

  return (
    <div className="app">

      {/* NAVBAR */}

      <nav className="navbar">

        <div className="logo">
          🚗 VehicleAssist
        </div>

        <div className="nav-links">

          <a href="#home">
            Home
          </a>

          <a href="#services">
            Services
          </a>

          <a href="#how-it-works">
            How It Works
          </a>

          <button
            className="login-btn"
            onClick={() =>
              setShowLogin(true)
            }
          >
            Login
          </button>

          <button
            className="secondary-btn"
            onClick={() =>
              setShowRegister(true)
            }
          >
            Register
          </button>

        </div>

      </nav>


      {/* HERO */}

      <section
        className="hero"
        id="home"
      >

        <div className="hero-content">

          <p className="tagline">
            24/7 Vehicle Breakdown Support
          </p>

          <h1>
            Help is only one click
            <span> away.</span>
          </h1>

          <p className="hero-text">
            Get quick roadside assistance,
            find nearby mechanics, track service
            requests, and stay safe during vehicle
            breakdowns.
          </p>

          <div className="hero-buttons">

            <button
              className="emergency-btn"
              onClick={() =>
                setShowLogin(true)
              }
            >
              🚨 Request Emergency Help
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                setShowLogin(true)
              }
            >
              Find a Mechanic
            </button>

          </div>

        </div>


        <div className="hero-card">

          <div className="car-icon">
            🚘
          </div>

          <h2>
            Stranded?
          </h2>

          <p>
            We help you get moving again.
          </p>

          <div className="status-item">
            <span>📍</span>
            <p>
              Nearby mechanic matching
            </p>
          </div>

          <div className="status-item">
            <span>⏱️</span>
            <p>
              Live service tracking
            </p>
          </div>

          <div className="status-item">
            <span>⭐</span>
            <p>
              Trusted mechanic ratings
            </p>
          </div>

        </div>

      </section>


      {/* SERVICES */}

      <section
        className="services"
        id="services"
      >

        <h2>
          Our Services
        </h2>

        <p className="section-description">
          Reliable assistance whenever your
          vehicle needs help.
        </p>

        <div className="service-grid">

          <div className="service-card">

            <div className="service-icon">
              🔋
            </div>

            <h3>
              Battery Assistance
            </h3>

            <p>
              Get help with dead batteries
              and starting problems.
            </p>

          </div>


          <div className="service-card">

            <div className="service-icon">
              🛞
            </div>

            <h3>
              Tyre Support
            </h3>

            <p>
              Find assistance for punctures
              and tyre problems.
            </p>

          </div>


          <div className="service-card">

            <div className="service-icon">
              ⛽
            </div>

            <h3>
              Fuel Assistance
            </h3>

            <p>
              Request help when your vehicle
              runs out of fuel.
            </p>

          </div>


          <div className="service-card">

            <div className="service-icon">
              🔧
            </div>

            <h3>
              Engine Repair
            </h3>

            <p>
              Connect with mechanics for
              engine and electrical problems.
            </p>

          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}

      <section
        className="how-it-works"
        id="how-it-works"
      >

        <h2>
          How It Works
        </h2>

        <div className="steps">

          <div className="step">

            <div className="step-number">
              1
            </div>

            <h3>
              Report Breakdown
            </h3>

            <p>
              Tell us your vehicle problem
              and location.
            </p>

          </div>


          <div className="step">

            <div className="step-number">
              2
            </div>

            <h3>
              Find a Mechanic
            </h3>

            <p>
              Our system finds a suitable
              nearby mechanic.
            </p>

          </div>


          <div className="step">

            <div className="step-number">
              3
            </div>

            <h3>
              Track Assistance
            </h3>

            <p>
              Track the mechanic and
              estimated arrival time.
            </p>

          </div>


          <div className="step">

            <div className="step-number">
              4
            </div>

            <h3>
              Complete Service
            </h3>

            <p>
              Finish the service and
              provide a rating.
            </p>

          </div>

        </div>

      </section>


      {/* FOOTER */}

      <footer>

        <p>
          © 2026 VehicleAssist.
          Roadside help made simple.
        </p>

      </footer>


      {/* LOGIN */}

      {showLogin && (
      
         <Login
  onClose={() => setShowLogin(false)}
  onLoginSuccess={handleLoginSuccess}
  onRegister={() => {
    setShowLogin(false);
    setShowRegister(true);
  }}
/>
      )}


      {/* REGISTER */}

      {showRegister && (
        <Register
          onClose={() =>
            setShowRegister(false)
          }
          onLogin={() => {

            setShowRegister(false);

            setShowLogin(true);
          }}
        />
      )}

    </div>
  );
}

export default App;