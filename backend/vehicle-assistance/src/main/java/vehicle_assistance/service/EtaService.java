package vehicle_assistance.service;

import vehicle_assistance.model.BreakdownRequest;
import vehicle_assistance.model.MechanicAssignment;
import vehicle_assistance.model.MechanicLocation;
import vehicle_assistance.repository.BreakdownRequestRepository;
import vehicle_assistance.repository.MechanicAssignmentRepository;
import vehicle_assistance.repository.MechanicLocationRepository;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class EtaService {

    private final BreakdownRequestRepository breakdownRepository;
    private final MechanicLocationRepository locationRepository;
    private final MechanicAssignmentRepository assignmentRepository;

    public EtaService(
            BreakdownRequestRepository breakdownRepository,
            MechanicLocationRepository locationRepository,
            MechanicAssignmentRepository assignmentRepository) {

        this.breakdownRepository = breakdownRepository;
        this.locationRepository = locationRepository;
        this.assignmentRepository = assignmentRepository;
    }

    public Map<String, Object> calculateEta(Long breakdownId) {

        BreakdownRequest breakdown =
                breakdownRepository.findById(breakdownId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Breakdown not found"
                                ));

        MechanicAssignment assignment =
                assignmentRepository
                        .findByBreakdownId(breakdownId)
                        .stream()
                        .filter(a ->
                                "ACCEPTED".equals(a.getStatus())
                                || "ON_THE_WAY".equals(a.getStatus())
                        )
                        .findFirst()
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "No active mechanic assignment found"
                                ));

        Long mechanicId = assignment.getMechanicId();

        MechanicLocation location =
                locationRepository
                        .findTopByMechanicIdOrderByUpdatedAtDesc(
                                mechanicId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Mechanic location not available"
                                ));

        double distance = calculateDistance(
                location.getLatitude(),
                location.getLongitude(),
                breakdown.getLatitude(),
                breakdown.getLongitude()
        );

        double speed = location.getSpeed() == null
                ? 30.0
                : location.getSpeed();

        if (speed <= 0) {
            speed = 30.0;
        }

        double etaMinutes =
                (distance / speed) * 60;

        Map<String, Object> response =
                new HashMap<>();

        response.put("breakdownId", breakdownId);
        response.put("mechanicId", mechanicId);

        response.put(
                "remainingDistanceKm",
                Math.round(distance * 100.0) / 100.0
        );

        response.put(
                "speedKmPerHour",
                speed
        );

        response.put(
                "etaMinutes",
                Math.round(etaMinutes * 10.0) / 10.0
        );

        response.put(
                "message",
                "Mechanic is on the way"
        );

        return response;
    }

    private double calculateDistance(
            double lat1,
            double lon1,
            double lat2,
            double lon2) {

        final double EARTH_RADIUS_KM = 6371.0;

        double latDistance =
                Math.toRadians(lat2 - lat1);

        double lonDistance =
                Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(latDistance / 2)
                * Math.sin(latDistance / 2)
                +
                Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                *
                Math.sin(lonDistance / 2)
                * Math.sin(lonDistance / 2);

        double c =
                2 * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );

        return EARTH_RADIUS_KM * c;
    }
}