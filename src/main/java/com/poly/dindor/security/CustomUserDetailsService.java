package com.poly.dindor.security;

import com.poly.dindor.entity.Admin;
import com.poly.dindor.entity.Employee;
import com.poly.dindor.repository.AdminRepository;
import com.poly.dindor.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminRepository    adminRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String normalized = email.toLowerCase().trim();

        java.util.Optional<Admin> adminOpt = adminRepository.findByEmail(normalized);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            if (!admin.getActive()) throw new UsernameNotFoundException("Compte désactivé");
            List<GrantedAuthority> authorities = Collections.singletonList(
                    new SimpleGrantedAuthority("ROLE_ADMIN"));
            return User.builder()
                    .username(admin.getEmail())
                    .password(admin.getPassword())
                    .authorities(authorities)
                    .accountLocked(admin.isLocked())
                    .disabled(!admin.getActive())
                    .build();
        }

        java.util.Optional<Employee> empOpt = employeeRepository.findByEmail(normalized);
        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();
            if (!Boolean.TRUE.equals(emp.getActif())) throw new UsernameNotFoundException("Compte employé désactivé");
            if (emp.getMotDePasse() == null) throw new UsernameNotFoundException("Employé sans accès configuré");
            List<GrantedAuthority> authorities = Collections.singletonList(
                    new SimpleGrantedAuthority("ROLE_EMPLOYE"));
            return User.builder()
                    .username(emp.getEmail())
                    .password(emp.getMotDePasse())
                    .authorities(authorities)
                    .build();
        }

        throw new UsernameNotFoundException("Aucun utilisateur trouvé avec l'email : " + email);
    }
}
