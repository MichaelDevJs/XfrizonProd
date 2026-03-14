package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "partners")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Partner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "contact_email", length = 180)
    private String contactEmail;

    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PartnerCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PartnerType type;

    /** Website URL for ONLINE / BOTH type partners */
    @Column(length = 500)
    private String website;

    /** Physical address for IN_PERSON / BOTH type partners */
    @Column(length = 300)
    private String location;

    @Column(length = 350)
    private String address;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /** SHA-256 hash of partner scanner API key */
    @Column(name = "api_key_hash", length = 64)
    private String apiKeyHash;

    /** Safe preview for admins, e.g. XF_PARTNER_ABC123 */
    @Column(name = "api_key_prefix", length = 30)
    private String apiKeyPrefix;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "partner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PartnerOffer> offers;

    @PrePersist
    public void setCreatedAt() {
        this.createdAt = LocalDateTime.now();
    }

    public enum PartnerCategory {
        FOOD, HAIR_SALON, FASHION, BEAUTY, FITNESS, ENTERTAINMENT, OTHER
    }

    public enum PartnerType {
        ONLINE, IN_PERSON, BOTH
    }
}
