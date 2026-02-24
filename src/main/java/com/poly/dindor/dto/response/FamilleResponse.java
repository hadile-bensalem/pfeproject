package com.poly.dindor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamilleResponse {

    private Long id;
    private Integer code;
    private String nom;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
}
