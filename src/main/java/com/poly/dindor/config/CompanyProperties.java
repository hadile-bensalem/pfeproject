package com.poly.dindor.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Propriétés de la société Dind'Or (Section A du certificat de retenue).
 * Valeurs configurables via application.properties (app.company.*)
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.company")
public class CompanyProperties {

    /** Matricule fiscal (10 caractères max) */
    private String matriculeFiscal = "1790869BM";

    /** Code TVA (1 lettre : A = Assujetti, B = Non-assujetti, etc.) */
    private String codeTva = "A";

    /** Code catégorie (1 chiffre) */
    private String codeCategorie = "0";

    /** Numéro d'établissement secondaire (3 chiffres) */
    private String numeroEtablissement = "000";

    /** Raison sociale / Dénomination */
    private String denomination = "STE DINDOR";

    /** Adresse du siège */
    private String adresse = "RUE IBN CHAREF";

    /** Ville */
    private String ville = "KSIB";
}
