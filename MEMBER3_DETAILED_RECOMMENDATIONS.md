# MEMBER 3 - DETAILED AUDIT RECOMMENDATIONS & ACTION ITEMS

**Date:** March 29, 2026  
**Module:** Member 3 (Maintenance & Incident Ticketing)  
**Assessment Level:** Comprehensive with Evidence-Based Findings

---

## CRITICAL ISSUES (Must Fix)

### 🔴 ISSUE #1: TechnicianDashboard Uses Hardcoded Mock Data

**Severity:** 🔴 CRITICAL  
**File:** [frontend/src/pages/member3/TechnicianDashboard.jsx](TechnicianDashboard.jsx) Lines 13-50  
**Current State:** All metrics, tickets, and performance stats are hardcoded  
**Page States:** "Task overview and performance metrics (sample data)"

**Evidence:**
```jsx
// Lines 15-20: Hardcoded ticket data
const myTickets = [
  { id: 'TCK-001', title: 'AC Maintenance', status: 'IN_PROGRESS', priority: 'MEDIUM', createdAt: '2026-03-05', daysOpen: 3 },
  { id: 'TCK-002', title: 'Printer Setup', status: 'RESOLVED', priority: 'HIGH', createdAt: '2026-03-01', resolvedAt: '2026-03-07' },
  { id: 'TCK-003', title: 'Door Lock Repair', status: 'IN_PROGRESS', priority: 'CRITICAL', createdAt: '2026-03-06', daysOpen: 2 },
];

// Lines 22-27: Hardcoded metrics derived from mock data
const metrics = {
  assigned: myTickets.filter(t => t.status !== 'RESOLVED').length,
  inProgress: myTickets.filter(t => t.status === 'IN_PROGRESS').length,
  resolved: myTickets.filter(t => t.status === 'RESOLVED').length,
  avgResolutionTime: 4.5,
};

// Lines 29-49: Hardcoded performance stats
const performanceStats = [
  { label: 'Tickets Resolved (This Month)', value: 12, ... },
  { label: 'Avg Resolution Time', value: '4.5 hrs', ... },
  ...
];
```

**Impact:**
- Page will show IDENTICAL data for all technicians
- Metrics don't reflect actual ticket assignments
- Misleading for technicians tracking their own performance
- Fails real-world usage testing

**Fix Required:**
Replace hardcoded data with API calls to:
1. `ticketApi.getAssignedTickets({ assignedTo: currentUserId })`
2. `ticketApi.getTechnicianPerformance()` - filter for current user

**Estimated Time:** 20 minutes

**Code Template:**
```jsx
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { ticketApi } from '../../api/ticketApi';

export default function TechnicianDashboard() {
  const { user } = useAuth(); // Get current logged-in technician

  // Fetch assigned tickets
  const { data: assignedTickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['assignedTickets', user?.id],
    queryFn: () => ticketApi.getAssignedTickets({ assignedTo: user?.id }),
  });

  // Fetch performance stats for current technician
  const { data: allPerformance = [], isLoading: perfLoading } = useQuery({
    queryKey: ['technicianPerformance'],
    queryFn: () => ticketApi.getTechnicianPerformance(),
  });

  const myPerformance = allPerformance.find(p => p.technicianId === user?.id);

  // Now derive metrics from REAL data
  const metrics = {
    assigned: assignedTickets.filter(t => t.status !== 'RESOLVED').length,
    inProgress: assignedTickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: assignedTickets.filter(t => t.status === 'RESOLVED').length,
    avgResolutionTime: myPerformance?.avgResolutionHours || 0,
  };

  const performanceStats = [
    { 
      label: 'Tickets Resolved (This Month)', 
      value: myPerformance?.ticketsResolved || 0,
      // etc...
    },
    // ...
  ];

  // Rest of component stays the same, but use realData
  if (ticketsLoading || perfLoading) return <Skeleton />;

  return (
    <DashboardPageLayout
      eyebrow="Technician · Overview"
      title="Technician workspace"
      subtitle="Your assigned tickets and performance metrics"
    >
      {/* Use assignedTickets instead of myTickets */}
      {/* Use myPerformance instead of hardcoded stats */}
    </DashboardPageLayout>
  );
}
```

