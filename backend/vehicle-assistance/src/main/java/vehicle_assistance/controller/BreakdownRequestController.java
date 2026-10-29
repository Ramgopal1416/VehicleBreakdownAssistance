package vehicle_assistance.controller;

import vehicle_assistance.model.BreakdownRequest;
import vehicle_assistance.repository.BreakdownRequestRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/breakdowns")
@CrossOrigin(origins = "*")
public class BreakdownRequestController {

    private final BreakdownRequestRepository breakdownRepository;

    public BreakdownRequestController(
            BreakdownRequestRepository breakdownRepository) {

        this.breakdownRepository = breakdownRepository;
    }

    // Create a breakdown request
    @PostMapping
    public ResponseEntity<?> createBreakdown(
            @RequestBody BreakdownRequest request) {

        request.setStatus("REQUESTED");
        request.setRequestedAt(LocalDateTime.now());

        BreakdownRequest savedRequest =
                breakdownRepository.save(request);

        return ResponseEntity.ok(savedRequest);
    }

    // Get all breakdown requests
    @GetMapping
    public ResponseEntity<List<BreakdownRequest>> getAllBreakdowns() {

        return ResponseEntity.ok(
                breakdownRepository.findAll()
        );
    }

    // Get breakdowns for a specific user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BreakdownRequest>> getUserBreakdowns(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                breakdownRepository.findByUserId(userId)
        );
    }

    // Get breakdowns by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BreakdownRequest>> getByStatus(
            @PathVariable String status) {

        return ResponseEntity.ok(
                breakdownRepository.findByStatus(status)
        );
    }

    // Update breakdown status
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return breakdownRepository.findById(id)
                .map(request -> {

                    request.setStatus(status);

                    BreakdownRequest updated =
                            breakdownRepository.save(request);

                    return ResponseEntity.ok(updated);

                })
                .orElse(
                    ResponseEntity.notFound().build()
                );
 
    }

@GetMapping("/{id}")
public ResponseEntity<?> getBreakdownById(
        @PathVariable Long id) {

    return breakdownRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
}
}