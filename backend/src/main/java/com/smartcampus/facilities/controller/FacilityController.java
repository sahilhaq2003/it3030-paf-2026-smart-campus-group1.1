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

@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDto> createFacility(@Valid @RequestBody FacilityDto facilityDto) {
        return new ResponseEntity<>(facilityService.createFacility(facilityDto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacilityDto> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }

    @GetMapping
    public ResponseEntity<Page<FacilityDto>> getAllFacilities(Pageable pageable) {
        return ResponseEntity.ok(facilityService.getAllFacilities(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<FacilityDto>> searchFacilities(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Status status,
            Pageable pageable) {
        return ResponseEntity.ok(facilityService.searchFacilities(type, capacity, location, status, pageable));
    }

    @GetMapping("/types")
    public ResponseEntity<ResourceType[]> getFacilityTypes() {
        return ResponseEntity.ok(ResourceType.values());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDto> updateFacility(@PathVariable Long id,
            @Valid @RequestBody FacilityDto facilityDto) {
        return ResponseEntity.ok(facilityService.updateFacility(id, facilityDto));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacilityDto> updateFacilityStatus(@PathVariable Long id,
            @Valid @RequestBody FacilityStatusUpdateDto statusUpdateDto) {
        return ResponseEntity.ok(facilityService.updateFacilityStatus(id, statusUpdateDto.getStatus()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.noContent().build();
    }
}
