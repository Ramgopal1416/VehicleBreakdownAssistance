import React, { useEffect, useState } from "react";

import "./App.css";
import "./Dashboard.css";

import Vehicles from "./Vehicles";
import RequestAssistance from "./RequestAssistance";
import MyRequests from "./MyRequests";
import TrackAssistance from "./TrackAssistance";
import Feedback from "./Feedback";

const API_BASE = "http://localhost:8080";

function Dashboard({ user, onLogout }) {
  const [loggedInUser, setLoggedInUser] = useState(user || null);

  const [activePage, setActivePage] = useState("dashboard");

  const [latestRequest, setLatestRequest] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [mechanic, setMechanic] = useState(null);

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackAssignment, setFeedbackAssignment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setLoggedInUser(user);
      return;
    }

    try {
      const savedUser = localStorage.getItem("loggedInUser");

      if (savedUser) {
        setLoggedInUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error("Unable to read logged-in user:", err);
    }
  }, [user]);

  const userId = loggedInUser?.id;

// 
const loadDashboardData = async () => {
  if (!userId) {
    setLoading(false);
    return;
  }

  try {
    setError("");

    // Get customer requests
    const requestsResponse = await fetch(
      API_BASE + "/api/breakdowns/user/" + userId
    );

    if (!requestsResponse.ok) {
      throw new Error("Unable to load your requests.");
    }

    const requests = await requestsResponse.json();

    if (!Array.isArray(requests) || requests.length === 0) {
      setLatestRequest(null);
      setAssignment(null);
      setMechanic(null);
      setShowFeedback(false);
      setFeedbackAssignment(null);
      setLoading(false);
      return;
    }

    // Sort requests newest first
    const sortedRequests = requests.slice().sort((a, b) => {
      const dateA = new Date(a.requestedAt || 0).getTime();
      const dateB = new Date(b.requestedAt || 0).getTime();

      return dateB - dateA;
    });

    const latest = sortedRequests[0];

    setLatestRequest(latest);

    // Get assignment
    let currentAssignment = null;

    try {
      const assignmentResponse = await fetch(
        API_BASE + "/api/assignments/breakdown/" + latest.id
      );

      if (assignmentResponse.ok) {
        const assignmentData = await assignmentResponse.json();

        if (Array.isArray(assignmentData)) {
          if (assignmentData.length > 0) {
            const completedAssignment = assignmentData.find(
              (item) =>
                String(item?.status || "")
                  .trim()
                  .toUpperCase() === "COMPLETED"
            );

            currentAssignment =
              completedAssignment ||
              assignmentData[assignmentData.length - 1];
          }
        } else if (assignmentData) {
          currentAssignment = assignmentData;
        }
      }
    } catch (assignmentError) {
      console.error(
        "Unable to load assignment:",
        assignmentError
      );
    }

    setAssignment(currentAssignment);

    // Get mechanic details
    if (currentAssignment?.mechanicId) {
      try {
        const mechanicResponse = await fetch(
          API_BASE +
            "/api/mechanics/" +
            currentAssignment.mechanicId
        );

        if (mechanicResponse.ok) {
          const mechanicData = await mechanicResponse.json();
          setMechanic(mechanicData);
        } else {
          setMechanic(null);
        }
      } catch (mechanicError) {
        console.error(
          "Unable to load mechanic:",
          mechanicError
        );

        setMechanic(null);
      }
    } else {
      setMechanic(null);
    }

    // Show feedback after service is completed
    const currentAssignmentStatus = String(
      currentAssignment?.status || ""
    )
      .trim()
      .toUpperCase();

    if (
      currentAssignmentStatus === "COMPLETED" &&
      currentAssignment?.mechanicId &&
      currentAssignment?.breakdownId
    ) {
      const breakdownId = Number(
        currentAssignment.breakdownId
      );

      const feedbackKey =
        "vehicleassist-feedback-v3-" + breakdownId;

      const feedbackAssignmentData = {
        ...currentAssignment,
        breakdownId,
        mechanicId: Number(
          currentAssignment.mechanicId
        ),
      };

      const alreadySubmitted =
        localStorage.getItem(feedbackKey) === "true";

      if (!alreadySubmitted) {
        // Prepare the popup immediately.
        setFeedbackAssignment(feedbackAssignmentData);
        setShowFeedback(true);

        try {
          const feedbackResponse = await fetch(
            API_BASE +
              "/api/feedback/breakdown/" +
              breakdownId
          );

          if (feedbackResponse.ok) {
            const feedbackData =
              await feedbackResponse.json();

            const hasFeedback = Array.isArray(feedbackData)
              ? feedbackData.length > 0
              : Boolean(feedbackData);

            if (hasFeedback) {
              localStorage.setItem(
                feedbackKey,
                "true"
              );

              setShowFeedback(false);
              setFeedbackAssignment(null);
            }
          }
        } catch (feedbackError) {
          console.error(
            "Unable to check feedback:",
            feedbackError
          );

          // Keep the feedback popup open if the check fails.
        }
      }
    }

    setLoading(false);
  } catch (error) {
    console.error(
      "Dashboard loading error:",
      error
    );

    setError(
      error.message ||
        "Unable to load dashboard."
    );

    setLoading(false);
  }
};
  // ---------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------

  useEffect(() => {
    if (userId) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  // ---------------------------------------------
  // AUTO REFRESH
  // ---------------------------------------------

  useEffect(() => {
    if (!userId) {
      return;
    }

    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [userId]);

  // ---------------------------------------------
  // FEEDBACK COMPLETE
  // ---------------------------------------------
const handleFeedbackComplete = () => {
  if (feedbackAssignment?.breakdownId) {
    localStorage.setItem(
      "vehicleassist-feedback-v3-" +
        feedbackAssignment.breakdownId,
      "true"
    );
  }

  setShowFeedback(false);
  setFeedbackAssignment(null);

  loadDashboardData();
};
  // ---------------------------------------------
  // LOGOUT
  // ---------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");

    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  // ---------------------------------------------
  // STATUS
  // ---------------------------------------------

  const getAssignmentStatus = () => {
    return String(assignment?.status || "")
      .trim()
      .toUpperCase();
  };

  const getStatusLabel = () => {
    if (!assignment) {
      if (latestRequest?.status === "REQUESTED") {
        return "Finding Mechanics";
      }

      if (latestRequest?.status === "BOOKED") {
        return "Mechanic Booking";
      }

      return "Ready";
    }

    switch (assignment.status) {
      case "PENDING":
        return "Waiting for Mechanic";

      case "ACCEPTED":
        return "Accepted";

      case "ON_THE_WAY":
        return "On The Way";

      case "ARRIVED":
        return "Mechanic Arrived";

      case "IN_SERVICE":
        return "Service In Progress";

      case "COMPLETED":
        return "Completed";

      case "REJECTED":
        return "Rejected";

      default:
        return assignment.status || "Processing";
    }
  };

  // ---------------------------------------------
  // PROGRESS
  // ---------------------------------------------

  const getProgress = () => {
    if (!assignment) {
      return latestRequest ? 20 : 0;
    }

    switch (assignment.status) {
      case "PENDING":
        return 20;

      case "ACCEPTED":
        return 40;

      case "ON_THE_WAY":
        return 60;

      case "ARRIVED":
        return 75;

      case "IN_SERVICE":
        return 90;

      case "COMPLETED":
        return 100;

      default:
        return 10;
    }
  };

  // ---------------------------------------------
  // DASHBOARD HOME
  // ---------------------------------------------

  const renderHome = () => {
    const progress = getProgress();

    return (
      <>
        {/* WELCOME */}

        <section className="dashboard-welcome">

          <div>

            <p className="dashboard-small-title">
              CUSTOMER DASHBOARD
            </p>

            <h1>
              Welcome back,{" "}
              {loggedInUser?.name || "Customer"} 👋
            </h1>

            <p>
              Manage your vehicles, request roadside
              assistance and track your mechanic.
            </p>

          </div>

          <div className="dashboard-user-badge">

            <div className="customer-avatar">
              {(loggedInUser?.name || "C")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <strong>
                {loggedInUser?.name || "Customer"}
              </strong>

              <span>
                Customer Account
              </span>

            </div>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}

        <section className="dashboard-stats">

  <button
    type="button"
    className="dashboard-stat-card clickable"
    onClick={() => setActivePage("vehicles")}
  >
    <div className="stat-icon">🚗</div>

    <div>
      <span>My Vehicles</span>
      <strong>Manage</strong>
    </div>
  </button>

  <button
    type="button"
    className="dashboard-stat-card clickable"
    onClick={() => setActivePage("request")}
  >
    <div className="stat-icon">🆘</div>

    <div>
      <span>Assistance</span>
      <strong>
        {latestRequest ? "Active" : "Ready"}
      </strong>
    </div>
  </button>

  <button
    type="button"
    className="dashboard-stat-card clickable"
    onClick={() => {
      if (
        assignment &&
        !["COMPLETED", "REJECTED"].includes(
          assignment.status
        )
      ) {
        setActivePage("tracking");
      } else {
        setActivePage("requests");
      }
    }}
  >
    <div className="stat-icon">🔧</div>

    <div>
      <span>Mechanic</span>
      <strong>
        {mechanic?.name || "Not Assigned"}
      </strong>
    </div>
  </button>

  <button
    type="button"
    className="dashboard-stat-card clickable"
    onClick={() => {
      if (
        assignment &&
        !["COMPLETED", "REJECTED"].includes(
          assignment.status
        )
      ) {
        setActivePage("tracking");
      } else {
        setActivePage("requests");
      }
    }}
  >
    <div className="stat-icon">📍</div>

    <div>
      <span>Status</span>
      <strong>{getStatusLabel()}</strong>
    </div>
  </button>

</section>
        {/* MAIN DASHBOARD */}

        <section className="dashboard-main-grid">

          {/* CURRENT ASSISTANCE */}

          <div className="dashboard-main-card">

            <div className="dashboard-card-header">

              <div>

                <p className="dashboard-card-label">
                  CURRENT ASSISTANCE
                </p>

                <h2>
                  {latestRequest
                    ? "REQUEST #" +
                      latestRequest.id
                    : "No Active Request"}
                </h2>

              </div>

              {latestRequest && (
                <div className="request-status">
                  {getStatusLabel()}
                </div>
              )}

            </div>

            {latestRequest ? (
              <>
                {/* REQUEST DETAILS */}

                <div className="request-info-grid">

                  <div className="request-info-item">

                    <span>
                      Problem
                    </span>

                    <strong>
                      {latestRequest.problemType ||
                        "Not specified"}
                    </strong>

                  </div>

                  <div className="request-info-item">

                    <span>
                      Priority
                    </span>

                    <strong>
                      {latestRequest.emergency
                        ? "Emergency"
                        : "Normal"}
                    </strong>

                  </div>

                  <div className="request-info-item">

                    <span>
                      Request Status
                    </span>

                    <strong>
                      {latestRequest.status ||
                        "REQUESTED"}
                    </strong>

                  </div>

                  <div className="request-info-item">

                    <span>
                      Vehicle
                    </span>

                    <strong>
                      Vehicle #
                      {latestRequest.vehicleId}
                    </strong>

                  </div>

                </div>

                {/* MECHANIC */}

                {assignment ? (
                  <div className="assigned-mechanic-container">

                    <div className="assigned-mechanic-box">

                      <div className="assigned-mechanic-icon">
                        🔧
                      </div>

                      <div className="assigned-mechanic-info">

                        <h3>
                          {mechanic?.name ||
                            "Mechanic #" +
                              assignment.mechanicId}
                        </h3>

                        <div className="assigned-mechanic-meta">

                          {mechanic?.rating !==
                            undefined && (
                            <span>
                              ⭐{" "}
                              {Number(
                                mechanic.rating
                              ).toFixed(1)}
                            </span>
                          )}

                          {mechanic?.location && (
                            <span>
                              📍{" "}
                              {mechanic.location}
                            </span>
                          )}

                          <span className="assigned-available">
                            Assigned
                          </span>

                        </div>

                      </div>

                    </div>

                    {assignment.status !==
                      "COMPLETED" &&
                      assignment.status !==
                        "REJECTED" && (

                      <button
                        className="customer-track-btn"
                        onClick={() =>
                          setActivePage(
                            "tracking"
                          )
                        }
                      >
                        📍 Track Mechanic Live
                      </button>

                    )}

                    {assignment.status ===
                      "COMPLETED" && (

                      <div className="service-completed-box">

                        <span>
                          ✅
                        </span>

                        <div>

                          <strong>
                            Service Completed
                          </strong>

                          <p>
                            Your roadside assistance
                            service has been completed.
                          </p>

                        </div>

                      </div>

                    )}

                  </div>
                ) : (

                  <div className="assignment-waiting-box">

                    <div className="waiting-icon">
                      🔍
                    </div>

                    <div>

                      <strong>
                        Finding a mechanic
                      </strong>

                      <p>
                        Your request is active.
                        Nearby mechanics will appear
                        here once available.
                      </p>

                    </div>

                  </div>

                )}

                {/* PROGRESS */}

                <div className="request-progress">

                  <div className="progress-header">

                    <span>
                      Assistance Progress
                    </span>

                    <strong>
                      {progress}%
                    </strong>

                  </div>

                  <div className="progress-track">

                    <div
                      className="progress-fill"
                      style={{
                        width:
                          progress + "%",
                      }}
                    ></div>

                  </div>

                  <div className="progress-steps">

                    <div
                      className={
                        progress >= 20
                          ? "progress-step active"
                          : "progress-step"
                      }
                    >
                      <span>1</span>
                      <small>
                        Request
                      </small>
                    </div>

                    <div
                      className={
                        progress >= 40
                          ? "progress-step active"
                          : "progress-step"
                      }
                    >
                      <span>2</span>
                      <small>
                        Accepted
                      </small>
                    </div>

                    <div
                      className={
                        progress >= 60
                          ? "progress-step active"
                          : "progress-step"
                      }
                    >
                      <span>3</span>
                      <small>
                        On The Way
                      </small>
                    </div>

                    <div
                      className={
                        progress >= 75
                          ? "progress-step active"
                          : "progress-step"
                      }
                    >
                      <span>4</span>
                      <small>
                        Arrived
                      </small>
                    </div>

                    <div
                      className={
                        progress >= 90
                          ? "progress-step active"
                          : "progress-step"
                      }
                    >
                      <span>5</span>
                      <small>
                        Service
                      </small>
                    </div>

                    <div
                      className={
                        progress >= 100
                          ? "progress-step active"
                          : "progress-step"
                      }
                    >
                      <span>6</span>
                      <small>
                        Completed
                      </small>
                    </div>

                  </div>

                </div>

              </>
            ) : (

              <div className="no-assistance-box">

                <div className="no-assistance-icon">
                  🚗
                </div>

                <h3>
                  No active assistance request
                </h3>

                <p>
                  Having vehicle trouble? Request
                  roadside assistance and choose a
                  nearby mechanic.
                </p>

                <button
                  className="dashboard-primary-btn"
                  onClick={() =>
                    setActivePage(
                      "request"
                    )
                  }
                >
                  🆘 Request Assistance
                </button>

              </div>

            )}

          </div>

          {/* QUICK ACTIONS */}

          <div className="dashboard-side-column">

            <div className="dashboard-action-card">

              <div className="action-icon">
                🆘
              </div>

              <h3>
                Need Roadside Help?
              </h3>

              <p>
                Tell us what's wrong and choose
                a nearby mechanic.
              </p>

              <button
                className="dashboard-primary-btn"
                onClick={() =>
                  setActivePage(
                    "request"
                  )
                }
              >
                Request Assistance
              </button>

            </div>

            <div className="dashboard-action-card">

              <div className="action-icon">
                🚗
              </div>

              <h3>
                My Vehicles
              </h3>

              <p>
                Add and manage your registered
                vehicles.
              </p>

              <button
                className="dashboard-secondary-btn"
                onClick={() =>
                  setActivePage(
                    "vehicles"
                  )
                }
              >
                Manage Vehicles
              </button>

            </div>

            <div className="dashboard-action-card">

              <div className="action-icon">
                📋
              </div>

              <h3>
                My Requests
              </h3>

              <p>
                View current and previous
                assistance requests.
              </p>

              <button
                className="dashboard-secondary-btn"
                onClick={() =>
                  setActivePage(
                    "requests"
                  )
                }
              >
                View My Requests
              </button>

            </div>

          </div>

        </section>

        {/* FEEDBACK REMINDER */}

        {getAssignmentStatus() === "COMPLETED" &&
          !showFeedback &&
          feedbackAssignment === null && (

            <div className="feedback-reminder-card">

              <div>
                <strong>
                  How was your service?
                </strong>

                <p>
                  Rate your mechanic and share
                  your experience.
                </p>
              </div>

              <button
                className="dashboard-secondary-btn"
                onClick={() => {

                  setFeedbackAssignment(
                    assignment
                  );

                  setShowFeedback(true);

                }}
              >
                ⭐ Rate Mechanic
              </button>

            </div>

          )}

      </>
    );
  }

  // ---------------------------------------------
  // PAGE NAVIGATION
  // ---------------------------------------------

 const renderPage = () => {
  if (activePage === "vehicles") {
    return (
      <Vehicles
        user={loggedInUser}
        onBack={() => setActivePage("dashboard")}
      />
    );
  }

 if (activePage === "request") {
  return (
    <RequestAssistance
      user={loggedInUser}
      userId={userId}
      onBack={() => setActivePage("dashboard")}
      onComplete={() => {
        setActivePage("dashboard");
        loadDashboardData();
      }}
    />
  );
}

 if (activePage === "requests") {
  return (
    <MyRequests
      user={loggedInUser}
      userId={userId}
      onBack={() => setActivePage("dashboard")}
    />
  );
}

  if (activePage === "tracking") {
    return (
      <TrackAssistance
        userId={userId}
        onBack={() => {
          setActivePage("dashboard");
        }}
      />
    );
  }

  return renderHome();
};

    
  // ---------------------------------------------
  // MAIN RETURN
  // ---------------------------------------------

  return (
    <div className="customer-dashboard">

      {/* NAVBAR */}

      <header className="dashboard-navbar">

        <div className="dashboard-brand">

          <div className="dashboard-brand-icon">
            🚗
          </div>

          <div>

            <h2>
              VehicleAssist
            </h2>

            <span>
              Roadside Assistance
            </span>

          </div>

        </div>

        <nav className="dashboard-nav">

          <button
            className={
              activePage === "dashboard"
                ? "dashboard-nav-btn active"
                : "dashboard-nav-btn"
            }
            onClick={() =>
              setActivePage(
                "dashboard"
              )
            }
          >
            Dashboard            
          </button>

          <button
            className={
              activePage === "vehicles"
                ? "dashboard-nav-btn active"
                : "dashboard-nav-btn"
            }
            onClick={() =>
              setActivePage(
                "vehicles"
              )
            }
          >
            My Vehicles
          </button>

          <button
            className={
              activePage === "request"
                ? "dashboard-nav-btn active"
                : "dashboard-nav-btn"
            }
            onClick={() =>
              setActivePage(
                "request"
              )
            }
          >
            Assistance
          </button>

          <button
            className={
              activePage === "requests"
                ? "dashboard-nav-btn active"
                : "dashboard-nav-btn"
            }
            onClick={() =>
              setActivePage(
                "requests"
              )
            }
          >
            My Requests
          </button>

          {assignment &&
            assignment.status !==
              "COMPLETED" &&
            assignment.status !==
              "REJECTED" && (

            <button
              className={
                activePage === "tracking"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              onClick={() =>
                setActivePage(
                  "tracking"
                )
              }
            >
              Live Tracking
            </button>

          )}

        </nav>

        <div className="dashboard-navbar-right">

          <div className="dashboard-profile">

            <div className="dashboard-profile-avatar">
              {(loggedInUser?.name || "C")
                .charAt(0)
                .toUpperCase()}
            </div>

            <span>
              {loggedInUser?.name ||
                "Customer"}
            </span>

          </div>

          <button
            className="dashboard-logout-btn"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>

        </div>

      </header>

      {/* CONTENT */}

      <main className="dashboard-content">
        {renderPage()}
      </main>

      {/* FEEDBACK */}

      {showFeedback &&
        feedbackAssignment && (

        <Feedback
          assignment={
            feedbackAssignment
          }
          userId={userId}
          onComplete={
            handleFeedbackComplete
          }
        />

      )}

    </div>
  );
}

export default Dashboard;
