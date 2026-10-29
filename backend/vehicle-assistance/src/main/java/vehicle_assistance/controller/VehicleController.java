package vehicle_assistance.controller;

import vehicle_assistance.model.Vehicle;
import vehicle_assistance.repository.VehicleRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
public class VehicleController {

    private final VehicleRepository vehicleRepository;

    public VehicleController(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @PostMapping
    public ResponseEntity<?> addVehicle(
            @RequestBody Vehicle vehicle) {

        if (vehicleRepository.existsByVehicleNumber(
                vehicle.getVehicleNumber())) {

            return ResponseEntity.badRequest()
                    .body("Vehicle number already registered");
        }

        Vehicle savedVehicle =
                vehicleRepository.save(vehicle);

        return ResponseEntity.ok(savedVehicle);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Vehicle>> getUserVehicles(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                vehicleRepository.findByUserId(userId)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVehicle(
            @PathVariable Long id) {

        if (!vehicleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        vehicleRepository.deleteById(id);

        return ResponseEntity.ok(
                "Vehicle deleted successfully"
        );
    }
}