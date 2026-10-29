package vehicle_assistance.repository;

import vehicle_assistance.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByUserId(Long userId);

    boolean existsByVehicleNumber(String vehicleNumber);
}