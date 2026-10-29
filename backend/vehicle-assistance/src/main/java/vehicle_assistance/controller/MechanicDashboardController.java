package vehicle_assistance.controller;

import vehicle_assistance.model.MechanicAssignment;
import vehicle_assistance.repository.MechanicAssignmentRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mechanic-dashboard")
@CrossOrigin(origins = "*")
public class MechanicDashboardController {

    private final MechanicAssignmentRepository assignmentRepository;

    public MechanicDashboardController(
            MechanicAssignmentRepository assignmentRepository) {

        this.assignmentRepository = assignmentRepository;
    }

    @GetMapping("/{mechanicId}")
    public ResponseEntity<?> getDashboard(
            @PathVariable Long mechanicId) {

        List<MechanicAssignment> assignments =
                assignmentRepository.findByMechanicId(mechanicId);

        long pending = assignments.stream()
                .filter(a -> "PENDING".equals(a.getStatus()))
                .count();

        long accepted = assignments.stream()
                .filter(a -> "ACCEPTED".equals(a.getStatus()))
                .count();

        long onTheWay = assignments.stream()
                .filter(a -> "ON_THE_WAY".equals(a.getStatus()))
                .count();

        long arrived = assignments.stream()
                .filter(a -> "ARRIVED".equals(a.getStatus()))
                .count();

        long inService = assignments.stream()
                .filter(a -> "IN_SERVICE".equals(a.getStatus()))
                .count();

        long completed = assignments.stream()
                .filter(a -> "COMPLETED".equals(a.getStatus()))
                .count();

        Map<String, Object> response =
                new HashMap<>();

        response.put("mechanicId", mechanicId);
        response.put("totalJobs", assignments.size());
        response.put("pendingJobs", pending);
        response.put("acceptedJobs", accepted);
        response.put("onTheWayJobs", onTheWay);
        response.put("arrivedJobs", arrived);
        response.put("inServiceJobs", inService);
        response.put("completedJobs", completed);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{mechanicId}/requests")
    public ResponseEntity<List<MechanicAssignment>>
    getMechanicRequests(
            @PathVariable Long mechanicId) {

        return ResponseEntity.ok(
                assignmentRepository.findByMechanicId(mechanicId)
        );
    }
}