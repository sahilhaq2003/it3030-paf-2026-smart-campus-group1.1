package com.smartcampus.facilities.service;

import com.smartcampus.facilities.dto.FacilityDto;
import java.util.List;

public interface FacilityService {
    FacilityDto createFacility(FacilityDto facilityDto);
    FacilityDto getFacilityById(Long id);
    List<FacilityDto> getAllFacilities();
    FacilityDto updateFacility(Long id, FacilityDto facilityDto);
    void deleteFacility(Long id);
}
