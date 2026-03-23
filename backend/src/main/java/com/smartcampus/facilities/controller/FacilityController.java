package com.smartcampus.facilities.controller;

import com.smartcampus.facilities.dto.FacilityDto;
import com.smartcampus.facilities.service.FacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    @PostMapping
    public ResponseEntity<FacilityDto> createFacility(@Valid @RequestBody FacilityDto facilityDto) {
        return new ResponseEntity<>(facilityService.createFacility(facilityDto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacilityDto> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getFacilityById(id));
    }

    @GetMapping
    public ResponseEntity<List<FacilityDto>> getAllFacilities() {
        return ResponseEntity.ok(facilityService.getAllFacilities());
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacilityDto> updateFacility(@PathVariable Long id, @Valid @RequestBody FacilityDto facilityDto) {
        return ResponseEntity.ok(facilityService.updateFacility(id, facilityDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.noContent().build();
    }
}
