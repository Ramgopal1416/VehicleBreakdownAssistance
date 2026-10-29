package vehicle_assistance.repository;

import vehicle_assistance.model.MechanicAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MechanicAssignmentRepository
        extends JpaRepository<MechanicAssignment, Long> {

    List<MechanicAssignment> findByBreakdownId(Long breakdownId);

    List<MechanicAssignment> findByMechanicId(Long mechanicId);

    List<MechanicAssignment> findByStatus(String status);
}