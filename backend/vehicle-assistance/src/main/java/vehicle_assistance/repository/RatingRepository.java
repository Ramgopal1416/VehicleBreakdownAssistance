package vehicle_assistance.repository;

import vehicle_assistance.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RatingRepository
        extends JpaRepository<Rating, Long> {

    List<Rating> findByMechanicId(Long mechanicId);

    List<Rating> findByUserId(Long userId);

    boolean existsByUserIdAndBreakdownId(
            Long userId,
            Long breakdownId
    );
}