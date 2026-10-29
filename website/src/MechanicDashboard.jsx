import { useEffect, useRef, useState } from "react";

function MechanicDashboard({
  mechanicId,
  mechanicName,
  onLogout
}) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Live GPS state
  const [trackingAssignmentId, setTrackingAssignmentId] =
    useState(null);

  const [currentLocation, setCurrentLocation] =
    useState(null);

  const watchIdRef = useRef(null);

  // =========================================================
  // LOAD ASSIGNMENTS
  // =========================================================

  const loadAssignments = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/assignments/mechanic/${mechanicId}`
      );

      const data = await response.json();

      if (response.ok) {
        setAssignments(
          Array.isArray(data) ? data : []
        );
        setMessage("");
      } else {
        setMessage(
          "Unable to load assignments."
        );
      }

    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to the backend."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAssignments();
  }, [mechanicId]);


  // =========================================================
  // STOP GPS TRACKING
  // =========================================================

  const stopLocationTracking = () => {

    if (
      watchIdRef.current !== null &&
      navigator.geolocation
    ) {

      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    setTrackingAssignmentId(null);
  };


  // =========================================================
  // SEND LOCATION TO BACKEND
  // =========================================================

  const sendLocationToBackend = async (
    assignmentId,
    position
  ) => {

    const latitude =
      position.coords.latitude;

    const longitude =
      position.coords.longitude;

    const speedMetersPerSecond =
      position.coords.speed;

    let speedKmh = 0;

    if (
      typeof speedMetersPerSecond === "number" &&
      !Number.isNaN(speedMetersPerSecond)
    ) {

      speedKmh =
        speedMetersPerSecond * 3.6;
    }


    const locationPayload = {
      mechanicId: Number(mechanicId),
      latitude,
      longitude,
      speed: Number(
        speedKmh.toFixed(2)
      )
    };


    setCurrentLocation(
      locationPayload
    );


    try {

      const response = await fetch(
        "http://localhost:8080/api/mechanic-location",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(
            locationPayload
          )
        }
      );


      if (!response.ok) {

        const errorText =
          await response.text();

        console.error(
          "Location API error:",
          errorText
        );

        return;
      }

      console.log(
        `GPS updated for assignment #${assignmentId}`,
        locationPayload
      );

    } catch (error) {

      console.error(
        "Unable to send mechanic location:",
        error
      );
    }
  };


  // =========================================================
  // START GPS TRACKING
  // =========================================================

  const startLocationTracking = (
    assignmentId
  ) => {

    if (!navigator.geolocation) {

      setMessage(
        "Your browser does not support GPS location."
      );

      return;
    }


    // Avoid creating multiple GPS watchers.
    if (watchIdRef.current !== null) {

      setTrackingAssignmentId(
        assignmentId
      );

      return;
    }


    setTrackingAssignmentId(
      assignmentId
    );

    setMessage(
      "📍 Live GPS tracking started."
    );


    watchIdRef.current =
      navigator.geolocation.watchPosition(

        (position) => {

          sendLocationToBackend(
            assignmentId,
            position
          );
        },

        (error) => {

          console.error(
            "GPS error:",
            error
          );

          if (error.code === 1) {

            setMessage(
              "📍 Location permission was denied. Please allow location access in your browser."
            );

          } else if (error.code === 2) {

            setMessage(
              "📍 Your current location could not be detected."
            );

          } else if (error.code === 3) {

            setMessage(
              "📍 GPS request timed out. Retrying..."
            );

          } else {

            setMessage(
              "📍 Unable to access your location."
            );
          }
        },

        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000
        }
      );
  };


  // =========================================================
  // STOP GPS WHEN COMPONENT CLOSES
  // =========================================================

  useEffect(() => {

    return () => {
      stopLocationTracking();
    };

  }, []);


  // =========================================================
  // ACCEPT
  // =========================================================

  const acceptAssignment = async (
    assignmentId
  ) => {

    setUpdatingId(
      assignmentId
    );

    setMessage("");

    try {

      const response = await fetch(
        `http://localhost:8080/api/assignments/${assignmentId}/accept`,
        {
          method: "PUT"
        }
      );


      const data =
        await response.json();


      if (response.ok) {

        setMessage(
          `Assignment #${assignmentId} accepted successfully.`
        );

        await loadAssignments();

      } else {

        setMessage(
          typeof data === "string"
            ? data
            : "Unable to accept the assignment."
        );
      }

    } catch (error) {

      console.error(error);

      setMessage(
        "Unable to connect to the backend."
      );

    } finally {

      setUpdatingId(null);
    }
  };


  // =========================================================
  // REJECT
  // =========================================================

  const rejectAssignment = async (
    assignmentId
  ) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to reject assignment #${assignmentId}?`
      );


    if (!confirmed) {
      return;
    }


    setUpdatingId(
      assignmentId
    );

    setMessage("");


    try {

      const response = await fetch(
        `http://localhost:8080/api/assignments/${assignmentId}/reject`,
        {
          method: "PUT"
        }
      );


      const data =
        await response.json();


      if (response.ok) {

        // Stop tracking if this
        // assignment was being tracked.
        if (
          trackingAssignmentId ===
          assignmentId
        ) {
          stopLocationTracking();
        }


        setMessage(
          `Assignment #${assignmentId} rejected.`
        );

        await loadAssignments();

      } else {

        setMessage(
          typeof data === "string"
            ? data
            : "Unable to reject the assignment."
        );
      }

    } catch (error) {

      setMessage(
        "Unable to connect to the backend."
      );

    } finally {

      setUpdatingId(null);
    }
  };


  // =========================================================
  // UPDATE STATUS
  // =========================================================

  const updateStatus = async (
    assignmentId,
    newStatus
  ) => {

    setUpdatingId(
      assignmentId
    );

    setMessage("");


    try {

      const response = await fetch(
        `http://localhost:8080/api/assignments/${assignmentId}/status?status=${encodeURIComponent(
          newStatus
        )}`,
        {
          method: "PUT"
        }
      );


      const data =
        await response.json();


      if (response.ok) {

        /*
         * START JOURNEY
         *
         * Begin browser GPS tracking
         * only when the mechanic starts
         * travelling to the customer.
         */
        if (
          newStatus === "ON_THE_WAY"
        ) {

          startLocationTracking(
            assignmentId
          );
        }


        /*
         * When the mechanic reaches the
         * customer, stop live GPS.
         */
        if (
          newStatus === "ARRIVED"
        ) {

          stopLocationTracking();
        }


        /*
         * Also stop tracking once the job
         * enters service or is completed.
         */
        if (
          newStatus === "IN_SERVICE" ||
          newStatus === "COMPLETED" ||
          newStatus === "REJECTED"
        ) {

          stopLocationTracking();
        }


        setMessage(
          `Assignment #${assignmentId} changed to ${formatStatus(
            newStatus
          )}.`
        );


        await loadAssignments();

      } else {

        setMessage(
          typeof data === "string"
            ? data
            : "Unable to update assignment status."
        );
      }

    } catch (error) {

      console.error(error);

      setMessage(
        "Unable to connect to the backend."
      );

    } finally {

      setUpdatingId(null);
    }
  };


  // =========================================================
  // FORMAT STATUS
  // =========================================================

  const formatStatus = (status) => {

    if (!status) {
      return "Pending";
    }

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };


  // =========================================================
  // STATUS CSS
  // =========================================================

  const getStatusClass = (
    status
  ) => {

    switch (status) {

      case "PENDING":
        return "mechanic-status-pending";

      case "ACCEPTED":
        return "mechanic-status-accepted";

      case "REJECTED":
        return "mechanic-status-rejected";

      case "ON_THE_WAY":
        return "mechanic-status-way";

      case "ARRIVED":
        return "mechanic-status-arrived";

      case "IN_SERVICE":
        return "mechanic-status-service";

      case "COMPLETED":
        return "mechanic-status-completed";

      default:
        return "mechanic-status-pending";
    }
  };


  // =========================================================
  // NEXT ACTION
  // =========================================================

  const getNextAction = (
    assignment
  ) => {

    const status =
      assignment.status;


    if (status === "ACCEPTED") {

      return {
        label: "🚗 Start Journey",
        nextStatus: "ON_THE_WAY"
      };
    }


    if (
      status === "ON_THE_WAY"
    ) {

      return {
        label: "📍 Mark Arrived",
        nextStatus: "ARRIVED"
      };
    }


    if (
      status === "ARRIVED"
    ) {

      return {
        label: "🔧 Start Service",
        nextStatus: "IN_SERVICE"
      };
    }


    if (
      status === "IN_SERVICE"
    ) {

      return {
        label: "✅ Complete Service",
        nextStatus: "COMPLETED"
      };
    }


    return null;
  };


  // =========================================================
  // COUNTERS
  // =========================================================

  const totalRequests =
    assignments.length;


  const pendingRequests =
    assignments.filter(
      (assignment) =>
        assignment.status ===
        "PENDING"
    ).length;


  const activeRequests =
    assignments.filter(
      (assignment) =>
        [
          "ACCEPTED",
          "ON_THE_WAY",
          "ARRIVED",
          "IN_SERVICE"
        ].includes(
          assignment.status
        )
    ).length;


  const completedRequests =
    assignments.filter(
      (assignment) =>
        assignment.status ===
        "COMPLETED"
    ).length;


  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="mechanic-dashboard">

      {/* NAVBAR */}

      <nav className="mechanic-navbar">

        <div className="mechanic-logo">
          🔧
          <span>
            VehicleAssist
          </span>
        </div>


        <div className="mechanic-account">

          <div className="mechanic-avatar">
            {mechanicName
              ?.charAt(0)
              ?.toUpperCase() ||
              "M"}
          </div>


          <div className="mechanic-account-text">

            <strong>
              {mechanicName ||
                "Mechanic"}
            </strong>

            <span>
              Mechanic ID: {mechanicId}
            </span>

          </div>


          <button
            className="mechanic-logout-btn"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </nav>


      {/* MAIN */}

      <main className="mechanic-content">

        {/* WELCOME */}

        <section className="mechanic-welcome">

          <div>

            <p className="mechanic-label">
              MECHANIC DASHBOARD
            </p>

            <h1>
              Welcome,{" "}
              {mechanicName ||
                "Mechanic"}{" "}
              👋
            </h1>

            <p>
              Manage your roadside
              assistance assignments.
            </p>

          </div>


          <button
            className="mechanic-refresh-btn"
            onClick={
              loadAssignments
            }
          >
            🔄 Refresh
          </button>

        </section>


        {/* MESSAGE */}

        {message && (
          <div className="mechanic-message">
            {message}
          </div>
        )}


        {/* LIVE GPS STATUS */}

        <section
          className="mechanic-gps-status"
          style={{
            marginBottom: "24px",
            padding: "16px",
            borderRadius: "12px",
            background:
              trackingAssignmentId !==
              null
                ? "#eaf9f0"
                : "#f5f7fb",
            border:
              trackingAssignmentId !==
              null
                ? "1px solid #bde7cf"
                : "1px solid #e1e6ee"
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}
          >

            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background:
                  trackingAssignmentId !==
                  null
                    ? "#d5f3e2"
                    : "#eaf0f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px"
              }}
            >
              📍
            </div>


            <div>

              <strong
                style={{
                  display: "block",
                  color: "#172033",
                  fontSize: "14px"
                }}
              >
                {trackingAssignmentId !==
                null
                  ? "Live GPS Tracking Active"
                  : "GPS Tracking Inactive"}
              </strong>


              <span
                style={{
                  display: "block",
                  color: "#6b7280",
                  fontSize: "12px",
                  marginTop: "4px"
                }}
              >
                {trackingAssignmentId !==
                null
                  ? `Tracking Assignment #${trackingAssignmentId}`
                  : "GPS starts when you click Start Journey."}
              </span>


              {currentLocation && (
                <span
                  style={{
                    display: "block",
                    color: "#16834b",
                    fontSize: "11px",
                    marginTop: "4px"
                  }}
                >
                  {currentLocation.latitude.toFixed(
                    6
                  )}
                  ,{" "}
                  {currentLocation.longitude.toFixed(
                    6
                  )}
                  {" • "}
                  {currentLocation.speed ||
                    0}
                  {" km/h"}
                </span>
              )}

            </div>

          </div>

        </section>


        {/* STATISTICS */}

        <section className="mechanic-stats">

          <div className="mechanic-stat-card">

            <div className="mechanic-stat-icon blue">
              📋
            </div>

            <div>

              <span>
                Total Requests
              </span>

              <strong>
                {totalRequests}
              </strong>

            </div>

          </div>


          <div className="mechanic-stat-card">

            <div className="mechanic-stat-icon orange">
              ⏳
            </div>

            <div>

              <span>
                Pending
              </span>

              <strong>
                {pendingRequests}
              </strong>

            </div>

          </div>


          <div className="mechanic-stat-card">

            <div className="mechanic-stat-icon purple">
              🚗
            </div>

            <div>

              <span>
                Active Jobs
              </span>

              <strong>
                {activeRequests}
              </strong>

            </div>

          </div>


          <div className="mechanic-stat-card">

            <div className="mechanic-stat-icon green">
              ✅
            </div>

            <div>

              <span>
                Completed
              </span>

              <strong>
                {completedRequests}
              </strong>

            </div>

          </div>

        </section>


        {/* ASSIGNMENTS */}

        <section className="mechanic-section">

          <div className="mechanic-section-heading">

            <div>

              <h2>
                My Assignments
              </h2>

              <p>
                Breakdown requests
                assigned to you.
              </p>

            </div>

          </div>


          {/* LOADING */}

          {loading && (
            <div className="mechanic-empty-card">

              <div className="mechanic-empty-icon">
                🔄
              </div>

              <h3>
                Loading assignments...
              </h3>

              <p>
                Please wait while
                we load your requests.
              </p>

            </div>
          )}


          {/* EMPTY */}

          {!loading &&
            assignments.length === 0 && (
              <div className="mechanic-empty-card">

                <div className="mechanic-empty-icon">
                  📋
                </div>

                <h3>
                  No assignments
                </h3>

                <p>
                  New roadside assistance
                  requests will appear here.
                </p>

              </div>
            )}


          {/* ASSIGNMENTS */}

          {!loading &&
            assignments.length > 0 && (

              <div className="mechanic-assignment-list">

                {assignments.map(
                  (assignment) => {

                    const nextAction =
                      getNextAction(
                        assignment
                      );


                    return (
                      <div
                        className="mechanic-assignment-card"
                        key={
                          assignment.id
                        }
                      >

                        {/* HEADER */}

                        <div className="mechanic-assignment-top">

                          <div className="mechanic-request-info">

                            <div className="mechanic-request-icon">
                              🚨
                            </div>

                            <div>

                              <h3>
                                Assignment #
                                {assignment.id}
                              </h3>

                              <p>
                                Breakdown Request #
                                {
                                  assignment.breakdownId
                                }
                              </p>

                            </div>

                          </div>


                          <span
                            className={`mechanic-status ${getStatusClass(
                              assignment.status
                            )}`}
                          >
                            {formatStatus(
                              assignment.status
                            )}
                          </span>

                        </div>


                        {/* DETAILS */}

                        <div className="mechanic-assignment-details">

                          <div className="mechanic-detail">

                            <span>
                              📋
                            </span>

                            <div>

                              <small>
                                Assignment
                              </small>

                              <strong>
                                #
                                {
                                  assignment.id
                                }
                              </strong>

                            </div>

                          </div>


                          <div className="mechanic-detail">

                            <span>
                              🚨
                            </span>

                            <div>

                              <small>
                                Breakdown
                              </small>

                              <strong>
                                #
                                {
                                  assignment.breakdownId
                                }
                              </strong>

                            </div>

                          </div>


                          <div className="mechanic-detail">

                            <span>
                              📍
                            </span>

                            <div>

                              <small>
                                Distance
                              </small>

                              <strong>
                                {assignment.distanceKm !=
                                null
                                  ? `${assignment.distanceKm} km`
                                  : "Not available"}
                              </strong>

                            </div>

                          </div>


                          <div className="mechanic-detail">

                            <span>
                              🕐
                            </span>

                            <div>

                              <small>
                                Assigned
                              </small>

                              <strong>
                                {assignment.assignedAt
                                  ? new Date(
                                      assignment.assignedAt
                                    ).toLocaleString()
                                  : "Not available"}
                              </strong>

                            </div>

                          </div>

                        </div>


                        {/* ACTIONS */}

                        <div className="mechanic-assignment-actions">

                          {/* PENDING */}

                          {assignment.status ===
                            "PENDING" && (
                            <>
                              <button
                                className="mechanic-accept-btn"
                                onClick={() =>
                                  acceptAssignment(
                                    assignment.id
                                  )
                                }
                                disabled={
                                  updatingId ===
                                  assignment.id
                                }
                              >
                                {updatingId ===
                                assignment.id
                                  ? "Processing..."
                                  : "✅ Accept Request"}
                              </button>


                              <button
                                className="mechanic-reject-btn"
                                onClick={() =>
                                  rejectAssignment(
                                    assignment.id
                                  )
                                }
                                disabled={
                                  updatingId ===
                                  assignment.id
                                }
                              >
                                ❌ Reject
                              </button>
                            </>
                          )}


                          {/* NEXT STATUS */}

                          {nextAction && (
                            <button
                              className="mechanic-next-btn"
                              onClick={() =>
                                updateStatus(
                                  assignment.id,
                                  nextAction.nextStatus
                                )
                              }
                              disabled={
                                updatingId ===
                                assignment.id
                              }
                            >
                              {updatingId ===
                              assignment.id
                                ? "Updating..."
                                : nextAction.label}
                            </button>
                          )}


                          {/* COMPLETED */}

                          {assignment.status ===
                            "COMPLETED" && (
                            <div className="mechanic-completed-box">
                              ✅ Service Completed
                            </div>
                          )}


                          {/* REJECTED */}

                          {assignment.status ===
                            "REJECTED" && (
                            <div className="mechanic-rejected-box">
                              ❌ Assignment Rejected
                            </div>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

        </section>

      </main>


      {/* FOOTER */}

      <footer className="mechanic-footer">

        <p>
          © 2026 VehicleAssist
        </p>

        <p>
          Mechanic Assistance Portal
        </p>

      </footer>

    </div>
  );
}

export default MechanicDashboard;