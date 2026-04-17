package com.smartcampus.facilities.repository;

import com.smartcampus.facilities.model.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for managing Facility entities.
 * Extends JpaRepository for basic CRUD operations and
 * JpaSpecificationExecutor for advanced queries using specifications.
 */
@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long>, JpaSpecificationExecutor<Facility> {
    
    /**
     * Checks if a facility with the given physical location already exists.
     * The location matching is case-insensitive.
     * 
     * @param location the location to check for existence
     * @return true if a facility exists at the location, false otherwise
     */
    boolean existsByLocationIgnoreCase(String location);
}
