package vehicle_assistance.service;

import vehicle_assistance.model.BreakdownRequest;
import vehicle_assistance.repository.BreakdownRequestRepository;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class CostEstimationService {

    private final BreakdownRequestRepository breakdownRepository;

    public CostEstimationService(
            BreakdownRequestRepository breakdownRepository) {
        this.breakdownRepository = breakdownRepository;
    }

    public Map<String, Object> estimateCost(Long breakdownId) {

        BreakdownRequest breakdown =
                breakdownRepository.findById(breakdownId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Breakdown not found"
                                ));

        String problemType =
                breakdown.getProblemType();

        double baseCost;

        switch (problemType.toUpperCase()) {

            case "BATTERY":
                baseCost = 500;
                break;

            case "ENGINE":
                baseCost = 1500;
                break;

            case "TYRE":
                baseCost = 400;
                break;

            case "FUEL":
                baseCost = 300;
                break;

            case "ELECTRICAL":
                baseCost = 800;
                break;

            default:
                baseCost = 600;
        }

        double serviceCharge = 100;

        double estimatedTotal =
                baseCost + serviceCharge;

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "breakdownId",
                breakdownId
        );

        response.put(
                "problemType",
                problemType
        );

        response.put(
                "baseCost",
                baseCost
        );

        response.put(
                "serviceCharge",
                serviceCharge
        );

        response.put(
                "estimatedTotal",
                estimatedTotal
        );

        response.put(
                "currency",
                "INR"
        );

        return response;
    }
}