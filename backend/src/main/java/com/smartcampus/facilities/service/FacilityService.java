package com.smartcampus.facilities.service;

import com.smartcampus.facilities.dto.FacilityDto;
import com.smartcampus.facilities.model.ResourceType;
import com.smartcampus.facilities.model.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for defining operations related to Facilities management.
 */
public interface FacilityService {
    /**
     * Creates a new facility.
     *
     * @param facilityDto the facility details
     * @return the created facility DTO
     */
    FacilityDto createFacility(FacilityDto facilityDto);

    /**
     * Retrieves a facility by its ID.
     *
     * @param id the facility ID
     * @return the facility DTO
     */
    FacilityDto getFacilityById(Long id);

    /**
     * Retrieves a paginated list of all facilities.
     *
     * @param pageable pagination info
     * @return a page of facility DTOs
     */
    Page<FacilityDto> getAllFacilities(Pageable pageable);

    /**
     * Updates an existing facility.
     *
     * @param id the facility ID
     * @param facilityDto the new facility details
     * @return the updated facility DTO
     */
    FacilityDto updateFacility(Long id, FacilityDto facilityDto);

    /**
     * Updates only the operational status of a facility.
     *
     * @param id the facility ID
     * @param status the new status
     * @return the updated facility DTO
     */
    FacilityDto updateFacilityStatus(Long id, Status status);

    /**
     * Deletes a facility by ID.
     *
     * @param id the facility ID
     */
    void deleteFacility(Long id);

    /**
     * Searches for facilities based on criteria.
     *
     * @param name part or full name
     * @param type the resource type
     * @param capacity minimum capacity
     * @param location specific location
     * @param status operational status
     * @param pageable pagination info
     * @return a page of matching facility DTOs
     */
    Page<FacilityDto> searchFacilities(String name, ResourceType type, Integer capacity, String location, Status status, Pageable pageable);
}
