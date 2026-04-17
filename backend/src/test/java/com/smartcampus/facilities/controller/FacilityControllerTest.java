package com.smartcampus.facilities.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.facilities.dto.FacilityDto;
import com.smartcampus.facilities.model.ResourceType;
import com.smartcampus.facilities.model.Status;
import com.smartcampus.facilities.service.FacilityService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = com.smartcampus.maintenance.MaintenanceApplication.class)
@AutoConfigureMockMvc
public class FacilityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FacilityService facilityService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void getAllFacilities_ShouldReturn200() throws Exception {
        FacilityDto facility = new FacilityDto();
        facility.setId(1L);
        facility.setName("General Physics Lab");
        facility.setLocation("Campus Build X");
        
        Page<FacilityDto> page = new PageImpl<>(List.of(facility));

        when(facilityService.getAllFacilities(any())).thenReturn(page);

        // SecurityConfig allows public access to GET /api/facilities organically
        mockMvc.perform(get("/api/facilities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("General Physics Lab"))
                .andExpect(jsonPath("$.content[0].location").value("Campus Build X"));
    }

    @Test
    public void getFacilityById_ShouldReturn200() throws Exception {
        FacilityDto facility = new FacilityDto();
        facility.setId(1L);
        facility.setName("General Physics Lab");

        when(facilityService.getFacilityById(1L)).thenReturn(facility);

        mockMvc.perform(get("/api/facilities/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("General Physics Lab"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void createFacility_WithAdminRole_ShouldReturn201() throws Exception {
        FacilityDto request = new FacilityDto();
        request.setName("Computer Science Nexus");
        request.setResourceType(ResourceType.LAB);
        request.setCapacity(40);
        request.setLocation("Building C Level 2");
        request.setStatus(Status.ACTIVE);

        FacilityDto response = new FacilityDto();
        response.setId(2L);
        response.setName("Computer Science Nexus");

        when(facilityService.createFacility(any(FacilityDto.class))).thenReturn(response);

        mockMvc.perform(post("/api/facilities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2L))
                .andExpect(jsonPath("$.name").value("Computer Science Nexus"));
    }

    @Test
    @WithMockUser(roles = "USER")
    public void createFacility_WithUserRole_ShouldHitSecurityWall_Returns403() throws Exception {
        FacilityDto request = new FacilityDto();
        request.setName("Hacker Room");
        request.setResourceType(ResourceType.LAB);
        request.setCapacity(20);
        request.setStatus(Status.ACTIVE);

        mockMvc.perform(post("/api/facilities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void updateFacility_AsAdmin_ShouldReturn200() throws Exception {
        FacilityDto request = new FacilityDto();
        request.setName("Modified Library Space");
        request.setLocation("Sector 4");
        request.setResourceType(ResourceType.LAB);
        request.setCapacity(20);
        request.setStatus(Status.ACTIVE);

        FacilityDto response = new FacilityDto();
        response.setId(10L);
        response.setName("Modified Library Space");

        when(facilityService.updateFacility(eq(10L), any(FacilityDto.class))).thenReturn(response);

        mockMvc.perform(put("/api/facilities/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Modified Library Space"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void deleteFacility_AsAdmin_ShouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/facilities/500"))
                .andExpect(status().isNoContent());
    }
}
