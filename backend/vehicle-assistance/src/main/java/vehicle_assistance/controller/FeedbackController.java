package vehicle_assistance.controller;

import vehicle_assistance.model.Rating;
import vehicle_assistance.repository.RatingRepository;
import vehicle_assistance.repository.MechanicRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*")
public class FeedbackController {

    private final RatingRepository ratingRepository;
    private final MechanicRepository mechanicRepository;

    public FeedbackController(
            RatingRepository ratingRepository,
            MechanicRepository mechanicRepository) {

        this.ratingRepository = ratingRepository;
        this.mechanicRepository = mechanicRepository;
    }

    // Submit customer feedback
    @PostMapping
    public ResponseEntity<?> submitFeedback(@RequestBody Rating rating) {

        if (rating.getBreakdownId() == null) {
            return ResponseEntity.badRequest()
                    .body("Breakdown ID is required");
        }

        if (rating.getMechanicId() == null) {
            return ResponseEntity.badRequest()
                    .body("Mechanic ID is required");
        }

        if (rating.getUserId() == null) {
            return ResponseEntity.badRequest()
                    .body("User ID is required");
        }

        if (rating.getRating() == null ||
                rating.getRating() < 1 ||
                rating.getRating() > 5) {

            return ResponseEntity.badRequest()
                    .body("Rating must be between 1 and 5");
        }

        if (ratingRepository.existsByUserIdAndBreakdownId(
                rating.getUserId(),
                rating.getBreakdownId())) {

            return ResponseEntity.badRequest()
                    .body("Feedback already submitted for this service");
        }

        rating.setCreatedAt(LocalDateTime.now());

        Rating savedRating = ratingRepository.save(rating);

        updateMechanicRating(rating.getMechanicId());

        return ResponseEntity.ok(savedRating);
    }

    // Get all feedback for a mechanic
    @GetMapping("/mechanic/{mechanicId}")
    public ResponseEntity<List<Rating>> getMechanicFeedback(
            @PathVariable Long mechanicId) {

        return ResponseEntity.ok(
                ratingRepository.findByMechanicId(mechanicId)
        );
    }

    // Get all feedback submitted by a customer
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Rating>> getUserFeedback(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                ratingRepository.findByUserId(userId)
        );
    }

    // Calculate mechanic's average rating
    private void updateMechanicRating(Long mechanicId) {

        List<Rating> ratings =
                ratingRepository.findByMechanicId(mechanicId);

        if (ratings.isEmpty()) {
            return;
        }

        double total = ratings.stream()
                .mapToInt(Rating::getRating)
                .sum();

        final double average =
                Math.round((total / ratings.size()) * 10.0) / 10.0;

        mechanicRepository.findById(mechanicId)
                .ifPresent(mechanic -> {
                    mechanic.setRating(average);
                    mechanicRepository.save(mechanic);
                });
    }

    // Get mechanic rating summary
    @GetMapping("/mechanic/{mechanicId}/summary")
    public ResponseEntity<?> getMechanicRatingSummary(
            @PathVariable Long mechanicId) {

        List<Rating> ratings =
                ratingRepository.findByMechanicId(mechanicId);

        if (ratings.isEmpty()) {
            return ResponseEntity.ok(
                    Map.of(
                            "mechanicId", mechanicId,
                            "averageRating", 0.0,
                            "totalReviews", 0
                    )
            );
        }

        double total = ratings.stream()
                .mapToInt(Rating::getRating)
                .sum();

        double average =
                Math.round((total / ratings.size()) * 10.0) / 10.0;

        return ResponseEntity.ok(
                Map.of(
                        "mechanicId", mechanicId,
                        "averageRating", average,
                        "totalReviews", ratings.size()
                )
        );
    }
}