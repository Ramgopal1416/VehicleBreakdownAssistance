package vehicle_assistance.service;

import vehicle_assistance.model.BreakdownRequest;
import vehicle_assistance.model.Mechanic;
import vehicle_assistance.model.MechanicAssignment;
import vehicle_assistance.repository.BreakdownRequestRepository;
import vehicle_assistance.repository.MechanicAssignmentRepository;
import vehicle_assistance.repository.MechanicRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AutoAssignmentService {

    private final MechanicRepository mechanicRepository;
    private final BreakdownRequestRepository breakdownRepository;
    private final MechanicAssignmentRepository assignmentRepository;

    public AutoAssignmentService(
            MechanicRepository mechanicRepository,
            BreakdownRequestRepository breakdownRepository,
            MechanicAssignmentRepository assignmentRepository) {

        this.mechanicRepository = mechanicRepository;
        this.breakdownRepository = breakdownRepository;
        this.assignmentRepository = assignmentRepository;
    }

    public MechanicAssignment assignNearestMechanic(
            Long breakdownId) {

        BreakdownRequest breakdown =
                breakdownRepository.findById(breakdownId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Breakdown not found"
                                ));

        if (breakdown.getLatitude() == null ||
                breakdown.getLongitude() == null) {

            throw new RuntimeException(
                    "Breakdown location is not available"
            );
        }

        List<Mechanic> mechanics =
                mechanicRepository.findByAvailableTrue();

        Mechanic bestMechanic = null;

        double bestScore = -1;
        double bestDistance = Double.MAX_VALUE;

        String problemType =
                breakdown.getProblemType();

        for (Mechanic mechanic : mechanics) {

            if (mechanic.getLatitude() == null ||
                    mechanic.getLongitude() == null) {
                continue;
            }

            double distance = calculateDistance(
                    breakdown.getLatitude(),
                    breakdown.getLongitude(),
                    mechanic.getLatitude(),
                    mechanic.getLongitude()
            );

            // Emergency requests search within 30 km.
            // Normal requests search within 20 km.
            double maximumDistance =
                    breakdown.isEmergency() ? 30.0 : 20.0;

            if (distance > maximumDistance) {
                continue;
            }

            double rating =
                    mechanic.getRating() == null
                            ? 0.0
                            : mechanic.getRating();

            double distanceScore =
                    Math.max(
                            0,
                            1 - (distance / maximumDistance)
                    );

            double ratingScore =
                    Math.min(rating, 5.0) / 5.0;

            double specializationScore = 0.0;

            if (problemType != null &&
                    mechanic.getSpecialization() != null &&
                    mechanic.getSpecialization()
                            .equalsIgnoreCase(problemType)) {

                specializationScore = 1.0;
            }

            /*
             * Normal request:
             *
             * Distance       = 50%
             * Rating         = 30%
             * Specialization = 20%
             *
             * Emergency request:
             *
             * Distance       = 60%
             * Rating         = 20%
             * Specialization = 20%
             */

            double score;

            if (breakdown.isEmergency()) {

                score =
                        (distanceScore * 0.60)
                        + (ratingScore * 0.20)
                        + (specializationScore * 0.20);

            } else {

                score =
                        (distanceScore * 0.50)
                        + (ratingScore * 0.30)
                        + (specializationScore * 0.20);
            }

            if (score > bestScore) {

                bestScore = score;
                bestMechanic = mechanic;
                bestDistance = distance;
            }
        }

        if (bestMechanic == null) {

            throw new RuntimeException(
                    breakdown.isEmergency()
                            ? "No suitable emergency mechanic found within 30 km"
                            : "No suitable mechanic found within 20 km"
            );
        }

        MechanicAssignment assignment =
                new MechanicAssignment();

        assignment.setBreakdownId(breakdownId);

        assignment.setMechanicId(
                bestMechanic.getId()
        );

        assignment.setDistanceKm(
                Math.round(bestDistance * 100.0) / 100.0
        );

        assignment.setStatus("PENDING");

        assignment.setAssignedAt(
                LocalDateTime.now()
        );

        return assignmentRepository.save(assignment);
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