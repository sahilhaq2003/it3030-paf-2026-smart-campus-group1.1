package com.smartcampus.facilities.repository;

import com.smartcampus.facilities.model.Facility;
import com.smartcampus.facilities.model.ResourceType;
import com.smartcampus.facilities.model.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FacilityRepository extends JpaRepository<Facility, Long> {

    @Query("SELECT f FROM Facility f WHERE " +
           "(:type IS NULL OR f.resourceType = :type) AND " +
           "(:capacity IS NULL OR f.capacity >= :capacity) AND " +
           "(:location IS NULL OR LOWER(f.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:status IS NULL OR f.status = :status)")
    Page<Facility> searchFacilities(@Param("type") ResourceType type,
                                    @Param("capacity") Integer capacity,
                                    @Param("location") String location,
                                    @Param("status") Status status,
                                    Pageable pageable);
}
