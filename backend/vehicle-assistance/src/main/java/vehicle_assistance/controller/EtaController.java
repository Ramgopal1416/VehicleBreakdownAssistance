package vehicle_assistance.controller;

import vehicle_assistance.service.EtaService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/eta")
@CrossOrigin(origins = "*")
public class EtaController {

    private final EtaService etaService;

    public EtaController(EtaService etaService) {
        this.etaService = etaService;
    }

    @GetMapping("/{breakdownId}")
    public ResponseEntity<?> getEta(
            @PathVariable Long breakdownId) {

        try {

            Map<String, Object> response =
                    etaService.calculateEta(breakdownId);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }
}