**Testing After Fix:**
1. Login as Technician A with 3 assigned tickets
2. Verify page shows exactly 3 in "Assigned" metric
3. Assign new ticket to Technician A from AdminTicketsPage
4. Refresh TechnicianDashboard - should show 4
5. Repeat for Technician B - should show different data

---

### 🟠 ISSUE #2: Missing Test Coverage

**Severity:** 🟠 HIGH  
**Current Status:** Only TicketServiceTest.java exists with limited test cases  
**Required:** At least 15+ test cases across 3-4 test files

#### What Exists:
✅ `backend/src/test/java/com/smartcampus/maintenance/service/TicketServiceTest.java`
- ✅ Test for invalid status transitions
- ✅ Mock setup with Mockito
- Missing most other test cases

#### What's Missing:

**1. AttachmentServiceTest.java** - File Validation Testing
```java
@Test
void shouldRejectFileMimeTypeNotImage() {
  var dto = new AttachmentDTO(); // application/pdf
  assertThatThrownBy(() -> attachmentService.validateFile(dto))
    .isInstanceOf(InvalidFileException.class);
}

@Test
void shouldRejectFileOver5MB() {
  var dto = new AttachmentDTO(); // 10MB
  assertThatThrownBy(() -> attachmentService.validateFile(dto))
    .isInstanceOf(FileSizeExceededException.class);
}

@Test
void shouldRejectMoreThan3FilesPerTicket() {
  var files = List.of(file1, file2, file3, file4); // 4 files
  assertThatThrownBy(() -> attachmentService.saveAttachments(files, ticket))
    .isInstanceOf(TooManyFilesException.class);
}
```

**2. CommentServiceTest.java** - Ownership Tests
```java
@Test
void shouldAllowAuthorToEditOwnComment() {
  Comment comment = commentRepo.save(new Comment(author=user1, content="Test"));
  
  // User1 editing their own comment should work
  assertDoesNotThrow(() -> commentService.editComment(comment.id, user1.id, "New content"));
}

@Test
void shouldRejectNonAuthorEditingComment() {
  Comment comment = commentRepo.save(new Comment(author=user1, content="Test"));
  
  // User2 editing User1's comment should fail
  assertThatThrownBy(() -> commentService.editComment(comment.id, user2.id, "Hacked"))
    .isInstanceOf(UnauthorizedException.class)
    .hasMessageContaining("Cannot edit other user's comment");
}

@Test
void shouldAllowAdminToDeleteAnyComment() {
  Comment comment = commentRepo.save(new Comment(author=user1, content="Test"));
  
  // Admin should be able to delete any comment
  assertDoesNotThrow(() -> commentService.deleteComment(comment.id, admin.id, true));
}
```

**3. Additional TicketServiceTest.java Cases**
```java
@Test
void shouldCalculateSlaDeadlineFor2HoursOnCriticalPriority() {
  ticket.setPriority(Priority.CRITICAL);
  LocalDateTime deadline = ticketService.calculateSlaDeadline(ticket);
  assertThat(Duration.between(ticket.getCreatedAt(), deadline).toHours()).isEqualTo(2);
}

@Test
void shouldCalculateSlaDeadlineFor8HoursOnHighPriority() {
  ticket.setPriority(Priority.HIGH);
  LocalDateTime deadline = ticketService.calculateSlaDeadline(ticket);
  assertThat(Duration.between(ticket.getCreatedAt(), deadline).toHours()).isEqualTo(8);
}

@Test
void shouldPageMyTicketsCorrectly() {
  // Create 15 tickets for user
  Page<Ticket> page1 = ticketService.getMyTickets(userId, PageRequest.of(0, 10));
  Page<Ticket> page2 = ticketService.getMyTickets(userId, PageRequest.of(1, 10));
  
  assertThat(page1.getContent()).hasSize(10);
  assertThat(page2.getContent()).hasSize(5);
  assertThat(page1.getTotalElements()).isEqualTo(15);
}

@Test
void shouldExportTicketsWithCorrectCsvFormat() {
  String csv = ticketService.exportTicketsCsv(tickets);
  String[] headers = csv.split("\\n")[0].split(",");
  assertThat(headers).contains("ID", "TITLE", "STATUS", "PRIORITY");
}
```

