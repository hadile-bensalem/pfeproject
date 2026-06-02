package com.poly.dindor.controller;

import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.TraiteAlertDTO;
import com.poly.dindor.service.TraiteNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final TraiteNotificationService traiteNotificationService;

    @GetMapping("/traites-echeance")
    public ResponseEntity<ApiResponse<List<TraiteAlertDTO>>> getTraitesEcheance() {
        return ResponseEntity.ok(
            ApiResponse.success(traiteNotificationService.getTraitesEcheantProchainement()));
    }
}
