package vehicle_assistance.controller;

import vehicle_assistance.service.CostEstimationService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cost")
@CrossOrigin(origins = "*")
public class CostEstimationController {

    private final CostEstimationService costEstimationService;

    public CostEstimationController(
            CostEstimationService costEstimationService) {

        this.costEstimationService =
                costEstimationService;
    }

    @GetMapping("/{breakdownId}")
    public ResponseEntity<?> getEstimatedCost(
            @PathVariable Long breakdownId) {

        try {

            Map<String, Object> response =
                    costEstimationService
                            .estimateCost(breakdownId);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }
}