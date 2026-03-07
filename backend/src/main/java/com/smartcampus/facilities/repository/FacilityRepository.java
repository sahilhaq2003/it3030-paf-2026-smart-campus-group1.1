package com.smartcampus.facilities.repository;

import com.smartcampus.facilities.model.Facility;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<Facility, Long> {
}