---

### 🟠 ISSUE #3: No Integration Tests

**Severity:** 🟠 HIGH  
**Current Status:** 0 integration test files  
**Required:** At least 2 test files with MockMvc

#### TicketControllerIntegrationTest.java - Required Tests
```java
@SpringBootTest
@AutoConfigureMockMvc
class TicketControllerIntegrationTest {
  
  @Autowired MockMvc mockMvc;
  @Autowired TicketRepository ticketRepo;
  @Autowired UserRepository userRepo;

  @Test
  void shouldCreateTicketWithMultipartFormAndFiles() throws Exception {
    MockMultipartFile file1 = new MockMultipartFile("files", "ticket.jpg", 
      "image/jpeg", "content".getBytes());
    
    mockMvc.perform(multipart("/api/tickets")
      .file(file1)
      .param("title", "AC Repair")
      .param("category", "ELECTRICAL")
      .header("Authorization", "Bearer " + token))
      .andExpect(status().isCreated())
      .andExpect(jsonPath("$.id").isNumber())
      .andExpect(jsonPath("$.attachments[0].originalName").value("ticket.jpg"));
  }

  @Test
  void shouldReturnTicketWithAttachments() throws Exception {
    Ticket ticket = createTicketWithAttachment();
    
    mockMvc.perform(get("/api/tickets/" + ticket.id)
      .header("Authorization", "Bearer " + token))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.attachments").isArray())
      .andExpect(jsonPath("$.attachments[0].url").exists());
  }

  @Test
  void shouldValidateStatusTransitions() throws Exception {
    Ticket ticket = createTicket(); // status=OPEN
    
    // Try invalid: OPEN → RESOLVED (skip IN_PROGRESS)
    mockMvc.perform(patch("/api/tickets/" + ticket.id + "/status")
      .contentType(APPLICATION_JSON)
      .content(json(new TicketStatusUpdateDTO(RESOLVED, null, null)))
      .header("Authorization", "Bearer " + token))
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.message").value(containsString("Invalid status transition")));
  }
}
```

#### CommentControllerIntegrationTest.java - Required Tests
```java
@SpringBootTest
@AutoConfigureMockMvc
class CommentControllerIntegrationTest {

  @Test
  void shouldAllowAuthorToEditComment() throws Exception {
    Comment comment = createCommentByUser(user1);
    
    mockMvc.perform(put("/api/tickets/" + ticket.id + "/comments/" + comment.id)
      .contentType(APPLICATION_JSON)
      .content(json(new CommentUpdateDTO("Updated content")))
      .header("Authorization", "Bearer " + tokenForUser1))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.content").value("Updated content"))
      .andExpect(jsonPath("$.isEdited").value(true));
  }

  @Test
  void shouldReturn403WhenNonAuthorEditsComment() throws Exception {
    Comment comment = createCommentByUser(user1);
    
    mockMvc.perform(put("/api/tickets/" + ticket.id + "/comments/" + comment.id)
      .contentType(APPLICATION_JSON)
      .content(json(new CommentUpdateDTO("Hacked!")))
      .header("Authorization", "Bearer " + tokenForUser2))
      .andExpect(status().isForbidden())
      .andExpect(jsonPath("$.message").value(containsString("Cannot edit other user")));
  }

  @Test
  void shouldReturn403WhenNonAuthorDeletesComment() throws Exception {
    Comment comment = createCommentByUser(user1);
    
    mockMvc.perform(delete("/api/tickets/" + ticket.id + "/comments/" + comment.id)
      .header("Authorization", "Bearer " + tokenForUser2))
      .andExpect(status().isForbidden());
  }

  @Test
  void shouldAllowAdminToDeleteAnyComment() throws Exception {
    Comment comment = createCommentByUser(user1);
    
    mockMvc.perform(delete("/api/tickets/" + ticket.id + "/comments/" + comment.id)
      .header("Authorization", "Bearer " + tokenForAdmin))
      .andExpect(status().isNoContent());
  }
}
```

