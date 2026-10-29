package vehicle_assistance.repository;

import vehicle_assistance.model.BreakdownRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BreakdownRequestRepository
        extends JpaRepository<BreakdownRequest, Long> {

    List<BreakdownRequest> findByUserId(Long userId);

    List<BreakdownRequest> findByStatus(String status);
}