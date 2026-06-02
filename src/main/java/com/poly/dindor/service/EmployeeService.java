package com.poly.dindor.service;

import com.poly.dindor.dto.request.EmployeeRequest;
import com.poly.dindor.dto.request.FichePaieRequest;
import com.poly.dindor.dto.response.EmployeeResponse;
import com.poly.dindor.dto.response.FichePaieResponse;
import com.poly.dindor.entity.Employee;
import com.poly.dindor.entity.FichePaie;
import com.poly.dindor.repository.EmployeeRepository;
import com.poly.dindor.repository.FichePaieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeService {

    private static final BigDecimal TAUX_CNSS_EMPLOYE   = new BigDecimal("0.0918");
    private static final BigDecimal TAUX_CNSS_EMPLOYEUR = new BigDecimal("0.1657");
    private static final BigDecimal TAUX_HS_BASE        = new BigDecimal("1.25");

    private final EmployeeRepository  employeeRepository;
    private final FichePaieRepository fichePaieRepository;
    private final PasswordEncoder     passwordEncoder;

    // ── CRUD Employé ──────────────────────────────────────────────────────

    public List<EmployeeResponse> getAll() {
        return employeeRepository.findAllOrdered().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public EmployeeResponse getById(Long id) {
        return toResponse(findEmployee(id));
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest req) {
        if (req.getEmail() != null && employeeRepository.existsByEmail(req.getEmail().toLowerCase().trim())) {
            throw new IllegalArgumentException("Un employé avec cet email existe déjà.");
        }
        Employee emp = Employee.builder()
                .nom(req.getNom().trim())
                .prenom(req.getPrenom().trim())
                .cin(req.getCin())
                .email(req.getEmail() != null ? req.getEmail().toLowerCase().trim() : null)
                .motDePasse(req.getMotDePasse() != null ? passwordEncoder.encode(req.getMotDePasse()) : null)
                .telephone(req.getTelephone())
                .adresse(req.getAdresse())
                .dateNaissance(req.getDateNaissance())
                .situationFamiliale(req.getSituationFamiliale() != null ? req.getSituationFamiliale() : "CELIBATAIRE")
                .nombreEnfants(req.getNombreEnfants() != null ? req.getNombreEnfants() : 0)
                .poste(req.getPoste())
                .departement(req.getDepartement())
                .typeContrat(req.getTypeContrat() != null ? req.getTypeContrat() : "CDI")
                .dateRecrutement(req.getDateRecrutement())
                .statut(req.getStatut() != null ? req.getStatut() : "ACTIF")
                .actif(req.getActif() != null ? req.getActif() : true)
                .salaireBase(req.getSalaireBase() != null ? req.getSalaireBase() : BigDecimal.ZERO)
                .primesFixes(req.getPrimesFixes() != null ? req.getPrimesFixes() : BigDecimal.ZERO)
                .primeRendement(req.getPrimeRendement() != null ? req.getPrimeRendement() : BigDecimal.ZERO)
                .tarifHoraire(req.getTarifHoraire() != null ? req.getTarifHoraire() : BigDecimal.ZERO)
                .heuresNormalesMois(req.getHeuresNormalesMois() != null ? req.getHeuresNormalesMois() : 208)
                .affilieCnss(req.getAffileCnss() != null ? req.getAffileCnss() : true)
                .numeroCNSS(req.getNumeroCnss())
                .rib(req.getRib())
                .notes(req.getNotes())
                .build();

        emp = employeeRepository.save(emp);
        emp.setMatricule(String.format("EMP-%04d", emp.getId()));
        emp = employeeRepository.save(emp);
        return toResponse(emp);
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest req) {
        Employee emp = findEmployee(id);

        if (req.getEmail() != null) {
            String newEmail = req.getEmail().toLowerCase().trim();
            if (!newEmail.equals(emp.getEmail()) && employeeRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("Un employé avec cet email existe déjà.");
            }
            emp.setEmail(newEmail);
        }
        if (req.getMotDePasse() != null && !req.getMotDePasse().isBlank()) {
            emp.setMotDePasse(passwordEncoder.encode(req.getMotDePasse()));
        }

        emp.setNom(req.getNom().trim());
        emp.setPrenom(req.getPrenom().trim());
        emp.setCin(req.getCin());
        emp.setTelephone(req.getTelephone());
        emp.setAdresse(req.getAdresse());
        emp.setDateNaissance(req.getDateNaissance());
        if (req.getSituationFamiliale() != null) emp.setSituationFamiliale(req.getSituationFamiliale());
        if (req.getNombreEnfants() != null) emp.setNombreEnfants(req.getNombreEnfants());
        emp.setPoste(req.getPoste());
        emp.setDepartement(req.getDepartement());
        if (req.getTypeContrat() != null) emp.setTypeContrat(req.getTypeContrat());
        emp.setDateRecrutement(req.getDateRecrutement());
        if (req.getStatut() != null) emp.setStatut(req.getStatut());
        if (req.getActif() != null) emp.setActif(req.getActif());
        if (req.getSalaireBase() != null) emp.setSalaireBase(req.getSalaireBase());
        if (req.getPrimesFixes() != null) emp.setPrimesFixes(req.getPrimesFixes());
        if (req.getPrimeRendement() != null) emp.setPrimeRendement(req.getPrimeRendement());
        if (req.getTarifHoraire() != null) emp.setTarifHoraire(req.getTarifHoraire());
        if (req.getHeuresNormalesMois() != null) emp.setHeuresNormalesMois(req.getHeuresNormalesMois());
        if (req.getAffileCnss() != null) emp.setAffileCnss(req.getAffileCnss());
        emp.setNumeroCNSS(req.getNumeroCnss());
        emp.setRib(req.getRib());
        emp.setNotes(req.getNotes());

        return toResponse(employeeRepository.save(emp));
    }

    @Transactional
    public void delete(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new NoSuchElementException("Employé introuvable : " + id);
        }
        employeeRepository.deleteById(id);
    }

    // ── Fiches de paie ────────────────────────────────────────────────────

    public List<FichePaieResponse> getFichesByEmployee(Long employeId) {
        return fichePaieRepository.findByEmployeIdOrderByAnneeDescMoisDesc(employeId).stream()
                .map(this::toFicheResponse)
                .collect(Collectors.toList());
    }

    public FichePaieResponse getFicheById(Long id) {
        return toFicheResponse(findFiche(id));
    }

    @Transactional
    public FichePaieResponse genererFiche(FichePaieRequest req) {
        Employee emp = findEmployee(req.getEmployeId());

        if (fichePaieRepository.existsByEmployeIdAndMoisAndAnnee(emp.getId(), req.getMois(), req.getAnnee())) {
            throw new IllegalArgumentException(
                "Une fiche de paie existe déjà pour " + emp.getNom() + " — " + periodeLabel(req.getMois(), req.getAnnee()));
        }

        BigDecimal base        = req.getSalaireBase();
        BigDecimal primesFixes = orZero(req.getPrimesFixes());
        BigDecimal primeRend   = orZero(req.getPrimeRendement());
        BigDecimal indemnites  = orZero(req.getIndemnites());
        int heuresSupp         = req.getHeuresSupplementaires() != null ? req.getHeuresSupplementaires() : 0;

        // Calcul taux horaire HS (si non fourni = salaire de base / heures normales * 1.25)
        BigDecimal tauxHS = orZero(req.getTauxHoraireHS());
        if (tauxHS.compareTo(BigDecimal.ZERO) == 0 && emp.getHeuresNormalesMois() > 0) {
            tauxHS = base.divide(BigDecimal.valueOf(emp.getHeuresNormalesMois()), 3, RoundingMode.HALF_UP)
                        .multiply(TAUX_HS_BASE);
        }
        BigDecimal montantHS = tauxHS.multiply(BigDecimal.valueOf(heuresSupp)).setScale(3, RoundingMode.HALF_UP);

        BigDecimal brut = base.add(primesFixes).add(primeRend).add(indemnites).add(montantHS);

        BigDecimal cnssEmploye   = Boolean.TRUE.equals(emp.getAffileCnss())
                ? brut.multiply(TAUX_CNSS_EMPLOYE).setScale(3, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal cnssEmployeur = Boolean.TRUE.equals(emp.getAffileCnss())
                ? brut.multiply(TAUX_CNSS_EMPLOYEUR).setScale(3, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        BigDecimal imposable = brut.subtract(cnssEmploye);
        BigDecimal avance    = orZero(req.getAvanceSalaire());
        BigDecimal retenues  = orZero(req.getAutresRetenues());
        BigDecimal net       = imposable.subtract(avance).subtract(retenues);

        // Numéro bulletin séquentiel
        long seq = fichePaieRepository.countByMoisAnnee(req.getMois(), req.getAnnee()) + 1;
        String numBulletin = String.format("FP-%04d-%02d-%03d", req.getAnnee(), req.getMois(), seq);

        FichePaie fiche = FichePaie.builder()
                .numeroBulletin(numBulletin)
                .employe(emp)
                .mois(req.getMois())
                .annee(req.getAnnee())
                .salaireBase(base)
                .primesFixes(primesFixes)
                .primeRendement(primeRend)
                .indemnites(indemnites)
                .heuresSupplementaires(heuresSupp)
                .tauxHoraireHS(tauxHS)
                .montantHS(montantHS)
                .salaireBrut(brut)
                .cotisationCNSSEmploye(cnssEmploye)
                .cotisationCNSSEmployeur(cnssEmployeur)
                .salaireImposable(imposable)
                .avanceSalaire(avance)
                .autresRetenues(retenues)
                .salaireNet(net)
                .statut(req.getStatut() != null ? req.getStatut() : "BROUILLON")
                .datePaiement(req.getDatePaiement())
                .notes(req.getNotes())
                .build();

        return toFicheResponse(fichePaieRepository.save(fiche));
    }

    @Transactional
    public FichePaieResponse updateStatutFiche(Long id, String statut, java.time.LocalDate datePaiement) {
        FichePaie fiche = findFiche(id);
        fiche.setStatut(statut);
        if (datePaiement != null) fiche.setDatePaiement(datePaiement);
        return toFicheResponse(fichePaieRepository.save(fiche));
    }

    @Transactional
    public void deleteFiche(Long id) {
        fichePaieRepository.deleteById(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Employé introuvable : " + id));
    }

    private FichePaie findFiche(Long id) {
        return fichePaieRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Fiche de paie introuvable : " + id));
    }

    private BigDecimal orZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private String periodeLabel(int mois, int annee) {
        return Month.of(mois).getDisplayName(TextStyle.FULL, Locale.FRENCH) + " " + annee;
    }

    // ── Mappers ───────────────────────────────────────────────────────────

    private EmployeeResponse toResponse(Employee e) {
        return EmployeeResponse.builder()
                .id(e.getId())
                .matricule(e.getMatricule())
                .cin(e.getCin())
                .nom(e.getNom())
                .prenom(e.getPrenom())
                .nomComplet(e.getPrenom() + " " + e.getNom())
                .telephone(e.getTelephone())
                .email(e.getEmail())
                .adresse(e.getAdresse())
                .dateNaissance(e.getDateNaissance())
                .situationFamiliale(e.getSituationFamiliale())
                .nombreEnfants(e.getNombreEnfants())
                .poste(e.getPoste())
                .departement(e.getDepartement())
                .typeContrat(e.getTypeContrat())
                .dateRecrutement(e.getDateRecrutement())
                .statut(e.getStatut())
                .actif(e.getActif())
                .salaireBase(e.getSalaireBase())
                .primesFixes(e.getPrimesFixes())
                .primeRendement(e.getPrimeRendement())
                .tarifHoraire(e.getTarifHoraire())
                .heuresNormalesMois(e.getHeuresNormalesMois())
                .affilieCNSS(e.getAffileCnss())
                .numeroCNSS(e.getNumeroCNSS())
                .rib(e.getRib())
                .notes(e.getNotes())
                .dateCreation(e.getDateCreation())
                .build();
    }

    public FichePaieResponse toFicheResponse(FichePaie f) {
        Employee emp = f.getEmploye();
        return FichePaieResponse.builder()
                .id(f.getId())
                .numeroBulletin(f.getNumeroBulletin())
                .employeId(emp.getId())
                .employeNom(emp.getNom())
                .employePrenom(emp.getPrenom())
                .employeMatricule(emp.getMatricule())
                .employePoste(emp.getPoste())
                .employeDepartement(emp.getDepartement())
                .employeCIN(emp.getCin())
                .employeNumeroCNSS(emp.getNumeroCNSS())
                .employeRib(emp.getRib())
                .employeTypeContrat(emp.getTypeContrat())
                .mois(f.getMois())
                .annee(f.getAnnee())
                .periodeLabel(periodeLabel(f.getMois(), f.getAnnee()))
                .salaireBase(f.getSalaireBase())
                .primesFixes(f.getPrimesFixes())
                .primeRendement(f.getPrimeRendement())
                .indemnites(f.getIndemnites())
                .heuresSupplementaires(f.getHeuresSupplementaires())
                .tauxHoraireHS(f.getTauxHoraireHS())
                .montantHS(f.getMontantHS())
                .salaireBrut(f.getSalaireBrut())
                .cotisationCNSSEmploye(f.getCotisationCNSSEmploye())
                .cotisationCNSSEmployeur(f.getCotisationCNSSEmployeur())
                .salaireImposable(f.getSalaireImposable())
                .avanceSalaire(f.getAvanceSalaire())
                .autresRetenues(f.getAutresRetenues())
                .salaireNet(f.getSalaireNet())
                .statut(f.getStatut())
                .datePaiement(f.getDatePaiement())
                .notes(f.getNotes())
                .dateCreation(f.getDateCreation())
                .build();
    }
}
