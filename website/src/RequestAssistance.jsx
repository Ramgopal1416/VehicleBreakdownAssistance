import { useEffect, useState } from "react";
import TrackAssistance from "./TrackAssistance";

function RequestAssistance({ user, onBack }) {
  const [vehicles, setVehicles] = useState([]);

  const [form, setForm] = useState({
    vehicleId: "",
    problemType: "BATTERY",
    description: "",
    latitude: "",
    longitude: "",
    emergency: false
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [nearbyMechanics, setNearbyMechanics] = useState([]);
  const [loadingMechanics, setLoadingMechanics] = useState(false);

  const [breakdownId, setBreakdownId] = useState(null);
  const [bookingMechanicId, setBookingMechanicId] = useState(null);

  const [assignment, setAssignment] = useState(null);
  const [showTracking, setShowTracking] = useState(false);


  // =========================================================
  // LOAD VEHICLES
  // =========================================================

  useEffect(() => {
    loadVehicles();
  }, []);


  const loadVehicles = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/vehicles/user/${user.userId}`
      );

      const data = await response.json();

      if (response.ok) {
        setVehicles(
          Array.isArray(data) ? data : []
        );
      } else {
        setMessage("Unable to load your vehicles.");
      }

    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server.");
    }
  };


  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value
    }));
  };


  // =========================================================
  // LOCATION
  // =========================================================

  const getLocation = () => {

    setMessage("");
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setMessage(
        "Location is not supported by your browser."
      );
      setLocationLoading(false);
      return;
    }


    navigator.geolocation.getCurrentPosition(
      (position) => {

        setForm((previous) => ({
          ...previous,
          latitude:
            position.coords.latitude,
          longitude:
            position.coords.longitude
        }));

        setMessage(
          "Location detected successfully! 📍"
        );

        setLocationLoading(false);
      },

      (error) => {

        console.error(
          "Location error:",
          error
        );

        if (error.code === 1) {
          setMessage(
            "Location permission was denied. Please allow location access."
          );
        } else {
          setMessage(
            "Unable to get your current location."
          );
        }

        setLocationLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };


  // =========================================================
  // FIND NEARBY MECHANICS
  // =========================================================

  const findNearbyMechanics = async (
    latitude,
    longitude,
    specialization
  ) => {

    setLoadingMechanics(true);
    setNearbyMechanics([]);
    setMessage("");

    try {

      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        maxDistanceKm: "30"
      });


      if (specialization) {
        params.append(
          "specialization",
          specialization
        );
      }


      const response = await fetch(
        `http://localhost:8080/api/mechanics/nearby?${params.toString()}`
      );


      const data =
        await response.json();


      if (!response.ok) {

        setMessage(
          typeof data === "string"
            ? data
            : "Unable to find nearby mechanics."
        );

        return;
      }


      setNearbyMechanics(
        Array.isArray(data) ? data : []
      );


      if (!Array.isArray(data) || data.length === 0) {

        setMessage(
          "No suitable mechanics found within 30 km."
        );

      } else {

        setMessage(
          `${data.length} nearby mechanic${
            data.length === 1 ? "" : "s"
          } found.`
        );
      }

    } catch (error) {

      console.error(
        "Nearby mechanic error:",
        error
      );

      setMessage(
        "Unable to find nearby mechanics."
      );

    } finally {

      setLoadingMechanics(false);
    }
  };


  // =========================================================
  // CREATE BREAKDOWN REQUEST
  // =========================================================

  const submitRequest = async (e) => {

    e.preventDefault();

    setMessage("");
    setNearbyMechanics([]);
    setAssignment(null);

    if (!form.vehicleId) {

      setMessage(
        "Please select a vehicle."
      );

      return;
    }


    if (
      form.latitude === "" ||
      form.longitude === ""
    ) {

      setMessage(
        "Please detect your current location first."
      );

      return;
    }


    setLoading(true);

    try {

      const response = await fetch(
        "http://localhost:8080/api/breakdowns",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            userId: Number(
              user.userId
            ),

            vehicleId: Number(
              form.vehicleId
            ),

            problemType:
              form.problemType,

            description:
              form.description,

            latitude:
              Number(form.latitude),

            longitude:
              Number(form.longitude),

            emergency:
              form.emergency
          })
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        setMessage(
          data.message ||
          "Unable to create assistance request."
        );

        return;
      }


      setBreakdownId(data.id);


      setMessage(
        `Request #${data.id} created. Finding nearby mechanics... 🔍`
      );


      // IMPORTANT:
      // We do NOT automatically assign a mechanic anymore.
      // Customer chooses the mechanic.
      await findNearbyMechanics(
        Number(form.latitude),
        Number(form.longitude),
        form.problemType
      );


      // Clear only the form fields
      setForm((previous) => ({
        ...previous,
        vehicleId: "",
        description: "",
        latitude: previous.latitude,
        longitude: previous.longitude
      }));

    } catch (error) {

      console.error(
        "Create breakdown error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );

    } finally {

      setLoading(false);
    }
  };


  // =========================================================
  // BOOK SELECTED MECHANIC
  // =========================================================

  const bookMechanic = async (
    mechanicData
  ) => {

    if (!breakdownId) {

      setMessage(
        "Breakdown request not found."
      );

      return;
    }


    const mechanic =
      mechanicData.mechanic ||
      mechanicData;


    const distanceKm =
      mechanicData.distanceKm != null
        ? Number(
            mechanicData.distanceKm
          )
        : 0;


    setBookingMechanicId(
      mechanic.id
    );

    setMessage("");


    try {

      const response = await fetch(
        "http://localhost:8080/api/assignments/book",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            breakdownId:
              Number(breakdownId),

            mechanicId:
              Number(mechanic.id),

            distanceKm:
              distanceKm

          })
        }
      );


      const contentType =
        response.headers.get(
          "content-type"
        ) || "";


      let data;

      if (
        contentType.includes(
          "application/json"
        )
      ) {

        data =
          await response.json();

      } else {

        data =
          await response.text();
      }


      if (!response.ok) {

        setMessage(
          typeof data === "string"
            ? data
            : data.message ||
              "Unable to book mechanic."
        );

        return;
      }


      setAssignment(data);


      setMessage(
        `${mechanic.name} has been booked successfully! 🔧`
      );


      // Remove the booked mechanic
      // from the available list.
      setNearbyMechanics(
        (previous) =>
          previous.filter(
            (item) =>
              (
                item.mechanic ||
                item
              ).id !== mechanic.id
          )
      );

    } catch (error) {

      console.error(
        "Booking error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );

    } finally {

      setBookingMechanicId(null);
    }
  };


  // =========================================================
  // TRACKING
  // =========================================================

  if (
    showTracking &&
    assignment
  ) {

    return (
      <TrackAssistance
        assignment={assignment}
        onBack={() =>
          setShowTracking(false)
        }
      />
    );
  }


  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="request-page">

      {/* HEADER */}

      <div className="request-header">

        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>


        <p className="dashboard-label">
          VEHICLE ASSISTANCE
        </p>


        <h1>
          🚨 Request Assistance
        </h1>


        <p>
          Tell us what happened and choose
          a nearby mechanic.
        </p>

      </div>


      <div className="request-container">

        {/* =================================================
            FORM
        ================================================= */}

        <div className="request-card">

          <h2>
            Breakdown Details
          </h2>


          <form
            onSubmit={submitRequest}
          >

            {/* VEHICLE */}

            <label>
              Select Vehicle
            </label>


            {vehicles.length === 0 ? (

              <div className="no-vehicles">

                <p>
                  You don't have any
                  vehicles registered.
                </p>

                <p>
                  Please add a vehicle
                  before requesting
                  assistance.
                </p>

              </div>

            ) : (

              <select
                name="vehicleId"
                value={form.vehicleId}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select your vehicle
                </option>


                {vehicles.map(
                  (vehicle) => (

                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      {vehicle.vehicleNumber}
                      {" - "}
                      {vehicle.brand || ""}
                      {" "}
                      {vehicle.model || ""}
                    </option>

                  )
                )}

              </select>
            )}


            {/* PROBLEM */}

            <label>
              Problem Type
            </label>


            <select
              name="problemType"
              value={form.problemType}
              onChange={handleChange}
            >

              <option value="BATTERY">
                🔋 Battery Problem
              </option>

              <option value="TYRE">
                🛞 Tyre Problem
              </option>

              <option value="FUEL">
                ⛽ Fuel Problem
              </option>

              <option value="ENGINE">
                🔧 Engine Problem
              </option>

              <option value="ELECTRICAL">
                ⚡ Electrical Problem
              </option>

              <option value="OTHER">
                🛠️ Other Problem
              </option>

            </select>


            {/* DESCRIPTION */}

            <label>
              Describe the Problem
            </label>


            <textarea
              name="description"
              placeholder="Explain what happened to your vehicle..."
              value={form.description}
              onChange={handleChange}
              rows="5"
            />


            {/* LOCATION */}

            <label>
              Your Location
            </label>


            <div className="location-box">

              <div>

                {form.latitude !== "" &&
                form.longitude !== "" ? (

                  <p>
                    📍 Location detected successfully
                  </p>

                ) : (

                  <p>
                    📍 Location not detected
                  </p>

                )}

              </div>


              <button
                type="button"
                className="location-btn"
                onClick={getLocation}
                disabled={locationLoading}
              >
                {locationLoading
                  ? "Detecting..."
                  : "📍 Detect My Location"}
              </button>

            </div>


            {/* EMERGENCY */}

            <div className="emergency-option">

              <input
                type="checkbox"
                name="emergency"
                checked={
                  form.emergency
                }
                onChange={
                  handleChange
                }
              />


              <div>

                <strong>
                  🚨 Emergency Assistance
                </strong>

                <p>
                  Prioritize nearby
                  suitable mechanics.
                </p>

              </div>

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              className="request-submit-btn"
              disabled={
                loading ||
                loadingMechanics ||
                vehicles.length === 0
              }
            >
              {loading
                ? "Creating Request..."
                : loadingMechanics
                ? "Finding Mechanics..."
                : "🔍 Find Nearby Mechanics"}
            </button>

          </form>


          {/* MESSAGE */}

          {message && (
            <div className="request-message">
              {message}
            </div>
          )}

        </div>


        {/* =================================================
            NEARBY MECHANICS
        ================================================= */}

        {(loadingMechanics ||
          nearbyMechanics.length > 0 ||
          breakdownId) && (

          <div className="nearby-mechanics-card">

            <div className="nearby-header">

              <div>

                <p className="dashboard-label">
                  NEARBY SERVICE PROVIDERS
                </p>

                <h2>
                  Choose a Mechanic
                </h2>

                <p>
                  Select the mechanic you want
                  to book for your vehicle.
                </p>

              </div>

              {breakdownId && (
                <span className="request-id-badge">
                  Request #{breakdownId}
                </span>
              )}

            </div>


            {/* LOADING */}

            {loadingMechanics && (

              <div className="nearby-loading">

                <div className="nearby-loading-icon">
                  🔍
                </div>

                <h3>
                  Finding nearby mechanics...
                </h3>

                <p>
                  Searching within 30 km
                  of your location.
                </p>

              </div>

            )}


            {/* NO MECHANICS */}

            {!loadingMechanics &&
              nearbyMechanics.length === 0 &&
              breakdownId &&
              !assignment && (

              <div className="nearby-empty">

                <div>
                  🔧
                </div>

                <h3>
                  No suitable mechanics found
                </h3>

                <p>
                  There are currently no
                  available {form.problemType.toLowerCase()}
                  mechanics within 30 km.
                </p>

                <button
                  type="button"
                  className="location-btn"
                  onClick={() =>
                    findNearbyMechanics(
                      Number(form.latitude),
                      Number(form.longitude),
                      form.problemType
                    )
                  }
                >
                  🔄 Search Again
                </button>

              </div>

            )}


            {/* MECHANIC CARDS */}

            {!loadingMechanics &&
              nearbyMechanics.length > 0 && (

              <div className="nearby-mechanics-list">

                {nearbyMechanics.map(
                  (item) => {

                    const mechanic =
                      item.mechanic ||
                      item;

                    const distanceKm =
                      item.distanceKm != null
                        ? item.distanceKm
                        : 0;

                    const isBooking =
                      bookingMechanicId ===
                      mechanic.id;


                    return (

                      <div
                        className="nearby-mechanic-card"
                        key={mechanic.id}
                      >

                        <div className="nearby-mechanic-main">

                          <div className="nearby-mechanic-avatar">
                            🔧
                          </div>


                          <div className="nearby-mechanic-info">

                            <h3>
                              {mechanic.name}
                            </h3>

                            <p>
                              {mechanic.specialization ||
                                "General Mechanic"}
                            </p>


                            <div className="nearby-mechanic-meta">

                              <span>
                                ⭐{" "}
                                {mechanic.rating != null
                                  ? mechanic.rating
                                  : "New"}
                              </span>

                              <span>
                                📍{" "}
                                {distanceKm} km
                              </span>

                              <span
                                className={
                                  mechanic.available
                                    ? "mechanic-available"
                                    : "mechanic-unavailable"
                                }
                              >
                                {mechanic.available
                                  ? "● Available"
                                  : "● Unavailable"}
                              </span>

                            </div>


                            {mechanic.location && (
                              <small>
                                📌 {mechanic.location}
                              </small>
                            )}

                          </div>

                        </div>


                        <button
                          type="button"
                          className="book-mechanic-btn"
                          disabled={
                            !mechanic.available ||
                            bookingMechanicId !== null ||
                            assignment !== null
                          }
                          onClick={() =>
                            bookMechanic(
                              item
                            )
                          }
                        >

                          {isBooking
                            ? "Booking..."
                            : assignment
                            ? "Booked"
                            : "Book Mechanic →"}

                        </button>

                      </div>

                    );
                  }
                )}

              </div>

            )}


            {/* BOOKING SUCCESS */}

            {assignment && (

              <div className="booking-success-card">

                <div className="booking-success-icon">
                  ✅
                </div>

                <div>

                  <span>
                    BOOKING CONFIRMED
                  </span>

                  <h3>
                    Mechanic booked successfully
                  </h3>

                  <p>
                    Assignment #
                    {assignment.id}
                    {" • "}
                    Status:{" "}
                    {assignment.status}
                  </p>

                  <p>
                    Your selected mechanic
                    will receive the request.
                  </p>

                </div>


                <div className="booking-success-actions">

                  <button
                    type="button"
                    className="track-assistance-btn"
                    onClick={() =>
                      setShowTracking(true)
                    }
                  >
                    📍 Track Assistance
                  </button>

                  <button
                    type="button"
                    className="back-dashboard-btn"
                    onClick={onBack}
                  >
                    ← Dashboard
                  </button>

                </div>

              </div>

            )}

          </div>

        )}


        {/* HOW IT WORKS */}

        <div className="request-info-card">

          <h2>
            How It Works
          </h2>


          <div className="request-step">

            <span>
              1
            </span>

            <div>

              <strong>
                Tell us your problem
              </strong>

              <p>
                Select your vehicle,
                problem and location.
              </p>

            </div>

          </div>


          <div className="request-step">

            <span>
              2
            </span>

            <div>

              <strong>
                Find nearby mechanics
              </strong>

              <p>
                We find available mechanics
                based on your location and
                problem type.
              </p>

            </div>

          </div>


          <div className="request-step">

            <span>
              3
            </span>

            <div>

              <strong>
                Choose a mechanic
              </strong>

              <p>
                Compare distance,
                specialization and rating,
                then book the mechanic
                you prefer.
              </p>

            </div>

          </div>


          <div className="request-step">

            <span>
              4
            </span>

            <div>

              <strong>
                Mechanic comes to you
              </strong>

              <p>
                The mechanic accepts,
                travels to your location,
                repairs your vehicle and
                completes the service.
              </p>

            </div>

          </div>


          <div className="emergency-info">

            🚨{" "}

            <strong>
              Emergency Mode
            </strong>

            <p>
              Emergency requests can still
              prioritize suitable nearby
              mechanics.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default RequestAssistance;