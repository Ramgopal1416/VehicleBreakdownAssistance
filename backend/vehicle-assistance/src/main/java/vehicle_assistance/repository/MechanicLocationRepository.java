package vehicle_assistance.repository;

import vehicle_assistance.model.MechanicLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MechanicLocationRepository
        extends JpaRepository<MechanicLocation, Long> {

    Optional<MechanicLocation> findTopByMechanicIdOrderByUpdatedAtDesc(
            Long mechanicId
    );
}