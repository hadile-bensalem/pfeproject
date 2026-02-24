package com.poly.dindor.security;

import com.poly.dindor.entity.Admin;
import com.poly.dindor.repository.AdminRepository;
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
    
    private final AdminRepository adminRepository;
    
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Admin admin = adminRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Admin non trouvé avec l'email : " + email));
        
        if (!admin.getActive()) {
            throw new UsernameNotFoundException("Compte désactivé");
        }
        
        List<GrantedAuthority> authorities = Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_ADMIN")
        );
        
        return User.builder()
            .username(admin.getEmail())
            .password(admin.getPassword())
            .authorities(authorities)
            .accountExpired(false)
            .accountLocked(admin.isLocked())
            .credentialsExpired(false)
            .disabled(!admin.getActive())
            .build();
    }
}
