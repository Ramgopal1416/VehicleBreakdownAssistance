package vehicle_assistance.controller;

import vehicle_assistance.model.Mechanic;
import vehicle_assistance.model.Rating;
import vehicle_assistance.repository.MechanicRepository;
import vehicle_assistance.repository.RatingRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ratings")
@CrossOrigin(origins = "*")
public class RatingController {

    private final RatingRepository ratingRepository;
    private final MechanicRepository mechanicRepository;

    public RatingController(
            RatingRepository ratingRepository,
            MechanicRepository mechanicRepository) {

        this.ratingRepository = ratingRepository;
        this.mechanicRepository = mechanicRepository;
    }

    @PostMapping
    public ResponseEntity<?> addRating(
            @RequestBody Rating rating) {

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
                    .body("Rating already submitted for this service");
        }

        rating.setCreatedAt(LocalDateTime.now());

        Rating savedRating =
                ratingRepository.save(rating);

        updateMechanicAverageRating(
                rating.getMechanicId()
        );

        return ResponseEntity.ok(savedRating);
    }

    private void updateMechanicAverageRating(
            Long mechanicId) {

        List<Rating> ratings =
                ratingRepository.findByMechanicId(mechanicId);

        if (ratings.isEmpty()) {
            return;
        }

        double total = 0;

        for (Rating rating : ratings) {
            total += rating.getRating();
        }

        double calculatedAverage =
                total / ratings.size();

        double finalAverage =
                Math.round(calculatedAverage * 10.0) / 10.0;

        mechanicRepository.findById(mechanicId)
                .ifPresent(mechanic -> {

                    mechanic.setRating(finalAverage);

                    mechanicRepository.save(mechanic);
                });
    }

    @GetMapping("/mechanic/{mechanicId}")
    public ResponseEntity<List<Rating>> getMechanicRatings(
            @PathVariable Long mechanicId) {

        return ResponseEntity.ok(
                ratingRepository.findByMechanicId(mechanicId)
        );
    }

    @GetMapping("/mechanic/{mechanicId}/summary")
    public ResponseEntity<?> getMechanicRatingSummary(
            @PathVariable Long mechanicId) {

        List<Rating> ratings =
                ratingRepository.findByMechanicId(mechanicId);

        double average = 0;

        if (!ratings.isEmpty()) {

            double total = 0;

            for (Rating rating : ratings) {
                total += rating.getRating();
            }

            average =
                    total / ratings.size();

            average =
                    Math.round(average * 10.0) / 10.0;
        }

        Map<String, Object> response =
                new HashMap<>();

        response.put("mechanicId", mechanicId);
        response.put("totalRatings", ratings.size());
        response.put("averageRating", average);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Rating>> getUserRatings(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                ratingRepository.findByUserId(userId)
        );
    }

    @GetMapping
    public ResponseEntity<List<Rating>> getAllRatings() {

        return ResponseEntity.ok(
                ratingRepository.findAll()
        );
    }
}