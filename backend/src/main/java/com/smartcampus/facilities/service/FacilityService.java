package com.smartcampus.facilities.service;

import com.smartcampus.facilities.dto.FacilityDto;
import com.smartcampus.facilities.model.ResourceType;
import com.smartcampus.facilities.model.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FacilityService {
    FacilityDto createFacility(FacilityDto facilityDto);
    FacilityDto getFacilityById(Long id);
    Page<FacilityDto> getAllFacilities(Pageable pageable);
    FacilityDto updateFacility(Long id, FacilityDto facilityDto);
    FacilityDto updateFacilityStatus(Long id, Status status);
    void deleteFacility(Long id);
    Page<FacilityDto> searchFacilities(String name, ResourceType type, Integer capacity, String location, Status status, Pageable pageable);
}
