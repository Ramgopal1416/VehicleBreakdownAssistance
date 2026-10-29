package vehicle_assistance.controller;

import vehicle_assistance.dto.LoginRequest;
import vehicle_assistance.dto.RegisterRequest;
import vehicle_assistance.dto.MechanicRegisterRequest;
import vehicle_assistance.model.Mechanic;
import vehicle_assistance.model.User;
import vehicle_assistance.repository.MechanicRepository;
import vehicle_assistance.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final MechanicRepository mechanicRepository;

    public AuthController(
            UserService userService,
            PasswordEncoder passwordEncoder,
            MechanicRepository mechanicRepository) {

        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.mechanicRepository = mechanicRepository;
    }

    // =====================================================
    // CUSTOMER REGISTRATION
    // =====================================================

    @PostMapping("/register/customer")
    public ResponseEntity<?> registerCustomer(
            @RequestBody RegisterRequest request) {

        try {

            User user = new User();

            user.setName(request.getName());
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            user.setPassword(request.getPassword());
            user.setRole("USER");

            User savedUser =
                    userService.registerUser(user);

            Map<String, Object> response =
                    new HashMap<>();

            response.put("message", "Customer account created");
            response.put("userId", savedUser.getId());
            response.put("name", savedUser.getName());
            response.put("email", savedUser.getEmail());
            response.put("role", savedUser.getRole());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }


    // =====================================================
    // MECHANIC REGISTRATION
    // =====================================================

    @PostMapping("/register/mechanic")
    public ResponseEntity<?> registerMechanic(
            @RequestBody MechanicRegisterRequest request) {

        try {

            // Check user email
            if (userService.emailExists(request.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "message",
                                "Email already registered"
                        ));
            }

            // Check mechanic email
            if (mechanicRepository.existsByEmail(
                    request.getEmail())) {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "message",
                                "Mechanic email already registered"
                        ));
            }


            // Create LOGIN account
            User user = new User();

            user.setName(request.getOwnerName());
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            user.setPassword(request.getPassword());
            user.setRole("MECHANIC");

            User savedUser =
                    userService.registerUser(user);


            // Create SHOP / MECHANIC profile
            Mechanic mechanic = new Mechanic();

            mechanic.setName(request.getShopName());
            mechanic.setEmail(request.getEmail());
            mechanic.setPhone(request.getPhone());
            mechanic.setSpecialization(
                    request.getSpecialization()
            );
            mechanic.setLocation(
                    request.getLocation()
            );
            mechanic.setLatitude(
                    request.getLatitude()
            );
            mechanic.setLongitude(
                    request.getLongitude()
            );
            mechanic.setAvailable(true);
            mechanic.setRating(0.0);

            Mechanic savedMechanic =
                    mechanicRepository.save(mechanic);


            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "message",
                    "Mechanic account created"
            );

            response.put(
                    "userId",
                    savedUser.getId()
            );

            response.put(
                    "mechanicId",
                    savedMechanic.getId()
            );

            response.put(
                    "ownerName",
                    request.getOwnerName()
            );

            response.put(
                    "shopName",
                    savedMechanic.getName()
            );

            response.put(
                    "email",
                    savedMechanic.getEmail()
            );

            response.put(
                    "role",
                    "MECHANIC"
            );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            e.getMessage()
                    ));
        }
    }


    // =====================================================
    // LOGIN
    // =====================================================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        try {

            User user =
                    userService.findByEmail(
                            request.getEmail()
                    );

            boolean passwordMatches =
                    passwordEncoder.matches(
                            request.getPassword(),
                            user.getPassword()
                    );

            if (!passwordMatches) {

                return ResponseEntity.status(401)
                        .body(Map.of(
                                "message",
                                "Invalid email or password"
                        ));
            }

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "message",
                    "Login successful"
            );

            response.put(
                    "userId",
                    user.getId()
            );

            response.put(
                    "name",
                    user.getName()
            );

            response.put(
                    "email",
                    user.getEmail()
            );

            response.put(
                    "role",
                    user.getRole()
            );


            // Add mechanic information
            if (
                    user.getRole() != null &&
                    user.getRole()
                            .equalsIgnoreCase("MECHANIC")
            ) {

                Mechanic mechanic =
                        mechanicRepository
                                .findByEmail(
                                        user.getEmail()
                                )
                                .orElse(null);

                if (mechanic != null) {

                    response.put(
                            "mechanicId",
                            mechanic.getId()
                    );

                    response.put(
                            "mechanicName",
                            mechanic.getName()
                    );

                    response.put(
                            "specialization",
                            mechanic.getSpecialization()
                    );

                    response.put(
                            "available",
                            mechanic.isAvailable()
                    );
                }
            }

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity.status(401)
                    .body(Map.of(
                            "message",
                            "Invalid email or password"
                    ));
        }
    }
}