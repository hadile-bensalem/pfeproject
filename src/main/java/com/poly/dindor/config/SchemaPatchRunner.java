package com.poly.dindor.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Applique des corrections de schéma que ddl-auto=update ne peut pas faire
 * (modifier des colonnes existantes). S'exécute après le démarrage de Hibernate.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class SchemaPatchRunner implements ApplicationRunner {

    private final DataSource dataSource;

    @Override
    public void run(ApplicationArguments args) {
        patchColumn("ALTER TABLE bon_livraison "
                + "ALTER COLUMN date_modification DROP NOT NULL",
                "bon_livraison.date_modification → nullable");

        patchColumn("ALTER TABLE bon_livraison "
                + "ALTER COLUMN date_creation SET DEFAULT CURRENT_TIMESTAMP",
                "bon_livraison.date_creation → default CURRENT_TIMESTAMP");

        patchColumn("ALTER TABLE clients "
                + "ALTER COLUMN date_modification DROP NOT NULL",
                "clients.date_modification → nullable");

        patchColumn("UPDATE clients SET actif = true WHERE actif IS NULL",
                "clients.actif → fix NULL values");
    }

    private void patchColumn(String sql, String label) {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
            log.info("Schema patch OK : {}", label);
        } catch (Exception e) {
            // Colonne déjà correcte ou table inexistante — on ignore
            log.debug("Schema patch ignoré ({}) : {}", label, e.getMessage());
        }
    }
}
