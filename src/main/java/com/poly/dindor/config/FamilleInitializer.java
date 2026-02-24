package com.poly.dindor.config;

import com.poly.dindor.entity.Famille;
import com.poly.dindor.repository.FamilleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class FamilleInitializer implements CommandLineRunner {

    private final FamilleRepository familleRepository;

    private static final List<Famille> DEFAULTS = List.of(
            Famille.builder().code(1).nom("STOCK_ARTICLE").build(),
            Famille.builder().code(2).nom("Aliments").build(),
            Famille.builder().code(3).nom("Matériel").build(),
            Famille.builder().code(4).nom("Hygiène").build(),
            Famille.builder().code(5).nom("Divers").build(),
            Famille.builder().code(6).nom("Consommable").build()
    );

    @Override
    public void run(String... args) {
        if (familleRepository.count() > 0) return;
        familleRepository.saveAll(DEFAULTS);
    }
}
