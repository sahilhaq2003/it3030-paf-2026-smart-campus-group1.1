package com.smartcampus.facilities.service;

import com.smartcampus.facilities.dto.FacilityDto;
import com.smartcampus.facilities.exception.FacilityNotFoundException;
import com.smartcampus.facilities.model.Facility;
import com.smartcampus.facilities.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartcampus.facilities.model.ResourceType;
import com.smartcampus.facilities.model.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import com.smartcampus.facilities.exception.ActiveBookingsExistException;

@Service
@RequiredArgsConstructor
public class FacilityServiceImpl implements FacilityService {

    private final FacilityRepository facilityRepository;

    @Override
    @Transactional
    public FacilityDto createFacility(FacilityDto facilityDto) {
        // Prevent empty locations
        if (!StringUtils.hasText(facilityDto.getLocation())) {
            throw new IllegalArgumentException("Physical location cannot be empty.");
        }

        // Enforce Physical Location String Uniqueness
        if (facilityDto.getLocation() != null
                && facilityRepository.existsByLocationIgnoreCase(facilityDto.getLocation().trim())) {
            throw new IllegalArgumentException(
                    "A facility with this exact physical location already exists in the registry.");
        }

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
    public Page<FacilityDto> getAllFacilities(Pageable pageable) {
        return facilityRepository.findAll(pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional
    public FacilityDto updateFacility(Long id, FacilityDto facilityDto) {
        // Prevent empty locations
        if (!StringUtils.hasText(facilityDto.getLocation())) {
            throw new IllegalArgumentException("Physical location cannot be empty.");
        }

        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new FacilityNotFoundException("Facility not found with id: " + id));

        // Ensure update operation doesn't conflict with another facility's exact
        // location
        if (facilityDto.getLocation() != null &&
                (facility.getLocation() == null
                        || !facilityDto.getLocation().trim().equalsIgnoreCase(facility.getLocation().trim()))) {
            if (facilityRepository.existsByLocationIgnoreCase(facilityDto.getLocation().trim())) {
                throw new IllegalArgumentException(
                        "A facility with this exact physical location already exists in the registry.");
            }
        }

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

        if (hasActiveBookings(id)) {
            throw new ActiveBookingsExistException("Cannot delete facility because active bookings exist.");
        }

        facilityRepository.delete(facility);
    }

    @Override
    @Transactional
    public FacilityDto updateFacilityStatus(Long id, Status status) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new FacilityNotFoundException("Facility not found with id: " + id));
        facility.setStatus(status);
        Facility updatedFacility = facilityRepository.save(facility);
        return mapToDto(updatedFacility);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FacilityDto> searchFacilities(String name, ResourceType type, Integer capacity, String location,
            Status status,
            Pageable pageable) {
        Specification<Facility> spec = Specification.where(null);

        if (StringUtils.hasText(name)) {
            String normalizedName = name.trim().replaceAll("\\s+", " ").toLowerCase();
            for (String term : normalizedName.split(" ")) {
                spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + term + "%"));
            }
        }

        if (type != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("resourceType"), type));
        }
        if (capacity != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("capacity"), capacity));
        }
        if (StringUtils.hasText(location)) {
            spec = spec.and(
                    (root, query, cb) -> cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%"));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        return facilityRepository.findAll(spec, pageable).map(this::mapToDto);
    }

    private boolean hasActiveBookings(Long id) {
        // TODO: Integrate actual Booking module dependency when available
        // Return false statically allowing deletions for now
        return false;
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
