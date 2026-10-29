import { useState } from "react";

function Register({ onClose, onLogin }) {

  const [accountType, setAccountType] =
    useState("CUSTOMER");

  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    shopName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    specialization: "GENERAL",
    location: "",
    latitude: "",
    longitude: ""
  });

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };


  const handleRegister = async (e) => {

    e.preventDefault();

    setMessage("");

    if (
      form.password !==
      form.confirmPassword
    ) {

      setMessage(
        "Passwords do not match."
      );

      return;
    }


    setLoading(true);

    try {

      const endpoint =
        accountType === "CUSTOMER"
          ? "http://localhost:8080/api/auth/register/customer"
          : "http://localhost:8080/api/auth/register/mechanic";


      const body =
        accountType === "CUSTOMER"
          ? {
              name: form.name,
              email: form.email,
              phone: form.phone,
              password: form.password
            }
          : {
              ownerName: form.ownerName,
              shopName: form.shopName,
              email: form.email,
              phone: form.phone,
              password: form.password,
              specialization:
                form.specialization,
              location: form.location,
              latitude:
                form.latitude
                  ? Number(form.latitude)
                  : null,
              longitude:
                form.longitude
                  ? Number(form.longitude)
                  : null
            };


      const response =
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(body)
        });


      const data =
        await response.json();


      if (!response.ok) {

        setMessage(
          data.message ||
          "Registration failed."
        );

        return;
      }


      setMessage(
        accountType === "CUSTOMER"
          ? "Customer account created successfully! 🎉"
          : "Mechanic shop account created successfully! 🔧"
      );


      setTimeout(() => {

        onLogin();

      }, 1000);


    } catch (error) {

      console.error(error);

      setMessage(
        "Unable to connect to server."
      );

    } finally {

      setLoading(false);
    }
  };


  return (
    <div className="register-overlay">

      <div className="register-box">

        <button
          className="register-close"
          onClick={onClose}
        >
          ×
        </button>


        <div className="register-heading">

          <div className="register-icon">
            🚗
          </div>

          <h2>
            Create Your VehicleAssist Account
          </h2>

          <p>
            Choose how you want to use VehicleAssist.
          </p>

        </div>


        {/* ACCOUNT TYPE */}

        <div className="account-type-selector">

          <button
            type="button"
            className={
              accountType === "CUSTOMER"
                ? "account-type active"
                : "account-type"
            }
            onClick={() =>
              setAccountType("CUSTOMER")
            }
          >
            <span>
              👤
            </span>

            <strong>
              Customer
            </strong>

            <small>
              Get roadside assistance
            </small>

          </button>


          <button
            type="button"
            className={
              accountType === "MECHANIC"
                ? "account-type active"
                : "account-type"
            }
            onClick={() =>
              setAccountType("MECHANIC")
            }
          >
            <span>
              🔧
            </span>

            <strong>
              Mechanic
            </strong>

            <small>
              Register your shop
            </small>

          </button>

        </div>


        <form onSubmit={handleRegister}>

          {accountType === "CUSTOMER" ? (

            <>
              <label>
                Full Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </>

          ) : (

            <>
              <label>
                Mechanic / Owner Name
              </label>

              <input
                type="text"
                name="ownerName"
                placeholder="Enter owner name"
                value={form.ownerName}
                onChange={handleChange}
                required
              />


              <label>
                Shop Name
              </label>

              <input
                type="text"
                name="shopName"
                placeholder="Example: Kumar Auto Care"
                value={form.shopName}
                onChange={handleChange}
                required
              />
            </>

          )}


          <label>
            Email
          </label>

          <input
            type="email"
            name="email"
            placeholder="Enter email"
            value={form.email}
            onChange={handleChange}
            required
          />


          <label>
            Phone Number
          </label>

          <input
            type="tel"
            name="phone"
            placeholder="Enter phone number"
            value={form.phone}
            onChange={handleChange}
            required
          />


          {accountType === "MECHANIC" && (

            <>

              <label>
                Specialization
              </label>

              <select
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
              >

                <option value="GENERAL">
                  General
                </option>

                <option value="BATTERY">
                  Battery
                </option>

                <option value="TYRE">
                  Tyre
                </option>

                <option value="ENGINE">
                  Engine
                </option>

                <option value="ELECTRICAL">
                  Electrical
                </option>

                <option value="FUEL">
                  Fuel
                </option>

              </select>


              <label>
                Shop Location
              </label>

              <input
                type="text"
                name="location"
                placeholder="Example: Chennai"
                value={form.location}
                onChange={handleChange}
                required
              />


              <div className="location-row">

                <div>

                  <label>
                    Latitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    placeholder="13.0827"
                    value={form.latitude}
                    onChange={handleChange}
                  />

                </div>


                <div>

                  <label>
                    Longitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    placeholder="80.2707"
                    value={form.longitude}
                    onChange={handleChange}
                  />

                </div>

              </div>

            </>

          )}


          <label>
            Password
          </label>

          <input
            type="password"
            name="password"
            placeholder="Create password"
            value={form.password}
            onChange={handleChange}
            required
          />


          <label>
            Confirm Password
          </label>

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />


          <button
            type="submit"
            className="register-submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : accountType === "CUSTOMER"
              ? "Create Customer Account"
              : "Create Mechanic Shop Account"}
          </button>

        </form>


        {message && (
          <div className="register-message">
            {message}
          </div>
        )}


        <p className="existing-account">
          Already have an account?

          <button
            type="button"
            onClick={onLogin}
          >
            Login
          </button>

        </p>

      </div>

    </div>
  );
}

export default Register;