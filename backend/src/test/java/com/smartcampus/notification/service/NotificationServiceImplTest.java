package com.smartcampus.notification.service;

import com.smartcampus.notification.model.Notification;
import com.smartcampus.notification.model.NotificationType;
import com.smartcampus.notification.model.ReferenceType;
import com.smartcampus.notification.repository.NotificationRepository;
import com.smartcampus.notification.sse.NotificationSseService;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock UserRepository userRepository;
    @Mock NotificationRepository notificationRepository;
    @Mock NotificationSseService notificationSseService;

    @InjectMocks NotificationServiceImpl notificationService;

    private User recipient;

    @BeforeEach
    void setUp() {
        recipient = User.builder().id(7L).email("r@x.z").name("R").build();
    }

    @Test
    void createNotification_persistsExpectedFields() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(recipient));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        notificationService.createNotification(
                7L,
                NotificationType.TICKET_STATUS_CHANGED,
                "Title",
                "Body",
                99L,
                ReferenceType.TICKET);

        ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(cap.capture());
        Notification saved = cap.getValue();
        assertThat(saved.getRecipient().getId()).isEqualTo(7L);
        assertThat(saved.getType()).isEqualTo(NotificationType.TICKET_STATUS_CHANGED);
        assertThat(saved.getTitle()).isEqualTo("Title");
        assertThat(saved.getMessage()).isEqualTo("Body");
        assertThat(saved.getReferenceId()).isEqualTo(99L);
        assertThat(saved.getReferenceType()).isEqualTo(ReferenceType.TICKET);
        assertThat(saved.isRead()).isFalse();
    }

    @Test
    void createNotification_throwsWhenRecipientMissing() {
        when(userRepository.findById(7L)).thenReturn(Optional.empty());
        assertThatThrownBy(
                        () ->
                                notificationService.createNotification(
                                        7L,
                                        NotificationType.GENERAL,
                                        "T",
                                        "M",
                                        null,
                                        null))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", org.springframework.http.HttpStatus.NOT_FOUND);
    }

    @Test
    void getNotificationsForUser_delegatesToRepository() {
        Pageable pageable = PageRequest.of(0, 20);
        notificationService.getNotificationsForUser(3L, pageable);
        verify(notificationRepository).findByRecipientIdOrderByCreatedAtDesc(3L, pageable);
    }

    @Test
    void markAsRead_resolvesEntityWhenAlreadyRead() {
        Notification n = new Notification();
        n.setRead(true);
        when(notificationRepository.findByIdAndRecipient_Id(1L, 2L)).thenReturn(Optional.of(n));
        notificationService.markAsRead(1L, 2L);
        verify(notificationRepository).findByIdAndRecipient_Id(1L, 2L);
    }

    @Test
    void delete_throwsWhenNothingRemoved() {
        when(notificationRepository.deleteByIdAndRecipient_Id(1L, 2L)).thenReturn(0L);
        assertThatThrownBy(() -> notificationService.deleteNotification(1L, 2L))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", org.springframework.http.HttpStatus.NOT_FOUND);
    }
}