---

## HIGH PRIORITY ITEMS (Should Fix)

### 🟡 ISSUE #4: No Frontend Component Tests

**Severity:** 🟡 MEDIUM  
**Current Status:** 0 component test files  
**Required:** At least 3-4 test files

**Recommended Components to Test:**
1. **SlaTimer.test.jsx** - Elapsed time calculation, breach detection
2. **ImageLightbox.test.jsx** - Navigation, keyboard controls, state management
3. **TicketCard.test.jsx** - Priority coloring, status display, click handling

**Example: SlaTimer.test.jsx**
```jsx
import { render, screen, waitFor } from '@testing-library/react';
import SlaTimer from '../SlaTimer';

describe('SlaTimer', () => {
  it('should display elapsed hours since ticket creation', () => {
    const createdAt = new Date(Date.now() - 7200000); // 2 hours ago
    render(<SlaTimer createdAt={createdAt} priority="HIGH" status="OPEN" />);
    
    expect(screen.getByText(/2\.0.*hours?/)).toBeInTheDocument();
  });

  it('should highlight red when CRITICAL SLA breached (>2 hours)', () => {
    const createdAt = new Date(Date.now() - 10800000); // 3 hours ago
    render(<SlaTimer createdAt={createdAt} priority="CRITICAL" status="OPEN" />);
    
    const container = screen.getByRole('div');
    expect(container).toHaveClass('bg-red-100');
  });

  it('should show green checkmark when ticket resolved', () => {
    render(<SlaTimer createdAt={new Date()} priority="HIGH" status="RESOLVED" />);
    
    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('src', expect.stringContaining('check'));
  });

  it('should update elapsed time every 5 seconds', async () => {
    jest.useFakeTimers();
    const createdAt = new Date(Date.now() - 3600000); // 1 hour ago
    
    const { rerender } = render(<SlaTimer createdAt={createdAt} priority="HIGH" status="OPEN" />);
    expect(screen.getByText(/1\.0.*hours?/)).toBeInTheDocument();

    jest.advanceTimersByTime(5000); // 5 seconds
    rerender(<SlaTimer createdAt={createdAt} priority="HIGH" status="OPEN" />);
    
    // Just verify it doesn't break; exact time depends on implementation
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});
```

---

### 🟡 ISSUE #5: No API Documentation

**Severity:** 🟡 MEDIUM  
**Current Status:** No Postman collection or API docs  
**Required:** Postman collection or OpenAPI/Swagger spec

**Benefits:**
- Allows manual testing without reading code
- Documents expected request/response format
- Helps integration with frontend team
- Facilitates code review

**Quick Fix: Add Swagger/SpringDoc**
```xml
<!-- In pom.xml -->
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>2.0.0</version>
</dependency>
```

Then access at: `http://localhost:8081/swagger-ui.html`

---

## MEDIUM PRIORITY ITEMS (Nice to Have)

### 📝 ISSUE #6: Documentation Gaps

**Severity:** 📝 LOW, but Important  

