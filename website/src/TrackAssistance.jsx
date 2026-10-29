import { useEffect, useMemo, useState } from "react";

function TrackAssistance({ assignment, onBack }) {
  const [assignmentData, setAssignmentData] = useState(
    assignment || null
  );

  const [assignmentStatus, setAssignmentStatus] = useState(
    assignment?.status || "PENDING"
  );

  const [mechanic, setMechanic] = useState(null);
  const [location, setLocation] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [eta, setEta] = useState(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const breakdownId = assignment?.breakdownId;
  const mechanicId = assignment?.mechanicId;

  const formatStatus = (status) => {
    if (!status) {
      return "Pending";
    }

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "PENDING":
        return "customer-assist-status pending";

      case "ACCEPTED":
        return "customer-assist-status accepted";

      case "ON_THE_WAY":
        return "customer-assist-status way";

      case "ARRIVED":
        return "customer-assist-status arrived";

      case "IN_SERVICE":
        return "customer-assist-status service";

      case "COMPLETED":
        return "customer-assist-status completed";

      case "REJECTED":
        return "customer-assist-status rejected";

      default:
        return "customer-assist-status pending";
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "PENDING":
        return "Waiting for the mechanic to respond.";

      case "ACCEPTED":
        return "Your mechanic accepted the request.";

      case "ON_THE_WAY":
        return "Your mechanic is travelling to your location.";

      case "ARRIVED":
        return "Your mechanic has arrived at your location.";

      case "IN_SERVICE":
        return "Your vehicle is currently being repaired.";

      case "COMPLETED":
        return "Your roadside assistance is completed.";

      case "REJECTED":
        return "This mechanic rejected the request.";

      default:
        return "Your assistance request is being processed.";
    }
  };

  const loadTrackingData = async () => {
    if (!breakdownId || !mechanicId) {
      setMessage(
        "Tracking information is not available."
      );
      setLoading(false);
      return;
    }

    try {
      // -----------------------------------------------------
      // ASSIGNMENT
      // -----------------------------------------------------

      const assignmentResponse = await fetch(
        `http://localhost:8080/api/assignments/${assignment.id}`
      );

      if (assignmentResponse.ok) {
        const assignmentResult =
          await assignmentResponse.json();

        setAssignmentData(assignmentResult);

        setAssignmentStatus(
          assignmentResult.status || "PENDING"
        );
      }

      // -----------------------------------------------------
      // MECHANIC PROFILE
      // -----------------------------------------------------

      const mechanicResponse = await fetch(
        `http://localhost:8080/api/mechanics/${mechanicId}`
      );

      if (mechanicResponse.ok) {
        const mechanicData =
          await mechanicResponse.json();

        setMechanic(mechanicData);
      }

      // -----------------------------------------------------
      // CUSTOMER / BREAKDOWN LOCATION
      // -----------------------------------------------------

      const breakdownResponse = await fetch(
        `http://localhost:8080/api/breakdowns/${breakdownId}`
      );

      if (breakdownResponse.ok) {
        const breakdownData =
          await breakdownResponse.json();

        setBreakdown(breakdownData);
      }

      // -----------------------------------------------------
      // LIVE MECHANIC LOCATION
      // -----------------------------------------------------

      const locationResponse = await fetch(
        `http://localhost:8080/api/mechanic-location/${mechanicId}`
      );

      if (locationResponse.ok) {
        const locationData =
          await locationResponse.json();

        setLocation(locationData);

        setLastUpdated(
          locationData.updatedAt || null
        );
      }

      // -----------------------------------------------------
      // ETA
      // -----------------------------------------------------

      const etaResponse = await fetch(
        `http://localhost:8080/api/eta/${breakdownId}`
      );

      if (etaResponse.ok) {
        const etaData =
          await etaResponse.json();

        setEta(etaData);
      }

      setMessage("");

    } catch (error) {
      console.error(
        "Tracking error:",
        error
      );

      setMessage(
        "Unable to update live tracking data."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // REFRESH EVERY 5 SECONDS
  // ---------------------------------------------------------

  useEffect(() => {
    loadTrackingData();

    const interval = setInterval(
      loadTrackingData,
      5000
    );

    return () => clearInterval(interval);
  }, [breakdownId, mechanicId]);

  // =========================================================
  // DYNAMIC MAP POSITION
  // =========================================================

  const mapPosition = useMemo(() => {
    const customerLat =
      breakdown?.latitude;

    const customerLng =
      breakdown?.longitude;

    const mechanicLat =
      location?.latitude;

    const mechanicLng =
      location?.longitude;

    if (
      customerLat == null ||
      customerLng == null ||
      mechanicLat == null ||
      mechanicLng == null
    ) {
      return null;
    }

    const minLat =
      Math.min(
        customerLat,
        mechanicLat
      );

    const maxLat =
      Math.max(
        customerLat,
        mechanicLat
      );

    const minLng =
      Math.min(
        customerLng,
        mechanicLng
      );

    const maxLng =
      Math.max(
        customerLng,
        mechanicLng
      );

    // Add padding so markers don't touch edges.
    const latPadding =
      Math.max(
        (maxLat - minLat) * 0.35,
        0.0005
      );

    const lngPadding =
      Math.max(
        (maxLng - minLng) * 0.35,
        0.0005
      );

    const paddedMinLat =
      minLat - latPadding;

    const paddedMaxLat =
      maxLat + latPadding;

    const paddedMinLng =
      minLng - lngPadding;

    const paddedMaxLng =
      maxLng + lngPadding;

    const latRange =
      paddedMaxLat -
      paddedMinLat;

    const lngRange =
      paddedMaxLng -
      paddedMinLng;

    let customerX =
      ((customerLng -
        paddedMinLng) /
        lngRange) *
      100;

    let customerY =
      100 -
      ((customerLat -
        paddedMinLat) /
        latRange) *
      100;

    let mechanicX =
      ((mechanicLng -
        paddedMinLng) /
        lngRange) *
      100;

    let mechanicY =
      100 -
      ((mechanicLat -
        paddedMinLat) /
        latRange) *
      100;

    // Clamp inside the map.
    customerX =
      Math.max(
        8,
        Math.min(
          92,
          customerX
        )
      );

    customerY =
      Math.max(
        8,
        Math.min(
          92,
          customerY
        )
      );

    mechanicX =
      Math.max(
        8,
        Math.min(
          92,
          mechanicX
        )
      );

    mechanicY =
      Math.max(
        8,
        Math.min(
          92,
          mechanicY
        )
      );

    return {
      customer: {
        left: `${customerX}%`,
        top: `${customerY}%`
      },

      mechanic: {
        left: `${mechanicX}%`,
        top: `${mechanicY}%`
      }
    };
  }, [
    breakdown,
    location
  ]);

  // =========================================================
  // DISTANCE
  // =========================================================

  const distanceText =
    assignmentData?.distanceKm != null
      ? `${Number(
          assignmentData.distanceKm
        ).toFixed(2)} km`
      : "Calculating...";

  // =========================================================
  // ETA
  // =========================================================

  const etaText = () => {
    if (!eta) {
      return "Calculating...";
    }

    if (
      eta.etaMinutes !== undefined &&
      eta.etaMinutes !== null
    ) {
      return `${eta.etaMinutes} min`;
    }

    if (
      eta.estimatedMinutes !== undefined &&
      eta.estimatedMinutes !== null
    ) {
      return `${eta.estimatedMinutes} min`;
    }

    if (
      eta.estimatedTime !== undefined &&
      eta.estimatedTime !== null
    ) {
      return String(
        eta.estimatedTime
      );
    }

    if (
      eta.eta !== undefined &&
      eta.eta !== null
    ) {
      return String(
        eta.eta
      );
    }

    return "Calculating...";
  };

  // =========================================================
  // LAST UPDATE
  // =========================================================

  const lastUpdatedText = () => {
    if (!lastUpdated) {
      return "Waiting for GPS...";
    }

    const date =
      new Date(lastUpdated);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(
        lastUpdated
      );
    }

    return date.toLocaleTimeString();
  };

  // =========================================================
  // PROGRESS
  // =========================================================

  const getProgressClass = (
    stepStatus
  ) => {
    const order = [
      "PENDING",
      "ACCEPTED",
      "ON_THE_WAY",
      "ARRIVED",
      "IN_SERVICE",
      "COMPLETED"
    ];

    const currentIndex =
      order.indexOf(
        assignmentStatus
      );

    const stepIndex =
      order.indexOf(
        stepStatus
      );

    if (
      assignmentStatus ===
      "REJECTED"
    ) {
      return "";
    }

    if (
      currentIndex >= stepIndex &&
      stepIndex >= 0
    ) {
      return "tracking-progress-done";
    }

    return "";
  };

  return (
    <div className="tracking-page">

      {/* HEADER */}

      <div className="tracking-header">

        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Back
        </button>

        <p className="tracking-label">
          LIVE ASSISTANCE
        </p>

        <h1>
          📍 Track Assistance
        </h1>

        <p>
          Follow your mechanic's live
          location and service status.
        </p>

      </div>


      <main className="tracking-container">

        {/* MECHANIC */}

        <section className="tracking-mechanic-card">

          <div className="tracking-mechanic-avatar">
            🔧
          </div>

          <div className="tracking-mechanic-info">

            <span>
              YOUR BOOKED MECHANIC
            </span>

            <h2>
              {mechanic?.name ||
                `Mechanic #${mechanicId}`}
            </h2>

            <p>
              {mechanic?.specialization ||
                "Vehicle Assistance"}
            </p>

            <div className="tracking-mechanic-meta">

              <span>
                ⭐{" "}
                {mechanic?.rating != null
                  ? mechanic.rating
                  : "New"}
              </span>

              <span>
                📍{" "}
                {mechanic?.location ||
                  "Live location"}
              </span>

              <span
                className={
                  mechanic?.available
                    ? "tracking-available"
                    : "tracking-unavailable"
                }
              >
                {mechanic?.available
                  ? "● Available"
                  : "● Busy"}
              </span>

            </div>

          </div>

          <div className="tracking-shop-status">

            <span className="tracking-status-small">
              STATUS
            </span>

            <span
              className={getStatusClass(
                assignmentStatus
              )}
            >
              {formatStatus(
                assignmentStatus
              )}
            </span>

          </div>

        </section>


        {/* STATUS */}

        <section className="tracking-status-card">

          <div className="tracking-status-icon">

            {assignmentStatus ===
            "COMPLETED"
              ? "✅"
              : assignmentStatus ===
                "ON_THE_WAY"
              ? "🚗"
              : assignmentStatus ===
                "ARRIVED"
              ? "📍"
              : assignmentStatus ===
                "IN_SERVICE"
              ? "🔧"
              : "⏳"}

          </div>

          <div>

            <span className="status-label">
              CURRENT STATUS
            </span>

            <h2>
              {formatStatus(
                assignmentStatus
              )}
            </h2>

            <p>
              {getStatusMessage(
                assignmentStatus
              )}
            </p>

          </div>

        </section>


        {message && (
          <div className="tracking-message">
            {message}
          </div>
        )}


        {/* =====================================================
            LIVE MAP
        ===================================================== */}

        <section className="tracking-map-card">

          <div className="tracking-map-real">

            {/* GRID */}

            <div className="live-map-grid"></div>


            {/* ROAD LINES */}

            <div className="live-map-road road-one"></div>
            <div className="live-map-road road-two"></div>
            <div className="live-map-road road-three"></div>


            {mapPosition ? (
              <>

                {/* ROUTE */}

                <svg
                  className="live-map-route-svg"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >

                  <line
                    x1={
                      parseFloat(
                        mapPosition
                          .customer
                          .left
                      )
                    }
                    y1={
                      parseFloat(
                        mapPosition
                          .customer
                          .top
                      )
                    }
                    x2={
                      parseFloat(
                        mapPosition
                          .mechanic
                          .left
                      )
                    }
                    y2={
                      parseFloat(
                        mapPosition
                          .mechanic
                          .top
                      )
                    }
                    stroke="#176bff"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />

                </svg>


                {/* CUSTOMER */}

                <div
                  className="live-map-marker customer"
                  style={{
                    left:
                      mapPosition
                        .customer
                        .left,

                    top:
                      mapPosition
                        .customer
                        .top
                  }}
                >

                  <span>
                    📍
                  </span>

                  <small>
                    You
                  </small>

                </div>


                {/* MECHANIC */}

                <div
                  className={`live-map-marker mechanic ${
                    assignmentStatus ===
                    "ON_THE_WAY"
                      ? "moving"
                      : ""
                  }`}
                  style={{
                    left:
                      mapPosition
                        .mechanic
                        .left,

                    top:
                      mapPosition
                        .mechanic
                        .top
                  }}
                >

                  <span>
                    🔧
                  </span>

                  <small>
                    {mechanic?.name ||
                      "Mechanic"}
                  </small>

                </div>

              </>
            ) : (

              <div className="live-map-no-location">

                <div>
                  📍
                </div>

                <h3>
                  Waiting for live location
                </h3>

                <p>
                  The mechanic's GPS position
                  will appear here.
                </p>

              </div>

            )}


            {/* MAP INFO */}

            <div className="live-map-info-card">

              <strong>
                {mechanic?.name ||
                  "Mechanic"}
              </strong>

              <span>
                {location
                  ? "🟢 Live GPS"
                  : "🟡 Waiting for GPS"}
              </span>

              {location && (
                <span>
                  {Number(
                    location.latitude
                  ).toFixed(5)}
                  ,
                  {" "}
                  {Number(
                    location.longitude
                  ).toFixed(5)}
                </span>
              )}

            </div>


            {/* REFRESH */}

            <div className="live-map-refresh">

              🔄 Updating every 5 seconds

            </div>

          </div>

        </section>


        {/* DETAILS */}

        <section className="tracking-details-card">

          <div className="tracking-section-heading">

            <div>

              <h2>
                Live Information
              </h2>

              <p>
                Data updates automatically
                while assistance is active.
              </p>

            </div>

            <span className="tracking-live-indicator">

              <span></span>
              LIVE

            </span>

          </div>


          <div className="tracking-details-grid">

            <div className="tracking-detail">

              <span>
                📋
              </span>

              <div>

                <small>
                  Request ID
                </small>

                <strong>
                  #{breakdownId || "—"}
                </strong>

              </div>

            </div>


            <div className="tracking-detail">

              <span>
                🔧
              </span>

              <div>

                <small>
                  Mechanic / Shop
                </small>

                <strong>
                  {mechanic?.name ||
                    `Mechanic #${mechanicId}`}
                </strong>

              </div>

            </div>


            <div className="tracking-detail">

              <span>
                📏
              </span>

              <div>

                <small>
                  Distance
                </small>

                <strong>
                  {distanceText}
                </strong>

              </div>

            </div>


            <div className="tracking-detail">

              <span>
                🚗
              </span>

              <div>

                <small>
                  Speed
                </small>

                <strong>
                  {location?.speed !=
                  null
                    ? `${location.speed} km/h`
                    : "Not available"}
                </strong>

              </div>

            </div>


            <div className="tracking-detail">

              <span>
                📍
              </span>

              <div>

                <small>
                  GPS
                </small>

                <strong>
                  {location
                    ? "Live"
                    : "Waiting"}
                </strong>

              </div>

            </div>


            <div className="tracking-detail">

              <span>
                ⏱️
              </span>

              <div>

                <small>
                  Estimated Arrival
                </small>

                <strong>
                  {etaText()}
                </strong>

              </div>

            </div>

          </div>


          <div className="tracking-last-updated">

            📡

            <span>
              Last GPS update:
              {" "}
              {lastUpdatedText()}
            </span>

          </div>

        </section>


        {/* PROGRESS */}

        <section className="tracking-timeline-card">

          <h2>
            Assistance Progress
          </h2>


          <div className="tracking-progress-list">


            <div
              className={`tracking-progress-item ${
                getProgressClass(
                  "PENDING"
                )
              }`}
            >

              <div className="tracking-progress-dot">
                ✓
              </div>

              <div>

                <h3>
                  Request Created
                </h3>

                <p>
                  Assistance request received.
                </p>

              </div>

            </div>


            <div
              className={`tracking-progress-item ${
                getProgressClass(
                  "ACCEPTED"
                )
              }`}
            >

              <div className="tracking-progress-dot">
                2
              </div>

              <div>

                <h3>
                  Mechanic Accepted
                </h3>

                <p>
                  Your mechanic accepted
                  the booking.
                </p>

              </div>

            </div>


            <div
              className={`tracking-progress-item ${
                getProgressClass(
                  "ON_THE_WAY"
                )
              }`}
            >

              <div className="tracking-progress-dot">
                3
              </div>

              <div>

                <h3>
                  Mechanic On The Way
                </h3>

                <p>
                  Live location tracking
                  is active.
                </p>

              </div>

            </div>


            <div
              className={`tracking-progress-item ${
                getProgressClass(
                  "ARRIVED"
                )
              }`}
            >

              <div className="tracking-progress-dot">
                4
              </div>

              <div>

                <h3>
                  Mechanic Arrived
                </h3>

                <p>
                  Mechanic reached your
                  location.
                </p>

              </div>

            </div>


            <div
              className={`tracking-progress-item ${
                getProgressClass(
                  "IN_SERVICE"
                )
              }`}
            >

              <div className="tracking-progress-dot">
                5
              </div>

              <div>

                <h3>
                  Service Started
                </h3>

                <p>
                  Vehicle repair is in progress.
                </p>

              </div>

            </div>


            <div
              className={`tracking-progress-item ${
                getProgressClass(
                  "COMPLETED"
                )
              }`}
            >

              <div className="tracking-progress-dot">
                6
              </div>

              <div>

                <h3>
                  Service Completed
                </h3>

                <p>
                  Roadside assistance completed.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* REFRESH */}

        <section className="tracking-refresh-info">

          <span>
            🔄
          </span>

          <div>

            <strong>
              Live tracking enabled
            </strong>

            <p>
              The mechanic position is
              refreshed every 5 seconds.
            </p>

          </div>

        </section>


        {/* SAFETY */}

        <section className="tracking-safety">

          <div className="tracking-safety-icon">
            🛡️
          </div>

          <div>

            <h3>
              Stay safe while waiting
            </h3>

            <p>
              Move your vehicle to a safe
              location if possible, turn on
              hazard lights and stay away
              from moving traffic.
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}

export default TrackAssistance;