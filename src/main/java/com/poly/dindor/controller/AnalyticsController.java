package com.poly.dindor.controller;

import com.poly.dindor.dto.response.*;
import com.poly.dindor.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/ca-mensuel")
    public ResponseEntity<List<CaMensuelResponse>> getCaMensuel(
            @RequestParam(required = false) Integer annee) {
        int year = annee != null ? annee : LocalDate.now().getYear();
        return ResponseEntity.ok(analyticsService.getCaMensuel(year));
    }

    @GetMapping("/top-clients")
    public ResponseEntity<List<TopClientResponse>> getTopClients(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(analyticsService.getTopClients(dateDebut, dateFin));
    }

    @GetMapping("/top-articles")
    public ResponseEntity<List<TopArticleResponse>> getTopArticles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(analyticsService.getTopArticles(dateDebut, dateFin));
    }

    @GetMapping("/recouvrement")
    public ResponseEntity<RecouvrementStatsResponse> getRecouvrement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return ResponseEntity.ok(analyticsService.getRecouvrement(dateDebut, dateFin));
    }
}
