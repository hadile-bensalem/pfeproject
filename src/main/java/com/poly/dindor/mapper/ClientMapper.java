package com.poly.dindor.mapper;

import com.poly.dindor.dto.request.ClientRequest;
import com.poly.dindor.dto.response.ClientResponse;
import com.poly.dindor.entity.Client;

public class ClientMapper {

    private ClientMapper() {}

    public static ClientResponse toResponse(Client c) {
        ClientResponse r = new ClientResponse();
        r.setId(c.getId());
        r.setCodeClient(c.getCodeClient());
        r.setTypeClient(c.getTypeClient());
        r.setNom(c.getNom());
        r.setResponsable(c.getResponsable());
        r.setTelephone(c.getTelephone());
        r.setTelephone2(c.getTelephone2());
        r.setFax(c.getFax());
        r.setEmail(c.getEmail());
        r.setAdresse(c.getAdresse());
        r.setVille(c.getVille());
        r.setZone(c.getZone());
        r.setMatriculeFiscal(c.getMatriculeFiscal());
        r.setCodeTVA(c.getCodeTVA());
        r.setTva(c.getTva());
        r.setPrixVente(c.getPrixVente());
        r.setPlafond(c.getPlafond());
        r.setDevise(c.getDevise());
        r.setDateInscription(c.getDateInscription() != null ? c.getDateInscription().toString() : null);
        r.setNotes(c.getNotes());
        r.setActif(Boolean.TRUE.equals(c.getActif()));
        r.setSoldeTotalDu(c.getSoldeTotalDu());
        return r;
    }

    public static Client toEntity(ClientRequest req, String codeClient) {
        return Client.builder()
                .codeClient(codeClient)
                .typeClient(req.getTypeClient() != null ? req.getTypeClient() : "AUTRE")
                .nom(req.getNom().trim())
                .responsable(req.getResponsable())
                .telephone(req.getTelephone())
                .telephone2(req.getTelephone2())
                .fax(req.getFax())
                .email(req.getEmail())
                .adresse(req.getAdresse())
                .ville(req.getVille())
                .zone(req.getZone())
                .matriculeFiscal(req.getMatriculeFiscal())
                .codeTVA(req.getCodeTVA())
                .tva(req.getTva())
                .prixVente(req.getPrixVente() != null ? req.getPrixVente() : 1)
                .plafond(req.getPlafond())
                .devise(req.getDevise() != null ? req.getDevise() : "DT")
                .notes(req.getNotes())
                .actif(req.isActif())
                .build();
    }

    public static void updateEntity(Client c, ClientRequest req) {
        c.setTypeClient(req.getTypeClient() != null ? req.getTypeClient() : "AUTRE");
        c.setNom(req.getNom().trim());
        c.setResponsable(req.getResponsable());
        c.setTelephone(req.getTelephone());
        c.setTelephone2(req.getTelephone2());
        c.setFax(req.getFax());
        c.setEmail(req.getEmail());
        c.setAdresse(req.getAdresse());
        c.setVille(req.getVille());
        c.setZone(req.getZone());
        c.setMatriculeFiscal(req.getMatriculeFiscal());
        c.setCodeTVA(req.getCodeTVA());
        c.setTva(req.getTva());
        c.setPrixVente(req.getPrixVente() != null ? req.getPrixVente() : 1);
        c.setPlafond(req.getPlafond());
        c.setDevise(req.getDevise() != null ? req.getDevise() : "DT");
        c.setNotes(req.getNotes());
        c.setActif(req.isActif());
    }
}
