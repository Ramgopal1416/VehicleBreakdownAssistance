package vehicle_assistance.service;

import vehicle_assistance.model.Mechanic;
import vehicle_assistance.repository.MechanicRepository;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class NearbyMechanicService {

    private final MechanicRepository mechanicRepository;

    public NearbyMechanicService(MechanicRepository mechanicRepository) {
        this.mechanicRepository = mechanicRepository;
    }

    public List<MechanicDistance> findNearbyMechanics(
            double userLatitude,
            double userLongitude,
            double maxDistanceKm) {

        List<Mechanic> mechanics =
                mechanicRepository.findByAvailableTrue();

        List<MechanicDistance> nearbyMechanics = new ArrayList<>();

        for (Mechanic mechanic : mechanics) {

            if (mechanic.getLatitude() == null ||
                mechanic.getLongitude() == null) {
                continue;
            }

            double distance = calculateDistance(
                    userLatitude,
                    userLongitude,
                    mechanic.getLatitude(),
                    mechanic.getLongitude()
            );

            if (distance <= maxDistanceKm) {

                nearbyMechanics.add(
                        new MechanicDistance(
                                mechanic,
                                distance
                        )
                );
            }
        }

        nearbyMechanics.sort(
                Comparator.comparingDouble(
                        MechanicDistance::getDistanceKm
                )
        );

        return nearbyMechanics;
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

    public static class MechanicDistance {

        private final Mechanic mechanic;
        private final double distanceKm;

        public MechanicDistance(
                Mechanic mechanic,
                double distanceKm) {

            this.mechanic = mechanic;
            this.distanceKm = distanceKm;
        }

        public Mechanic getMechanic() {
            return mechanic;
        }

        public double getDistanceKm() {
            return Math.round(distanceKm * 100.0) / 100.0;
        }
    }
}