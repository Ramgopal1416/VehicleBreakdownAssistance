package vehicle_assistance.controller;

import vehicle_assistance.model.BreakdownRequest;
import vehicle_assistance.repository.BreakdownRequestRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "*")
public class ServiceHistoryController {

    private final BreakdownRequestRepository breakdownRepository;

    public ServiceHistoryController(
            BreakdownRequestRepository breakdownRepository) {

        this.breakdownRepository = breakdownRepository;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BreakdownRequest>> getServiceHistory(
            @PathVariable Long userId) {

        List<BreakdownRequest> history =
                breakdownRepository.findByUserId(userId);

        return ResponseEntity.ok(history);
    }
}