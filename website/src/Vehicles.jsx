import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8080";

function Vehicles({ userId, user, onBack }) {
  const getLoggedInUserId = () => {
  try {
    const savedUser = localStorage.getItem("loggedInUser");

    if (!savedUser) {
      return null;
    }

    const parsedUser = JSON.parse(savedUser);

    return parsedUser.userId || parsedUser.id || null;
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
    return null;
  }
};

const currentUserId =
  userId ||
  user?.userId ||
  user?.id ||
  getLoggedInUserId();

  // Support both props so we don't get a userId mismatch
  const [vehicles, setVehicles] = useState([]);

  const [form, setForm] = useState({
    vehicleNumber: "",
    vehicleType: "CAR",
    brand: "",
    model: "",
    year: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadVehicles = async () => {

    if (!currentUserId) {
      setMessage("User ID is missing. Please login again.");
      return;
    }

    try {

      const response = await fetch(
        `${API_BASE}/api/vehicles/user/${currentUserId}`
      );

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log("Vehicle load response:", data);

      if (!response.ok) {
        setMessage(
          typeof data === "string"
            ? data
            : "Unable to load vehicles."
        );
        return;
      }

      setVehicles(Array.isArray(data) ? data : []);

    } catch (error) {

      console.error("LOAD VEHICLES ERROR:", error);

      setMessage(
        "Unable to connect to server. Make sure Spring Boot is running on port 8080."
      );
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [currentUserId]);

  const handleChange = (event) => {

    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const addVehicle = async (event) => {

    event.preventDefault();

    if (!currentUserId) {
      setMessage("User ID is missing. Please login again.");
      return;
    }

    if (!form.vehicleNumber.trim()) {
      setMessage("Please enter vehicle number.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {

      const vehicleData = {
        userId: Number(currentUserId),
        vehicleNumber: form.vehicleNumber.trim(),
        vehicleType: form.vehicleType,
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: form.year
          ? Number(form.year)
          : null
      };

      console.log("Sending vehicle:", vehicleData);

      const response = await fetch(
        `${API_BASE}/api/vehicles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(vehicleData)
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log("Add vehicle response:", data);

      if (!response.ok) {

        setMessage(
          typeof data === "string"
            ? data
            : data?.message || "Unable to add vehicle."
        );

        return;
      }

      setMessage("Vehicle added successfully! 🚗");

      setForm({
        vehicleNumber: "",
        vehicleType: "CAR",
        brand: "",
        model: "",
        year: ""
      });

      await loadVehicles();

    } catch (error) {

      console.error("ADD VEHICLE ERROR:", error);

      setMessage(
        "Unable to connect to server. Check that Spring Boot is running."
      );

    } finally {

      setLoading(false);
    }
  };

  const deleteVehicle = async (id) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this vehicle?"
    );

    if (!confirmed) {
      return;
    }

    try {

      const response = await fetch(
        `${API_BASE}/api/vehicles/${id}`,
        {
          method: "DELETE"
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {

        setMessage(
          typeof data === "string"
            ? data
            : "Unable to delete vehicle."
        );

        return;
      }

      setMessage("Vehicle deleted successfully. 🗑️");

      await loadVehicles();

    } catch (error) {

      console.error("DELETE VEHICLE ERROR:", error);

      setMessage("Unable to connect to server.");
    }
  };

  return (
    <div className="vehicle-page">

      <div className="vehicle-header">

        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

        <h1>🚗 My Vehicles</h1>

        <p>
          Add and manage your vehicles
        </p>

      </div>

      <div className="vehicle-container">

        {/* ADD VEHICLE */}

        <div className="vehicle-form-card">

          <h2>Add Vehicle</h2>

          <form onSubmit={addVehicle}>

            <label>
              Vehicle Number
            </label>

            <input
              type="text"
              name="vehicleNumber"
              placeholder="e.g. TN01AB1234"
              value={form.vehicleNumber}
              onChange={handleChange}
              required
            />

            <label>
              Vehicle Type
            </label>

            <select
              name="vehicleType"
              value={form.vehicleType}
              onChange={handleChange}
            >
              <option value="CAR">
                Car
              </option>

              <option value="BIKE">
                Bike
              </option>

              <option value="AUTO">
                Auto
              </option>

              <option value="TRUCK">
                Truck
              </option>

              <option value="OTHER">
                Other
              </option>
            </select>

            <label>
              Brand
            </label>

            <input
              type="text"
              name="brand"
              placeholder="e.g. Hyundai"
              value={form.brand}
              onChange={handleChange}
            />

            <label>
              Model
            </label>

            <input
              type="text"
              name="model"
              placeholder="e.g. i20"
              value={form.model}
              onChange={handleChange}
            />

            <label>
              Year
            </label>

            <input
              type="number"
              name="year"
              placeholder="e.g. 2023"
              value={form.year}
              onChange={handleChange}
              min="1900"
              max="2100"
            />

            <button
              type="submit"
              className="add-vehicle-btn"
              disabled={loading}
            >
              {loading
                ? "Adding..."
                : "➕ Add Vehicle"}
            </button>

          </form>

          {message && (
            <div className="vehicle-message">
              {message}
            </div>
          )}

        </div>

        {/* VEHICLE LIST */}

        <div className="vehicle-list-card">

          <h2>
            Your Vehicles
          </h2>

          {vehicles.length === 0 ? (

            <div className="empty-vehicles">

              <div>
                🚗
              </div>

              <h3>
                No vehicles added yet
              </h3>

              <p>
                Add your first vehicle using the form.
              </p>

            </div>

          ) : (

            <div className="vehicle-list">

              {vehicles.map((vehicle) => (

                <div
                  className="vehicle-item"
                  key={vehicle.id}
                >

                  <div className="vehicle-icon">

                    {vehicle.vehicleType === "BIKE"
                      ? "🏍️"
                      : vehicle.vehicleType === "TRUCK"
                      ? "🚚"
                      : vehicle.vehicleType === "AUTO"
                      ? "🛺"
                      : "🚗"}

                  </div>

                  <div className="vehicle-info">

                    <h3>
                      {vehicle.vehicleNumber}
                    </h3>

                    <p>
                      {vehicle.brand || "Unknown Brand"}{" "}
                      {vehicle.model || ""}
                    </p>

                    <span>
                      {vehicle.vehicleType}

                      {vehicle.year
                        ? ` • ${vehicle.year}`
                        : ""}
                    </span>

                  </div>

                  <button
                    type="button"
                    className="delete-vehicle-btn"
                    onClick={() =>
                      deleteVehicle(vehicle.id)
                    }
                  >
                    🗑️
                  </button>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default Vehicles;