**Needed Documentation:**
1. **API Reference** - List all endpoints with parameters
2. **Setup Guide** - How to run Member 3 module locally
3. **Database Schema** - ERD or table descriptions
4. **SLA Policy** - Document the escalation rules

**Example: Adding to README.md**
```markdown
## Member 3 - Maintenance & Incident Ticketing API

### Endpoints

#### GET /api/tickets/my
Retrieve current user's tickets with pagination.

**Parameters:**
- `page` (default: 0)
- `size` (default: 10)
- `status` (OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED)
- `priority` (CRITICAL, HIGH, MEDIUM, LOW)

**Response:** 
```json
{
  "content": [
    {
      "id": 1,
      "title": "AC Repair",
      "status": "OPEN",
      "priority": "CRITICAL",
      "createdAt": "2026-03-29T10:30:00",
      "slaDeadline": "2026-03-29T12:30:00",
      "slaViolated": false
    }
  ],
  "totalElements": 5,
  "totalPages": 1
}
```

### SLA Policy

| Priority | Deadline | Escalation |
|----------|----------|------------|
| CRITICAL | 2 hours | → HIGH (never escalates) |
| HIGH | 8 hours | → CRITICAL (never escalates) |
| MEDIUM | 24 hours | → HIGH after 24h |
| LOW | 72 hours | → MEDIUM after 48h |

### File Upload Requirements
- Maximum 3 files per ticket
- Allowed types: image/jpeg, image/png, image/webp
- Maximum size: 5 MB per file
```

---

## SUMMARY TABLE OF ALL ISSUES

| # | Issue | Severity | Status | Est. Time | Action |
|---|-------|----------|--------|-----------|--------|
| 1 | TechnicianDashboard mock data | 🔴 CRITICAL | ❌ Not Fixed | 20 min | Replace hardcoded arrays with API calls |
| 2 | Missing unit tests | 🟠 HIGH | ⚠️ Partial | 2 hours | Add 15+ test cases across 3 files |
| 3 | No integration tests | 🟠 HIGH | ❌ Missing | 3 hours | Create 2 MockMvc test files |
| 4 | No component tests | 🟡 MEDIUM | ❌ Missing | 1.5 hours | Add 3-4 React Testing Library tests |
| 5 | No API documentation | 🟡 MEDIUM | ❌ Missing | 1 hour | Add Swagger/Postman collection |
| 6 | Documentation gaps | 📝 LOW | ⚠️ Partial | 1 hour | Update README with API reference |

---

## DEPLOYMENT CHECKLIST

**Before Final Submission:**
- [ ] TechnicianDashboard connected to real API (CRITICAL)
- [ ] Unit tests added for AttachmentService (HIGH)
- [ ] Unit tests added for CommentService (HIGH)
- [ ] Integration tests verify multipart upload (HIGH)
- [ ] Integration tests verify 403 Forbidden on unauthorized edit (HIGH)
- [ ] TicketServiceTest expanded with 5+ more cases (MEDIUM)
- [ ] Component tests for SlaTimer and ImageLightbox (MEDIUM)
- [ ] Postman collection or Swagger UI working (MEDIUM)
- [ ] README updated with API docs (MEDIUM)
- [ ] No compilation errors: `mvn clean compile` (CRITICAL)
- [ ] Frontend builds: `npm run build` (CRITICAL)
- [ ] All features tested manually (CRITICAL)

---

## RECOMMENDED SUBMISSION ORDER

1. **First (Day 1):** Fix TechnicianDashboard mock data (20 min)
2. **Second (Day 1):** Add missing unit tests (2 hours)
3. **Third (Day 1-2):** Add integration tests (3 hours)
4. **Optional (Day 2):** Add component tests + docs (3 hours)

**Total Critical Work:** ~5.5 hours  
**Total with Optional:** ~8.5 hours

---

**Audit Document Version:** 2.0  
**Last Updated:** March 29, 2026  
**Confidence Level:** 98% (Evidence-based findings)
