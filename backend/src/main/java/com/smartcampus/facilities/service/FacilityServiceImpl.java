package com.smartcampus.facilities.service;

import com.smartcampus.facilities.dto.FacilityDto;
import com.smartcampus.facilities.exception.FacilityNotFoundException;
import com.smartcampus.facilities.model.Facility;
import com.smartcampus.facilities.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacilityServiceImpl implements FacilityService {

    private final FacilityRepository facilityRepository;

    @Override
    @Transactional
    public FacilityDto createFacility(FacilityDto facilityDto) {
        Facility facility = mapToEntity(facilityDto);
        Facility savedFacility = facilityRepository.save(facility);
        return mapToDto(savedFacility);
    }

    @Override
    @Transactional(readOnly = true)
    public FacilityDto getFacilityById(Long id) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new FacilityNotFoundException("Facility not found with id: " + id));
        return mapToDto(facility);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacilityDto> getAllFacilities() {
        return facilityRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FacilityDto updateFacility(Long id, FacilityDto facilityDto) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new FacilityNotFoundException("Facility not found with id: " + id));

        facility.setName(facilityDto.getName());
        facility.setResourceType(facilityDto.getResourceType());
        facility.setCapacity(facilityDto.getCapacity());
        facility.setLocation(facilityDto.getLocation());
        facility.setDescription(facilityDto.getDescription());
        facility.setAvailabilityStart(facilityDto.getAvailabilityStart());
        facility.setAvailabilityEnd(facilityDto.getAvailabilityEnd());
        facility.setStatus(facilityDto.getStatus());

        Facility updatedFacility = facilityRepository.save(facility);
        return mapToDto(updatedFacility);
    }

    @Override
    @Transactional
    public void deleteFacility(Long id) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new FacilityNotFoundException("Facility not found with id: " + id));
        facilityRepository.delete(facility);
    }

    private Facility mapToEntity(FacilityDto dto) {
        return Facility.builder()
                .name(dto.getName())
                .resourceType(dto.getResourceType())
                .capacity(dto.getCapacity())
                .location(dto.getLocation())
                .description(dto.getDescription())
                .availabilityStart(dto.getAvailabilityStart())
                .availabilityEnd(dto.getAvailabilityEnd())
                .status(dto.getStatus())
                .build();
    }

    private FacilityDto mapToDto(Facility facility) {
        FacilityDto dto = new FacilityDto();
        dto.setId(facility.getId());
        dto.setName(facility.getName());
        dto.setResourceType(facility.getResourceType());
        dto.setCapacity(facility.getCapacity());
        dto.setLocation(facility.getLocation());
        dto.setDescription(facility.getDescription());
        dto.setAvailabilityStart(facility.getAvailabilityStart());
        dto.setAvailabilityEnd(facility.getAvailabilityEnd());
        dto.setStatus(facility.getStatus());
        dto.setCreatedAt(facility.getCreatedAt());
        dto.setUpdatedAt(facility.getUpdatedAt());
        return dto;
    }
}
