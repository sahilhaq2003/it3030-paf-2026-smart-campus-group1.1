package com.smartcampus.facilities.controller;

import com.smartcampus.facilities.dto.FacilityDto;
import com.smartcampus.facilities.service.FacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartcampus.facilities.dto.FacilityStatusUpdateDto;
import com.smartcampus.facilities.model.ResourceType;
import com.smartcampus.facilities.model.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * REST controller for managing facilities in the Smart Campus system.
 * Provides endpoints for creating, retrieving, updating, and deleting facilities.
 */
@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    /**
     * Creates a new facility. Accessible only by ADMIN role.
     *
     * @param facilityDto the facility data to create
     * @return the created facility wrapped in a ResponseEntity
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDto> createFacility(@Valid @RequestBody FacilityDto facilityDto) {
        return new ResponseEntity<>(facilityService.createFacility(facilityDto), HttpStatus.CREATED);
    }

    /**
     * Retrieves a specific facility by its ID.
     *
     * @param id the ID of the facility
     * @return the requested facility
     */
    @GetMapping("/{id}")
    public ResponseEntity<FacilityDto> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }

    /**
     * Retrieves a paginated list of all facilities.
     *
     * @param pageable pagination parameters
     * @return a page of facilities
     */
    @GetMapping
    public ResponseEntity<Page<FacilityDto>> getAllFacilities(Pageable pageable) {
        return ResponseEntity.ok(facilityService.getAllFacilities(pageable));
    }

    /**
     * Searches for facilities based on various optional filter parameters.
     *
     * @param name     the name or partial name to match
     * @param type     the type of the resource
     * @param capacity the minimum capacity
     * @param location the location to search in
     * @param status   the status of the facility
     * @param pageable pagination parameters
     * @return a paginated list of matching facilities
     */
    @GetMapping("/search")
    public ResponseEntity<Page<FacilityDto>> searchFacilities(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Status status,
            Pageable pageable) {
        return ResponseEntity.ok(facilityService.searchFacilities(name, type, capacity, location, status, pageable));
    }

    /**
     * Retrieves all possible resource types.
     *
     * @return an array of resource types
     */
    @GetMapping("/types")
    public ResponseEntity<ResourceType[]> getFacilityTypes() {
        return ResponseEntity.ok(ResourceType.values());
    }

    /**
     * Updates an existing facility. Accessible only by ADMIN role.
     *
     * @param id          the ID of the facility to update
     * @param facilityDto the updated facility data
     * @return the updated facility
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDto> updateFacility(@PathVariable Long id,
            @Valid @RequestBody FacilityDto facilityDto) {
        return ResponseEntity.ok(facilityService.updateFacility(id, facilityDto));
    }

    /**
     * Updates only the operational status of an existing facility. Accessible only by ADMIN role.
     *
     * @param id              the ID of the facility
     * @param statusUpdateDto DTO containing the new status
     * @return the updated facility
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDto> updateFacilityStatus(@PathVariable Long id,
            @Valid @RequestBody FacilityStatusUpdateDto statusUpdateDto) {
        return ResponseEntity.ok(facilityService.updateFacilityStatus(id, statusUpdateDto.getStatus()));
    }

    /**
     * Deletes a facility by its ID. Accessible only by ADMIN role.
     *
     * @param id the ID of the facility to delete
     * @return a 204 No Content response
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.noContent().build();
    }
}
