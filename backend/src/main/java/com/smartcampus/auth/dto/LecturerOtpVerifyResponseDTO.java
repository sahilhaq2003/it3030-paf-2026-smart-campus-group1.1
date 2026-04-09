package com.smartcampus.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LecturerOtpVerifyResponseDTO {
    private String verificationToken;
}
