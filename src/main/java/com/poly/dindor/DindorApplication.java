package com.poly.dindor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DindorApplication {

	public static void main(String[] args) {
		SpringApplication.run(DindorApplication.class, args);
	}

}
