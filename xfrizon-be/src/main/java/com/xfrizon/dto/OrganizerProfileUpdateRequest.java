package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizerProfileUpdateRequest {

    private String name;

    private String email;

    private String phone;

    private String location;

    private String address;

    private String description;

    private String logo;

    private String coverPhoto;
}
