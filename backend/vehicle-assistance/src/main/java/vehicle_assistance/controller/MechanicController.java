package vehicle_assistance.controller;

import vehicle_assistance.model.Mechanic;
import vehicle_assistance.repository.MechanicRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mechanics")
@CrossOrigin(origins = "*")
public class MechanicController {

    private final MechanicRepository mechanicRepository;

    public MechanicController(
            MechanicRepository mechanicRepository) {

        this.mechanicRepository = mechanicRepository;
    }


    // =====================================================
    // ADD MECHANIC
    // =====================================================

    @PostMapping
    public ResponseEntity<?> addMechanic(
            @RequestBody Mechanic mechanic) {

        if (mechanicRepository.existsByEmail(
                mechanic.getEmail())) {

            return ResponseEntity.badRequest()
                    .body(
                            "Mechanic email already registered"
                    );
        }

        Mechanic savedMechanic =
                mechanicRepository.save(mechanic);

        return ResponseEntity.ok(savedMechanic);
    }


    // =====================================================
    // GET ALL MECHANICS
    // =====================================================

    @GetMapping
    public ResponseEntity<List<Mechanic>>
    getAllMechanics() {

        return ResponseEntity.ok(
                mechanicRepository.findAll()
        );
    }


    // =====================================================
    // GET AVAILABLE MECHANICS
    // =====================================================

    @GetMapping("/available")
    public ResponseEntity<List<Mechanic>>
    getAvailableMechanics() {

        return ResponseEntity.ok(
                mechanicRepository
                        .findByAvailableTrue()
        );
    }


    // =====================================================
    // GET BY SPECIALIZATION
    // =====================================================

    @GetMapping("/specialization/{specialization}")
    public ResponseEntity<List<Mechanic>>
    getBySpecialization(
            @PathVariable String specialization) {

        return ResponseEntity.ok(
                mechanicRepository
                        .findBySpecializationAndAvailableTrue(
                                specialization
                        )
        );
    }


    // =====================================================
    // GET MECHANIC BY ID
    // =====================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getMechanicById(
            @PathVariable Long id) {

        return mechanicRepository
                .findById(id)
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }


    // =====================================================
    // UPDATE AVAILABILITY
    // =====================================================

    @PutMapping("/{id}/availability")
    public ResponseEntity<?> updateAvailability(
            @PathVariable Long id,
            @RequestParam boolean available) {

        return mechanicRepository
                .findById(id)
                .map(mechanic -> {

                    mechanic.setAvailable(
                            available
                    );

                    Mechanic updated =
                            mechanicRepository.save(
                                    mechanic
                            );

                    return ResponseEntity.ok(
                            updated
                    );

                })
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }


    // =====================================================
    // DELETE MECHANIC
    // =====================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMechanic(
            @PathVariable Long id) {

        if (!mechanicRepository
                .existsById(id)) {

            return ResponseEntity
                    .notFound()
                    .build();
        }

        mechanicRepository.deleteById(id);

        return ResponseEntity.ok(
                "Mechanic deleted successfully"
        );
    }
}