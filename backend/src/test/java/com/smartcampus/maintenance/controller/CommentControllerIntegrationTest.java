package com.smartcampus.maintenance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.auth.model.UserPrincipal;
import com.smartcampus.maintenance.dto.CommentDTO;
import com.smartcampus.maintenance.model.Comment;
import com.smartcampus.maintenance.model.Ticket;
import com.smartcampus.maintenance.model.enums.Priority;
import com.smartcampus.maintenance.model.enums.TicketCategory;
import com.smartcampus.maintenance.model.enums.TicketStatus;
import com.smartcampus.maintenance.repository.CommentRepository;
import com.smartcampus.maintenance.repository.TicketRepository;
import com.smartcampus.user.model.User;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CommentControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    private User author;
    private User otherUser;
    private User adminUser;
    private Ticket ticket;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        // Clean up
        jdbcTemplate.execute("DELETE FROM notifications");
        commentRepository.deleteAll();
        ticketRepository.deleteAll();
        userRepository.deleteAll();

        // Create test users
        author = User.builder()
                .email("author@test.com")
                .name("Comment Author")
                .roles(Set.of(Role.USER))
                .build();
        author = userRepository.save(author);

        otherUser = User.builder()
                .email("other@test.com")
                .name("Other User")
                .roles(Set.of(Role.USER))
                .build();
        otherUser = userRepository.save(otherUser);

        adminUser = User.builder()
                .email("admin@test.com")
                .name("Admin User")
                .roles(Set.of(Role.ADMIN))
                .build();
        adminUser = userRepository.save(adminUser);

        // Create test ticket
        ticket = Ticket.builder()
                .title("Test Ticket")
                .description("Test Description")
                .category(TicketCategory.EQUIPMENT)
                .priority(Priority.HIGH)
                .location("Lab 1")
                .status(TicketStatus.OPEN)
                .reportedBy(author)
                .build();
        ticket = ticketRepository.save(ticket);
    }

    private void authenticateAs(User user, String... roleNames) {
        var authorities = java.util.Arrays.stream(roleNames)
                .map(r -> new SimpleGrantedAuthority(r.startsWith("ROLE_") ? r : "ROLE_" + r))
                .collect(java.util.stream.Collectors.toList());

        UserPrincipal principal = new UserPrincipal(
                user.getId(),
                user.getEmail(),
                "",
                authorities);

        var auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                authorities);

        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void shouldAddCommentToTicket() throws Exception {
        authenticateAs(author, "ROLE_USER");
        // Arrange
        CommentDTO commentDTO = new CommentDTO();
        commentDTO.setContent("This is a helpful comment");

        // Act & Assert
        mockMvc.perform(post("/api/tickets/" + ticket.getId() + "/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(commentDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.content").value("This is a helpful comment"))
                .andExpect(jsonPath("$.edited").value(false));
    }

    @Test
    void shouldListCommentsForTicket() throws Exception {
        authenticateAs(author, "ROLE_USER");
        // Arrange - Create comments
        Comment comment1 = Comment.builder()
                .ticket(ticket)
                .author(author)
                .content("First comment")
                .isEdited(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        commentRepository.save(comment1);

        Comment comment2 = Comment.builder()
                .ticket(ticket)
                .author(otherUser)
                .content("Second comment")
                .isEdited(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        commentRepository.save(comment2);

        // Act & Assert
        mockMvc.perform(get("/api/tickets/" + ticket.getId() + "/comments")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].content").value("First comment"))
                .andExpect(jsonPath("$[1].content").value("Second comment"));
    }

    @Test
    void shouldAllowAuthorToEditOwnComment() throws Exception {
        authenticateAs(author, "ROLE_USER");
        // Arrange - Create comment
        Comment comment = Comment.builder()
                .ticket(ticket)
                .author(author)
                .content("Original content")
                .isEdited(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        comment = commentRepository.save(comment);

        CommentDTO updateDTO = new CommentDTO();
        updateDTO.setContent("Updated content");

        // Act & Assert
        mockMvc.perform(put("/api/tickets/" + ticket.getId() + "/comments/" + comment.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Updated content"))
                .andExpect(jsonPath("$.edited").value(true));

        // Verify in database
        Optional<Comment> updated = commentRepository.findById(comment.getId());
        assertThat(updated).isPresent();
        assertThat(updated.get().getContent()).isEqualTo("Updated content");
        assertThat(updated.get().isEdited()).isTrue();
    }

    @Test
    void shouldRejectNonAuthorEditingComment() throws Exception {
        authenticateAs(otherUser, "ROLE_USER");
        // Arrange - Author creates comment
        Comment comment = Comment.builder()
                .ticket(ticket)
                .author(author)
                .content("Author's comment")
                .isEdited(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        comment = commentRepository.save(comment);

        CommentDTO updateDTO = new CommentDTO();
        updateDTO.setContent("Hacked content");

        // Act & Assert - Other user tries to edit
        mockMvc.perform(put("/api/tickets/" + ticket.getId() + "/comments/" + comment.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("You can only edit your own comments")));

        // Verify content unchanged
        Optional<Comment> unchanged = commentRepository.findById(comment.getId());
        assertThat(unchanged.get().getContent()).isEqualTo("Author's comment");
    }

    @Test
    void shouldAllowAuthorToDeleteOwnComment() throws Exception {
        authenticateAs(author, "ROLE_USER");
        // Arrange
        Comment comment = Comment.builder()
                .ticket(ticket)
                .author(author)
                .content("Deletable comment")
                .isEdited(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        comment = commentRepository.save(comment);

        // Act & Assert
        mockMvc.perform(delete("/api/tickets/" + ticket.getId() + "/comments/" + comment.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        // Verify deletion
        Optional<Comment> deleted = commentRepository.findById(comment.getId());
        assertThat(deleted).isEmpty();
    }

    @Test
    void shouldRejectNonAuthorDeletingComment() throws Exception {
        authenticateAs(otherUser, "ROLE_USER");
        // Arrange - Author creates comment
        Comment comment = Comment.builder()
                .ticket(ticket)
                .author(author)
                .content("Protected comment")
                .isEdited(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        comment = commentRepository.save(comment);

        // Act & Assert - Other user tries to delete (should be 403)
        mockMvc.perform(delete("/api/tickets/" + ticket.getId() + "/comments/" + comment.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-User-ID", otherUser.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("You can only delete your own comments")));

        // Verify comment still exists
        Optional<Comment> stillExists = commentRepository.findById(comment.getId());
        assertThat(stillExists).isPresent();
    }

    @Test
    void shouldAllowAdminToDeleteAnyComment() throws Exception {
        authenticateAs(adminUser, "ROLE_ADMIN");
        // Arrange
        Comment comment = Comment.builder()
                .ticket(ticket)
                .author(author)
                .content("Admin deletable")
                .isEdited(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        comment = commentRepository.save(comment);

        // Act & Assert - Admin deletes (with admin header)
        mockMvc.perform(delete("/api/tickets/" + ticket.getId() + "/comments/" + comment.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-User-Role", "ADMIN"))
                .andExpect(status().isNoContent());

        // Verify deletion
        Optional<Comment> deleted = commentRepository.findById(comment.getId());
        assertThat(deleted).isEmpty();
    }

    @Test
    void shouldRejectEmptyCommentContent() throws Exception {
        authenticateAs(author, "ROLE_USER");
        // Arrange
        CommentDTO emptyComment = new CommentDTO();
        emptyComment.setContent("");

        // Act & Assert
        mockMvc.perform(post("/api/tickets/" + ticket.getId() + "/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emptyComment)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.content", containsString("empty")));
    }

    @Test
    void shouldRejectCommentExceeding1000Characters() throws Exception {
        // Arrange
        authenticateAs(author, "ROLE_USER");
        CommentDTO longComment = new CommentDTO();
        longComment.setContent("a".repeat(1001)); // Exceeds limit

        // Act & Assert
        mockMvc.perform(post("/api/tickets/" + ticket.getId() + "/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(longComment)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.content", containsString("exceeds")));
    }

    @Test
    void shouldMarkCommentAsEditedAfterUpdate() throws Exception {
        // Arrange
        authenticateAs(author, "ROLE_USER");
        Comment comment = Comment.builder()
                .ticket(ticket)
                .author(author)
                .content("Original")
                .isEdited(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        comment = commentRepository.save(comment);

        assertThat(comment.isEdited()).isFalse();

        CommentDTO updateDTO = new CommentDTO();
        updateDTO.setContent("Updated");

        // Act
        mockMvc.perform(put("/api/tickets/" + ticket.getId() + "/comments/" + comment.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.edited").value(true));
    }

    @Test
    void shouldPreserveCommentAuthorAfterEdit() throws Exception {
        // Arrange
        authenticateAs(author, "ROLE_USER");
        Comment comment = Comment.builder()
                .ticket(ticket)
                .author(author)
                .content("Original")
                .isEdited(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        comment = commentRepository.save(comment);

        CommentDTO updateDTO = new CommentDTO();
        updateDTO.setContent("Updated");

        // Act
        mockMvc.perform(put("/api/tickets/" + ticket.getId() + "/comments/" + comment.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorId").value(author.getId().intValue()));
    }

    @Test
    void shouldReturn404ForNonExistentComment() throws Exception {
        // Arrange
        authenticateAs(author, "ROLE_USER");

        CommentDTO dto = new CommentDTO();
        dto.setContent("Valid");
        
        // Act & Assert
        mockMvc.perform(put("/api/tickets/" + ticket.getId() + "/comments/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn404ForNonExistentTicket() throws Exception {
        // Arrange
        authenticateAs(author, "ROLE_USER");

        CommentDTO dto = new CommentDTO();
        dto.setContent("Valid");
        
        // Act & Assert
        mockMvc.perform(post("/api/tickets/999/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }
}
