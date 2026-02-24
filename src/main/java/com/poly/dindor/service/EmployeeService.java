package com.poly.dindor.service;

import com.poly.dindor.dto.request.EmployeeRequest;
import com.poly.dindor.dto.response.EmployeeResponse;
import com.poly.dindor.entity.Employee;
import com.poly.dindor.mapper.EmployeeMapper;
import com.poly.dindor.repository.EmployeeRepository;
import com.poly.dindor.util.ServiceUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        if (employeeRepository.existsByMatricule(request.getMatricule())) {
            throw new IllegalArgumentException("Un employé avec ce matricule existe déjà");
        }
        if (employeeRepository.existsByCin(request.getCin())) {
            throw new IllegalArgumentException("Un employé avec ce CIN existe déjà");
        }
        Employee entity = EmployeeMapper.toEntity(request);
        return EmployeeMapper.toResponse(employeeRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAll() {
        return employeeRepository.findAll().stream()
                .map(EmployeeMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getById(Long id) {
        return EmployeeMapper.toResponse(ServiceUtils.findByIdOrThrow(employeeRepository, id, "Employé"));
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        Employee entity = ServiceUtils.findByIdOrThrow(employeeRepository, id, "Employé");
        if (!entity.getMatricule().equals(request.getMatricule())
                && employeeRepository.existsByMatricule(request.getMatricule())) {
            throw new IllegalArgumentException("Un employé avec ce matricule existe déjà");
        }
        if (!entity.getCin().equals(request.getCin())
                && employeeRepository.existsByCin(request.getCin())) {
            throw new IllegalArgumentException("Un employé avec ce CIN existe déjà");
        }
        EmployeeMapper.updateEntity(entity, request);
        return EmployeeMapper.toResponse(employeeRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        ServiceUtils.deleteByIdOrThrow(employeeRepository, id, "Employé");
    }
}
