package vehicle_assistance.controller;

import vehicle_assistance.service.NearbyMechanicService;
import vehicle_assistance.service.NearbyMechanicService.MechanicDistance;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mechanics")
@CrossOrigin(origins = "*")
public class NearbyMechanicController {

    private final NearbyMechanicService nearbyMechanicService;

    public NearbyMechanicController(
            NearbyMechanicService nearbyMechanicService) {

        this.nearbyMechanicService = nearbyMechanicService;
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<MechanicDistance>> findNearbyMechanics(

            @RequestParam("latitude") double latitude,

            @RequestParam("longitude") double longitude,

            @RequestParam(value = "radiusKm", defaultValue = "10") double radiusKm) {

        List<MechanicDistance> mechanics =
                nearbyMechanicService.findNearbyMechanics(
                        latitude,
                        longitude,
                        radiusKm
                );

        return ResponseEntity.ok(mechanics);
    }
}