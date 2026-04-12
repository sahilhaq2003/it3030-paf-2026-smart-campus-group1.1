package com.smartcampus.facilities.service;

import com.smartcampus.facilities.dto.FacilityDto;
import com.smartcampus.facilities.exception.FacilityNotFoundException;
import com.smartcampus.facilities.model.Facility;
import com.smartcampus.facilities.model.ResourceType;
import com.smartcampus.facilities.model.Status;
import com.smartcampus.facilities.repository.FacilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FacilityServiceImplTest {

    @Mock
    private FacilityRepository facilityRepository;

    @InjectMocks
    private FacilityServiceImpl facilityService;

    private Facility facility;
    private FacilityDto facilityDto;

    @BeforeEach
    void setUp() {
        facility = Facility.builder()
                .id(1L)
                .name("Main Hall")
                .resourceType(ResourceType.LECTURE_HALL)
                .capacity(100)
                .location("Building A")
                .status(Status.ACTIVE)
                .build();

        facilityDto = new FacilityDto();
        facilityDto.setId(1L);
        facilityDto.setName("Main Hall");
        facilityDto.setResourceType(ResourceType.LECTURE_HALL);
        facilityDto.setCapacity(100);
        facilityDto.setLocation("Building A");
        facilityDto.setStatus(Status.ACTIVE);
    }

    @Test
    void createFacility_Success() {
        when(facilityRepository.existsByLocationIgnoreCase(anyString())).thenReturn(false);
        when(facilityRepository.save(any(Facility.class))).thenReturn(facility);

        FacilityDto result = facilityService.createFacility(facilityDto);

        assertNotNull(result);
        assertEquals("Main Hall", result.getName());
        verify(facilityRepository, times(1)).save(any(Facility.class));
    }

    @Test
    void createFacility_DuplicateLocation_ThrowsException() {
        when(facilityRepository.existsByLocationIgnoreCase("Building A")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> facilityService.createFacility(facilityDto));

        assertEquals("A facility with this exact physical location already exists in the registry.",
                exception.getMessage());
        verify(facilityRepository, never()).save(any(Facility.class));
    }

    @Test
    void createFacility_EmptyLocation_ThrowsException() {
        facilityDto.setLocation("   "); // Blank location should trigger the first validation block

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> facilityService.createFacility(facilityDto));

        assertEquals("Physical location cannot be empty.", exception.getMessage());
    }

    @Test
    void getFacilityById_Success() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));

        FacilityDto result = facilityService.getFacilityById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getFacilityById_NotFound_ThrowsException() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(FacilityNotFoundException.class, () -> facilityService.getFacilityById(1L));
    }

    @Test
    void updateFacility_Success() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        facilityDto.setCapacity(150); // Set an updated capacity dynamically

        when(facilityRepository.save(any(Facility.class))).thenReturn(facility);

        FacilityDto result = facilityService.updateFacility(1L, facilityDto);

        assertNotNull(result);
        verify(facilityRepository).save(facility);
    }

    @Test
    void searchFacilities_WithNameAndLocation_Success() {
        Page<Facility> page = new PageImpl<>(List.of(facility));
        when(facilityRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        Page<FacilityDto> result = facilityService.searchFacilities(
                "Main Hall", ResourceType.LECTURE_HALL, null, "Building A", Status.ACTIVE, PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Main Hall", result.getContent().get(0).getName());
    }

    @Test
    void deleteFacility_Success() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        doNothing().when(facilityRepository).delete(facility);

        assertDoesNotThrow(() -> facilityService.deleteFacility(1L));
        verify(facilityRepository, times(1)).delete(facility);
    }
}
