package vehicle_assistance.controller;

import vehicle_assistance.model.MechanicLocation;
import vehicle_assistance.repository.MechanicLocationRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/mechanic-location")
@CrossOrigin(origins = "*")
public class MechanicLocationController {

    private final MechanicLocationRepository locationRepository;

    public MechanicLocationController(
            MechanicLocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    // Update mechanic's current location
    @PostMapping
    public ResponseEntity<?> updateLocation(
            @RequestBody MechanicLocation location) {

        location.setUpdatedAt(LocalDateTime.now());

        MechanicLocation savedLocation =
                locationRepository.save(location);

        return ResponseEntity.ok(savedLocation);
    }

    // Get mechanic's latest location
    @GetMapping("/{mechanicId}")
    public ResponseEntity<?> getLatestLocation(
            @PathVariable Long mechanicId) {

        return locationRepository
                .findTopByMechanicIdOrderByUpdatedAtDesc(
                        mechanicId
                )
                .map(ResponseEntity::ok)
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }
}