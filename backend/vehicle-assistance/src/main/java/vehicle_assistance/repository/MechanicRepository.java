package vehicle_assistance.repository;

import vehicle_assistance.model.Mechanic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MechanicRepository
        extends JpaRepository<Mechanic, Long> {

    // Find mechanic by email
    Optional<Mechanic> findByEmail(String email);

    // Check whether email already exists
    boolean existsByEmail(String email);

    // Find all available mechanics
    List<Mechanic> findByAvailableTrue();

    // Find available mechanics by specialization
    List<Mechanic> findBySpecializationAndAvailableTrue(
            String specialization
    );
}