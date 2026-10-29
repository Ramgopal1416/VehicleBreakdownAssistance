package vehicle_assistance.controller;

import vehicle_assistance.model.BreakdownRequest;
import vehicle_assistance.model.MechanicAssignment;
import vehicle_assistance.repository.BreakdownRequestRepository;
import vehicle_assistance.repository.MechanicAssignmentRepository;
import vehicle_assistance.service.AutoAssignmentService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin(origins = "*")
public class MechanicAssignmentController {

    private final MechanicAssignmentRepository assignmentRepository;
    private final BreakdownRequestRepository breakdownRepository;
    private final AutoAssignmentService autoAssignmentService;

    public MechanicAssignmentController(
            MechanicAssignmentRepository assignmentRepository,
            BreakdownRequestRepository breakdownRepository,
            AutoAssignmentService autoAssignmentService) {

        this.assignmentRepository = assignmentRepository;
        this.breakdownRepository = breakdownRepository;
        this.autoAssignmentService = autoAssignmentService;
    }

    @PostMapping
    public ResponseEntity<?> createAssignment(
            @RequestBody MechanicAssignment assignment) {

        assignment.setStatus("PENDING");
        assignment.setAssignedAt(LocalDateTime.now());

        MechanicAssignment savedAssignment =
                assignmentRepository.save(assignment);

        return ResponseEntity.ok(savedAssignment);
    }

    @PostMapping("/auto/{breakdownId}")
    public ResponseEntity<?> autoAssignMechanic(
            @PathVariable Long breakdownId) {

        try {
            MechanicAssignment assignment =
                    autoAssignmentService
                            .assignNearestMechanic(breakdownId);

            return ResponseEntity.ok(assignment);

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<MechanicAssignment>>
    getAllAssignments() {

        return ResponseEntity.ok(
                assignmentRepository.findAll()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAssignmentById(
            @PathVariable Long id) {

        return assignmentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/breakdown/{breakdownId}")
    public ResponseEntity<List<MechanicAssignment>>
    getByBreakdown(@PathVariable Long breakdownId) {

        return ResponseEntity.ok(
                assignmentRepository
                        .findByBreakdownId(breakdownId)
        );
    }

    @GetMapping("/mechanic/{mechanicId}")
    public ResponseEntity<List<MechanicAssignment>>
    getByMechanic(@PathVariable Long mechanicId) {

        return ResponseEntity.ok(
                assignmentRepository
                        .findByMechanicId(mechanicId)
        );
    }

    // ACCEPT ASSIGNMENT
    @PutMapping("/{id}/accept")
    public ResponseEntity<?> acceptAssignment(
            @PathVariable Long id) {

        return assignmentRepository.findById(id)
                .map(assignment -> {

                    assignment.setStatus("ACCEPTED");

                    assignment.setAcceptedAt(
                            LocalDateTime.now()
                    );

                    MechanicAssignment updatedAssignment =
                            assignmentRepository.save(assignment);

                    // Update related breakdown
                    breakdownRepository
                            .findById(
                                    assignment.getBreakdownId()
                            )
                            .ifPresent(breakdown -> {

                                breakdown.setStatus("ACCEPTED");

                                breakdownRepository.save(
                                        breakdown
                                );
                            });

                    return ResponseEntity.ok(
                            updatedAssignment
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // REJECT ASSIGNMENT
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectAssignment(
            @PathVariable Long id) {

        return assignmentRepository.findById(id)
                .map(assignment -> {

                    assignment.setStatus("REJECTED");

                    MechanicAssignment updatedAssignment =
                            assignmentRepository.save(assignment);

                    // Update related breakdown
                    breakdownRepository
                            .findById(
                                    assignment.getBreakdownId()
                            )
                            .ifPresent(breakdown -> {

                                breakdown.setStatus("REJECTED");

                                breakdownRepository.save(
                                        breakdown
                                );
                            });

                    return ResponseEntity.ok(
                            updatedAssignment
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // UPDATE ASSIGNMENT STATUS
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return assignmentRepository.findById(id)
                .map(assignment -> {

                    assignment.setStatus(status);

                    MechanicAssignment updatedAssignment =
                            assignmentRepository.save(
                                    assignment
                            );

                    // Keep breakdown status synchronized
                    breakdownRepository
                            .findById(
                                    assignment.getBreakdownId()
                            )
                            .ifPresent(breakdown -> {

                                breakdown.setStatus(status);

                                breakdownRepository.save(
                                        breakdown
                                );
                            });

                    return ResponseEntity.ok(
                            updatedAssignment
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }
@PostMapping("/book")
public ResponseEntity<?> bookMechanic(
        @RequestBody MechanicAssignment assignment) {

    try {

        // Prevent duplicate booking for the same breakdown
        List<MechanicAssignment> existingAssignments =
                assignmentRepository.findByBreakdownId(
                        assignment.getBreakdownId()
                );

        boolean alreadyBooked =
                existingAssignments.stream()
                        .anyMatch(existing ->
                                existing.getMechanicId()
                                        .equals(
                                                assignment.getMechanicId()
                                        )
                        );

        if (alreadyBooked) {
            return ResponseEntity.badRequest()
                    .body(
                            "This mechanic is already booked for this request."
                    );
        }

        assignment.setStatus("PENDING");
        assignment.setAssignedAt(
                LocalDateTime.now()
        );

        MechanicAssignment savedAssignment =
                assignmentRepository.save(
                        assignment
                );

        // Update breakdown status
        breakdownRepository
                .findById(
                        assignment.getBreakdownId()
                )
                .ifPresent(breakdown -> {

                    breakdown.setStatus(
                            "BOOKED"
                    );

                    breakdownRepository.save(
                            breakdown
                    );
                });

        return ResponseEntity.ok(
                savedAssignment
        );

    } catch (RuntimeException e) {

        return ResponseEntity.badRequest()
                .body(
                        e.getMessage()
                );
    }
}
}