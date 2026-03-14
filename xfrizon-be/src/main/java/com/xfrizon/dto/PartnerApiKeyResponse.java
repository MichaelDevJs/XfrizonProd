package com.xfrizon.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PartnerApiKeyResponse {
    private Long partnerId;
    private String partnerName;
    /** Only returned when key is created/rotated. */
    private String apiKey;
    private String apiKeyPrefix;
}
