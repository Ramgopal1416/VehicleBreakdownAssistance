import React, { useEffect, useState } from "react";
import TrackAssistance from "./TrackAssistance";

const API_BASE = "http://localhost:8080";

function MyRequests({ userId, user,onBack }) {
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [mechanics, setMechanics] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);
  const [showTracking, setShowTracking] = useState(false);


  const getCurrentUserId = () => {
    if (userId) {
      return Number(userId);
    }

    try {
      const savedUser =
        localStorage.getItem("loggedInUser");

      if (!savedUser) {
        return null;
      }

      const parsedUser = JSON.parse(savedUser);

      return Number(
        parsedUser.userId || parsedUser.id
      );
    } catch (error) {
      console.error(
        "Unable to read logged-in user:",
        error
      );

      return null;
    }
  };

 // const currentUserId = getCurrentUserId();
  const currentUserId =
  userId ||
  user?.userId ||
  user?.id;

  const loadRequests = async () => {
    if (!currentUserId) {
      setMessage(
        "Customer information is missing. Please login again."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_BASE}/api/breakdowns/user/${currentUserId}`
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
        throw new Error(
          typeof data === "string"
            ? data
            : "Unable to load your requests."
        );
      }

      const requestList = Array.isArray(data)
        ? data
        : [];

      requestList.sort(
        (a, b) =>
          new Date(
            b.requestedAt || 0
          ).getTime() -
          new Date(
            a.requestedAt || 0
          ).getTime()
      );

      setRequests(requestList);

      await loadAssignments(requestList);
    } catch (error) {
      console.error(
        "My requests error:",
        error
      );

      setMessage(
        error.message ||
          "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (requestList) => {
    const assignmentMap = {};
    const mechanicMap = {};

    for (const request of requestList) {
      try {
        const response = await fetch(
          `${API_BASE}/api/assignments/breakdown/${request.id}`
        );

        if (!response.ok) {
          continue;
        }

        const data = await response.json();

        let assignment = null;

        if (Array.isArray(data)) {
          if (data.length > 0) {
            assignment =
              data[data.length - 1];
          }
        } else if (data) {
          assignment = data;
        }

        if (!assignment) {
          continue;
        }

        assignmentMap[request.id] =
          assignment;

        if (assignment.mechanicId) {
          try {
            const mechanicResponse =
              await fetch(
                `${API_BASE}/api/mechanics/${assignment.mechanicId}`
              );

            if (mechanicResponse.ok) {
              const mechanicData =
                await mechanicResponse.json();

              mechanicMap[
                assignment.mechanicId
              ] = mechanicData;
            }
          } catch (mechanicError) {
            console.error(
              "Mechanic loading error:",
              mechanicError
            );
          }
        }
      } catch (error) {
        console.error(
          "Assignment loading error:",
          error
        );
      }
    }

    setAssignments(assignmentMap);
    setMechanics(mechanicMap);
  };

  useEffect(() => {
    loadRequests();
  }, [currentUserId]);

  const formatStatus = (status) => {
    if (!status) {
      return "Requested";
    }

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "REQUESTED":
        return "request-status-pending";

      case "BOOKED":
      case "PENDING":
        return "request-status-pending";

      case "ACCEPTED":
        return "request-status-accepted";

      case "ON_THE_WAY":
        return "request-status-way";

      case "ARRIVED":
        return "request-status-arrived";

      case "IN_SERVICE":
        return "request-status-service";

      case "COMPLETED":
        return "request-status-completed";

      case "REJECTED":
        return "request-status-rejected";

      default:
        return "request-status-pending";
    }
  };

  const openTracking = (breakdownId) => {
    setSelectedBreakdown(breakdownId);
    setShowTracking(true);
  };

  if (showTracking && selectedBreakdown) {
    return (
      <div className="requests-page">

        <div className="requests-header">
          <button
            className="back-btn"
            onClick={() => {
              setShowTracking(false);
              setSelectedBreakdown(null);
            }}
          >
            ← Back to My Requests
          </button>

          <p className="dashboard-label">
            LIVE SERVICE TRACKING
          </p>

          <h1>📍 Track Your Mechanic</h1>

          <p>
            Follow the mechanic's current service
            progress.
          </p>
        </div>

        <TrackAssistance
          userId={currentUserId}
          breakdownId={selectedBreakdown}
          onBack={() => {
            setShowTracking(false);
            setSelectedBreakdown(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="requests-page">

      <div className="requests-header">

        {onBack && (
          <button
            className="back-btn"
            onClick={onBack}
          >
            ← Back to Dashboard
          </button>
        )}

        <p className="dashboard-label">
          VEHICLE ASSISTANCE
        </p>

        <h1>
          📋 My Requests
        </h1>

        <p>
          View and track your vehicle assistance
          requests.
        </p>

      </div>

      <div className="requests-content">

        <div className="requests-title-row">

          <div>
            <h2>
              Your Assistance Requests
            </h2>

            <p>
              All your vehicle breakdown
              requests are shown here.
            </p>
          </div>

          <button
            className="requests-refresh-btn"
            onClick={loadRequests}
            disabled={loading}
          >
            🔄 Refresh
          </button>

        </div>

        {message && (
          <div className="requests-error">
            {message}
          </div>
        )}

        {loading ? (

          <div className="requests-empty-card">

            <div className="requests-empty-icon">
              🔄
            </div>

            <h3>
              Loading your requests...
            </h3>

            <p>
              Please wait while we load your
              assistance history.
            </p>

          </div>

        ) : requests.length === 0 ? (

          <div className="requests-empty-card">

            <div className="requests-empty-icon">
              📋
            </div>

            <h3>
              No assistance requests yet
            </h3>

            <p>
              When you request roadside
              assistance, your requests will
              appear here.
            </p>

          </div>

        ) : (

          <div className="requests-list">

            {requests.map((request) => {

              const assignment =
                assignments[request.id];

              const mechanic =
                assignment
                  ? mechanics[
                      assignment.mechanicId
                    ]
                  : null;

              const activeAssignment =
                assignment &&
                ![
                  "COMPLETED",
                  "REJECTED"
                ].includes(
                  assignment.status
                );

              return (
                <div
                  className="request-card"
                  key={request.id}
                >

                  <div className="request-card-top">

                    <div>
                      <div className="request-number">
                        Request #{request.id}
                      </div>

                      <h3>
                        {request.problemType ||
                          "Vehicle Breakdown"}
                      </h3>
                    </div>

                    <span
                      className={`request-status ${getStatusClass(
                        assignment?.status ||
                          request.status
                      )}`}
                    >
                      {formatStatus(
                        assignment?.status ||
                          request.status
                      )}
                    </span>

                  </div>

                  <div className="request-details">

                    <div>
                      <span>
                        Vehicle
                      </span>

                      <strong>
                        Vehicle #{request.vehicleId}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Priority
                      </span>

                      <strong>
                        {request.emergency
                          ? "🚨 Emergency"
                          : "Normal"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Requested
                      </span>

                      <strong>
                        {request.requestedAt
                          ? new Date(
                              request.requestedAt
                            ).toLocaleString()
                          : "Not available"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Mechanic
                      </span>

                      <strong>
                        {mechanic?.name ||
                          (assignment?.mechanicId
                            ? `Mechanic #${assignment.mechanicId}`
                            : "Not Assigned")}
                      </strong>
                    </div>

                  </div>

                  {request.description && (
                    <div className="request-description">
                      <span>
                        Problem Description
                      </span>

                      <p>
                        {request.description}
                      </p>
                    </div>
                  )}

                  {mechanic && (
                    <div className="request-mechanic-box">

                      <div className="request-mechanic-icon">
                        🔧
                      </div>

                      <div>
                        <strong>
                          {mechanic.name}
                        </strong>

                        <p>
                          {mechanic.specialization ||
                            "Roadside Assistance"}
                        </p>

                        <span>
                          ⭐{" "}
                          {mechanic.rating ||
                            "New"}
                        </span>
                      </div>

                    </div>
                  )}

                  {activeAssignment && (
                    <button
                      className="request-track-btn"
                      onClick={() =>
                        openTracking(request.id)
                      }
                    >
                      📍 Track Mechanic
                    </button>
                  )}

                  {assignment?.status ===
                    "COMPLETED" && (
                    <div className="request-completed-box">
                      <strong>
                        ✅ Service Completed
                      </strong>

                      <p>
                        Your roadside assistance
                        has been completed.
                        Please rate your mechanic
                        from the feedback popup.
                      </p>
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}

export default MyRequests;