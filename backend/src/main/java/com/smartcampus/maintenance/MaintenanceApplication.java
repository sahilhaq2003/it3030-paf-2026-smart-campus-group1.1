package com.smartcampus.maintenance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.smartcampus")
@EnableScheduling
@EntityScan(basePackages = {"com.smartcampus.maintenance", "com.smartcampus.user", "com.smartcampus.facilities"})
@EnableJpaRepositories(basePackages = {"com.smartcampus.maintenance", "com.smartcampus.user", "com.smartcampus.facilities"})
public class MaintenanceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MaintenanceApplication.class, args);
    }
}
