package com.smartcampus.maintenance.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attachments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    private String originalName;
    private String storedName;   // UUID filename
    private String mimeType;
    private Long size;           // in bytes
}