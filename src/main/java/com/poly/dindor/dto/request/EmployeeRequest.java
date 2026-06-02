package com.poly.dindor.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class EmployeeRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    private String cin;

    @Email(message = "Email invalide")
    private String email;

    private String motDePasse;
    private String telephone;
    private String adresse;
    private LocalDate dateNaissance;
    private String situationFamiliale;
    private Integer nombreEnfants;

    @NotBlank(message = "Le poste est obligatoire")
    private String poste;

    private String departement;
    private String typeContrat;
    private LocalDate dateRecrutement;
    private String statut;
    private Boolean actif;

    @NotNull(message = "Le salaire de base est obligatoire")
    private BigDecimal salaireBase;

    private BigDecimal primesFixes;
    private BigDecimal primeRendement;
    private BigDecimal tarifHoraire;
    private Integer heuresNormalesMois;

    @JsonProperty("affilieCNSS")
    private Boolean affilieCnss;

    @JsonProperty("numeroCNSS")
    private String numeroCnss;
    private String rib;
    private String notes;

    // ── Getters ───────────────────────────────────────────────────────────

    public String getNom()              { return nom; }
    public String getPrenom()           { return prenom; }
    public String getCin()              { return cin; }
    public String getEmail()            { return email; }
    public String getMotDePasse()       { return motDePasse; }
    public String getTelephone()        { return telephone; }
    public String getAdresse()          { return adresse; }
    public LocalDate getDateNaissance() { return dateNaissance; }
    public String getSituationFamiliale() { return situationFamiliale; }
    public Integer getNombreEnfants()   { return nombreEnfants; }
    public String getPoste()            { return poste; }
    public String getDepartement()      { return departement; }
    public String getTypeContrat()      { return typeContrat; }
    public LocalDate getDateRecrutement() { return dateRecrutement; }
    public String getStatut()           { return statut; }
    public Boolean getActif()           { return actif; }
    public BigDecimal getSalaireBase()  { return salaireBase; }
    public BigDecimal getPrimesFixes()  { return primesFixes; }
    public BigDecimal getPrimeRendement() { return primeRendement; }
    public BigDecimal getTarifHoraire() { return tarifHoraire; }
    public Integer getHeuresNormalesMois() { return heuresNormalesMois; }
    public Boolean getAffileCnss()      { return affilieCnss; }
    public String getNumeroCnss()       { return numeroCnss; }
    public String getRib()              { return rib; }
    public String getNotes()            { return notes; }

    // ── Setters ───────────────────────────────────────────────────────────

    public void setNom(String v)              { this.nom = v; }
    public void setPrenom(String v)           { this.prenom = v; }
    public void setCin(String v)              { this.cin = v; }
    public void setEmail(String v)            { this.email = v; }
    public void setMotDePasse(String v)       { this.motDePasse = v; }
    public void setTelephone(String v)        { this.telephone = v; }
    public void setAdresse(String v)          { this.adresse = v; }
    public void setDateNaissance(LocalDate v) { this.dateNaissance = v; }
    public void setSituationFamiliale(String v) { this.situationFamiliale = v; }
    public void setNombreEnfants(Integer v)   { this.nombreEnfants = v; }
    public void setPoste(String v)            { this.poste = v; }
    public void setDepartement(String v)      { this.departement = v; }
    public void setTypeContrat(String v)      { this.typeContrat = v; }
    public void setDateRecrutement(LocalDate v) { this.dateRecrutement = v; }
    public void setStatut(String v)           { this.statut = v; }
    public void setActif(Boolean v)           { this.actif = v; }
    public void setSalaireBase(BigDecimal v)  { this.salaireBase = v; }
    public void setPrimesFixes(BigDecimal v)  { this.primesFixes = v; }
    public void setPrimeRendement(BigDecimal v) { this.primeRendement = v; }
    public void setTarifHoraire(BigDecimal v) { this.tarifHoraire = v; }
    public void setHeuresNormalesMois(Integer v) { this.heuresNormalesMois = v; }
    public void setAffileCnss(Boolean v)      { this.affilieCnss = v; }
    public void setNumeroCnss(String v)       { this.numeroCnss = v; }
    public void setRib(String v)              { this.rib = v; }
    public void setNotes(String v)            { this.notes = v; }
}
