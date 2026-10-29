import React, { useState } from "react";

function Feedback({ assignment, userId, onComplete }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      setMessage("Please select a rating.");
      return;
    }

    if (!assignment || !assignment.breakdownId) {
      setMessage("Service information is missing.");
      return;
    }

    if (!assignment.mechanicId) {
      setMessage("Mechanic information is missing.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await fetch(
        "http://localhost:8080/api/feedback",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: Number(userId),
            mechanicId: Number(assignment.mechanicId),
            breakdownId: Number(assignment.breakdownId),
            rating: Number(rating),
            review: review.trim(),
          }),
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
        throw new Error(
          typeof data === "string"
            ? data
            : data?.message || "Failed to submit feedback."
        );
      }

      setMessage(
        "Thank you! Your feedback has been submitted successfully."
      );

      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1000);

    } catch (error) {
      console.error("Feedback error:", error);

      setMessage(
        error.message || "Unable to submit feedback."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-overlay">

      <div className="feedback-card">

        <div className="feedback-header">
          <h2>Service Completed 🎉</h2>

          <p>
            How was your experience with the mechanic?
          </p>
        </div>

        <div className="feedback-rating-section">

          <h3>Rate your mechanic</h3>

          <div className="feedback-stars">

            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={
                  star <= rating
                    ? "star selected"
                    : "star"
                }
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}

          </div>

          <p className="rating-text">
            {rating === 0 && "Select a rating"}
            {rating === 1 && "Very Poor"}
            {rating === 2 && "Poor"}
            {rating === 3 && "Average"}
            {rating === 4 && "Good"}
            {rating === 5 && "Excellent"}
          </p>

        </div>

        <div className="feedback-review-section">

          <label htmlFor="feedback-review">
            Write your feedback
          </label>

          <textarea
            id="feedback-review"
            value={review}
            onChange={(event) =>
              setReview(event.target.value)
            }
            placeholder="Tell us about the mechanic's service..."
            maxLength={1000}
            rows={5}
          />

        </div>

        {message && (
          <div className="feedback-message">
            {message}
          </div>
        )}

        <button
          className="feedback-submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? "Submitting..."
            : "Submit Feedback"}
        </button>

      </div>

    </div>
  );
}

export default Feedback;