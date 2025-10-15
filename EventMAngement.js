 // Simulated PostgreSQL Database with proper relationships
      let database = {
        users: [
          {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            name: "Jane Smith",
            email: "jane@example.com",
            created_at: new Date().toISOString(),
          },
          {
            id: 3,
            name: "Alice Johnson",
            email: "alice@example.com",
            created_at: new Date().toISOString(),
          },
          {
            id: 4,
            name: "Bob Wilson",
            email: "bob@example.com",
            created_at: new Date().toISOString(),
          },
        ],
        events: [
          {
            id: 1,
            title: "Tech Conference 2024",
            date_time: "2024-12-25T10:00:00.000Z",
            location: "Convention Center",
            capacity: 100,
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            title: "AI Workshop",
            date_time: "2024-12-30T14:00:00.000Z",
            location: "Tech Hub",
            capacity: 50,
            created_at: new Date().toISOString(),
          },
          {
            id: 3,
            title: "Design Meetup",
            date_time: "2024-11-15T18:00:00.000Z",
            location: "Creative Space",
            capacity: 30,
            created_at: new Date().toISOString(),
          },
        ],
        registrations: [
          {
            id: 1,
            event_id: 1,
            user_id: 1,
            registered_at: new Date().toISOString(),
          },
          {
            id: 2,
            event_id: 1,
            user_id: 2,
            registered_at: new Date().toISOString(),
          },
          {
            id: 3,
            event_id: 2,
            user_id: 1,
            registered_at: new Date().toISOString(),
          },
          {
            id: 4,
            event_id: 3,
            user_id: 3,
            registered_at: new Date().toISOString(),
          },
        ],
      };

      let nextUserId = 5;
      let nextEventId = 4;
      let nextRegistrationId = 5;

      // Complete Event Management REST API Implementation
      const API = {
        // Validation helpers
        validateEmail: (email) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },

        validateEventData: (eventData) => {
          const errors = [];

          if (!eventData.title || eventData.title.trim().length === 0) {
            errors.push("Title is required");
          }

          if (!eventData.dateTime) {
            errors.push("Date and time is required");
          } else {
            const eventDate = new Date(eventData.dateTime);
            if (eventDate <= new Date()) {
              errors.push("Event date must be in the future");
            }
          }

          if (!eventData.location || eventData.location.trim().length === 0) {
            errors.push("Location is required");
          }

          const capacity = parseInt(eventData.capacity);
          if (!capacity || capacity <= 0 || capacity > 1000) {
            errors.push(
              "Capacity must be a positive number between 1 and 1000"
            );
          }

          return errors;
        },

        // User endpoints
        createUser: (userData) => {
          // Validation
          if (!userData.name || userData.name.trim().length === 0) {
            return { success: false, error: "Name is required" };
          }

          if (!userData.email || !API.validateEmail(userData.email)) {
            return { success: false, error: "Valid email is required" };
          }

          // Check for duplicate email
          const existingUser = database.users.find(
            (u) => u.email.toLowerCase() === userData.email.toLowerCase()
          );
          if (existingUser) {
            return {
              success: false,
              error: "User with this email already exists",
            };
          }

          const user = {
            id: nextUserId++,
            name: userData.name.trim(),
            email: userData.email.toLowerCase(),
            created_at: new Date().toISOString(),
          };

          database.users.push(user);
          logDatabaseOperation("INSERT", "users", user);
          return { success: true, user, message: "User created successfully" };
        },

        getUsers: () => {
          logDatabaseOperation("SELECT", "users", database.users);
          return { success: true, users: database.users };
        },

        getUserById: (userId) => {
          const user = database.users.find((u) => u.id === parseInt(userId));
          if (!user) {
            return { success: false, error: "User not found" };
          }

          // Get user's registrations
          const userRegistrations = database.registrations
            .filter((r) => r.user_id === user.id)
            .map((reg) => {
              const event = database.events.find((e) => e.id === reg.event_id);
              return { ...event, registered_at: reg.registered_at };
            });

          logDatabaseOperation("SELECT", "user_with_events", {
            user,
            events: userRegistrations,
          });
          return {
            success: true,
            user: { ...user, registeredEvents: userRegistrations },
          };
        },

        // Event endpoints - Complete REST API Implementation
        createEvent: (eventData) => {
          // Comprehensive validation
          const validationErrors = API.validateEventData(eventData);
          if (validationErrors.length > 0) {
            return { success: false, error: validationErrors.join(", ") };
          }

          const event = {
            id: nextEventId++,
            title: eventData.title.trim(),
            date_time: new Date(eventData.dateTime).toISOString(),
            location: eventData.location.trim(),
            capacity: parseInt(eventData.capacity),
            created_at: new Date().toISOString(),
          };

          database.events.push(event);
          logDatabaseOperation("INSERT", "events", event);
          return {
            success: true,
            event,
            eventId: event.id,
            message: "Event created successfully",
          };
        },

        getEventDetails: (eventId) => {
          const event = database.events.find((e) => e.id === parseInt(eventId));
          if (!event) {
            return { success: false, error: "Event not found" };
          }

          // Get registered users for this event
          const registrations = database.registrations.filter(
            (r) => r.event_id === event.id
          );
          const registeredUsers = registrations.map((reg) => {
            const user = database.users.find((u) => u.id === reg.user_id);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              registered_at: reg.registered_at,
            };
          });

          const eventDetails = {
            ...event,
            registeredUsers,
            totalRegistrations: registrations.length,
            remainingCapacity: event.capacity - registrations.length,
            capacityUsedPercentage: (
              (registrations.length / event.capacity) *
              100
            ).toFixed(2),
          };

          logDatabaseOperation("SELECT", "event_details", eventDetails);
          return { success: true, event: eventDetails };
        },

        getEvents: () => {
          const eventsWithStats = database.events.map((event) => {
            const registrations = database.registrations.filter(
              (r) => r.event_id === event.id
            );
            return {
              ...event,
              registrationCount: registrations.length,
              availableSpots: event.capacity - registrations.length,
              capacityUsedPercentage: (
                (registrations.length / event.capacity) *
                100
              ).toFixed(2),
            };
          });
          logDatabaseOperation("SELECT", "events", eventsWithStats);
          return { success: true, events: eventsWithStats };
        },

        // List Upcoming Events with Custom Sorting
        getUpcomingEvents: () => {
          const now = new Date();
          const upcomingEvents = database.events
            .filter((event) => new Date(event.date_time) > now)
            .map((event) => {
              const registrations = database.registrations.filter(
                (r) => r.event_id === event.id
              );
              return {
                ...event,
                registrationCount: registrations.length,
                remainingCapacity: event.capacity - registrations.length,
                capacityUsedPercentage: (
                  (registrations.length / event.capacity) *
                  100
                ).toFixed(2),
              };
            })
            // Custom sorting: First by date (ascending), then by location (alphabetically)
            .sort((a, b) => {
              const dateComparison =
                new Date(a.date_time) - new Date(b.date_time);
              if (dateComparison !== 0) return dateComparison;
              return a.location.localeCompare(b.location);
            });

          logDatabaseOperation("SELECT", "upcoming_events", upcomingEvents);
          return { success: true, events: upcomingEvents };
        },

        // Registration endpoints with comprehensive validation and HTTP status codes
        registerForEvent: (eventId, userId) => {
          // Input validation
          if (!eventId || isNaN(parseInt(eventId))) {
            return {
              success: false,
              error: "Invalid event ID provided",
              statusCode: 400,
              errorType: "INVALID_INPUT",
            };
          }

          if (!userId || isNaN(parseInt(userId))) {
            return {
              success: false,
              error: "Invalid user ID provided",
              statusCode: 400,
              errorType: "INVALID_INPUT",
            };
          }

          const event = database.events.find((e) => e.id === parseInt(eventId));
          const user = database.users.find((u) => u.id === parseInt(userId));

          // Resource validation
          if (!event) {
            return {
              success: false,
              error: `Event with ID ${eventId} not found`,
              statusCode: 404,
              errorType: "EVENT_NOT_FOUND",
            };
          }

          if (!user) {
            return {
              success: false,
              error: `User with ID ${userId} not found`,
              statusCode: 404,
              errorType: "USER_NOT_FOUND",
            };
          }

          // Business logic validation

          // 1. Check if event is in the past (with 5-minute buffer for current events)
          const eventDate = new Date(event.date_time);
          const now = new Date();
          const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

          if (eventDate.getTime() <= now.getTime() + bufferTime) {
            return {
              success: false,
              error: `Cannot register for past events. Event "${
                event.title
              }" was scheduled for ${eventDate.toLocaleString()}`,
              statusCode: 422,
              errorType: "PAST_EVENT_REGISTRATION",
              eventDate: event.date_time,
              currentTime: now.toISOString(),
            };
          }

          // 2. Check for duplicate registration (prevent double registration)
          const existingRegistration = database.registrations.find(
            (r) =>
              r.event_id === parseInt(eventId) && r.user_id === parseInt(userId)
          );

          if (existingRegistration) {
            return {
              success: false,
              error: `User "${user.name}" is already registered for event "${event.title}"`,
              statusCode: 409,
              errorType: "DUPLICATE_REGISTRATION",
              existingRegistration: {
                registeredAt: existingRegistration.registered_at,
                registrationId: existingRegistration.id,
              },
            };
          }

          // 3. Enforce registration limits per event (check capacity)
          const currentRegistrations = database.registrations.filter(
            (r) => r.event_id === parseInt(eventId)
          );
          const remainingSpots = event.capacity - currentRegistrations.length;

          if (remainingSpots <= 0) {
            return {
              success: false,
              error: `Event "${event.title}" is at full capacity (${event.capacity}/${event.capacity} registered)`,
              statusCode: 422,
              errorType: "EVENT_FULL",
              eventCapacity: event.capacity,
              currentRegistrations: currentRegistrations.length,
              waitlistAvailable: false,
            };
          }

          // All validations passed - create registration
          const registration = {
            id: nextRegistrationId++,
            event_id: parseInt(eventId),
            user_id: parseInt(userId),
            registered_at: new Date().toISOString(),
          };

          database.registrations.push(registration);
          logDatabaseOperation("INSERT", "registrations", registration);

          return {
            success: true,
            registration,
            message: `Successfully registered ${user.name} for "${event.title}"`,
            statusCode: 201,
            eventDetails: {
              eventId: event.id,
              eventTitle: event.title,
              eventDate: event.date_time,
              remainingSpots: remainingSpots - 1,
              totalCapacity: event.capacity,
            },
            userDetails: {
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
            },
          };
        },

        // Cancel Registration with enhanced validation
        cancelRegistration: (eventId, userId) => {
          // Input validation
          if (!eventId || isNaN(parseInt(eventId))) {
            return {
              success: false,
              error: "Invalid event ID provided",
              statusCode: 400,
              errorType: "INVALID_INPUT",
            };
          }

          if (!userId || isNaN(parseInt(userId))) {
            return {
              success: false,
              error: "Invalid user ID provided",
              statusCode: 400,
              errorType: "INVALID_INPUT",
            };
          }

          const event = database.events.find((e) => e.id === parseInt(eventId));
          const user = database.users.find((u) => u.id === parseInt(userId));

          // Resource validation
          if (!event) {
            return {
              success: false,
              error: `Event with ID ${eventId} not found`,
              statusCode: 404,
              errorType: "EVENT_NOT_FOUND",
            };
          }

          if (!user) {
            return {
              success: false,
              error: `User with ID ${userId} not found`,
              statusCode: 404,
              errorType: "USER_NOT_FOUND",
            };
          }

          // Find existing registration
          const registrationIndex = database.registrations.findIndex(
            (r) =>
              r.event_id === parseInt(eventId) && r.user_id === parseInt(userId)
          );

          if (registrationIndex === -1) {
            return {
              success: false,
              error: `User "${user.name}" is not registered for event "${event.title}"`,
              statusCode: 404,
              errorType: "REGISTRATION_NOT_FOUND",
            };
          }

          // Check if cancellation is allowed (optional business rule - can cancel up to 1 hour before event)
          const eventDate = new Date(event.date_time);
          const now = new Date();
          const oneHourBeforeEvent = eventDate.getTime() - 60 * 60 * 1000; // 1 hour in milliseconds

          if (now.getTime() > oneHourBeforeEvent) {
            return {
              success: false,
              error: `Cannot cancel registration less than 1 hour before event start. Event "${
                event.title
              }" starts at ${eventDate.toLocaleString()}`,
              statusCode: 422,
              errorType: "CANCELLATION_TOO_LATE",
              eventDate: event.date_time,
              currentTime: now.toISOString(),
              cancellationDeadline: new Date(oneHourBeforeEvent).toISOString(),
            };
          }

          const cancelledRegistration =
            database.registrations[registrationIndex];
          database.registrations.splice(registrationIndex, 1);

          logDatabaseOperation(
            "DELETE",
            "registrations",
            cancelledRegistration
          );

          return {
            success: true,
            message: `Successfully cancelled registration for ${user.name} from "${event.title}"`,
            statusCode: 200,
            cancelledRegistration: {
              registrationId: cancelledRegistration.id,
              originalRegistrationDate: cancelledRegistration.registered_at,
              cancellationDate: new Date().toISOString(),
            },
            eventDetails: {
              eventId: event.id,
              eventTitle: event.title,
              eventDate: event.date_time,
              newAvailableSpots:
                event.capacity -
                database.registrations.filter(
                  (r) => r.event_id === parseInt(eventId)
                ).length,
            },
          };
        },

        // Event Statistics
        getEventStats: (eventId) => {
          const event = database.events.find((e) => e.id === parseInt(eventId));
          if (!event) {
            return { success: false, error: "Event not found" };
          }

          const registrations = database.registrations.filter(
            (r) => r.event_id === parseInt(eventId)
          );
          const totalRegistrations = registrations.length;
          const remainingCapacity = event.capacity - totalRegistrations;
          const capacityUsedPercentage = (
            (totalRegistrations / event.capacity) *
            100
          ).toFixed(2);

          const stats = {
            eventId: event.id,
            eventTitle: event.title,
            totalRegistrations,
            remainingCapacity,
            capacityUsedPercentage: parseFloat(capacityUsedPercentage),
            capacity: event.capacity,
            isFull: remainingCapacity === 0,
            eventDate: event.date_time,
            location: event.location,
          };

          logDatabaseOperation("SELECT", "event_stats", stats);
          return { success: true, stats };
        },

        // Advanced Analytics
        getSystemStats: () => {
          const totalEvents = database.events.length;
          const totalUsers = database.users.length;
          const totalRegistrations = database.registrations.length;
          const upcomingEvents = database.events.filter(
            (e) => new Date(e.date_time) > new Date()
          ).length;
          const pastEvents = totalEvents - upcomingEvents;

          const totalCapacity = database.events.reduce(
            (sum, event) => sum + event.capacity,
            0
          );
          const overallOccupancyRate =
            totalCapacity > 0
              ? ((totalRegistrations / totalCapacity) * 100).toFixed(2)
              : 0;

          const stats = {
            totalEvents,
            upcomingEvents,
            pastEvents,
            totalUsers,
            totalRegistrations,
            totalCapacity,
            overallOccupancyRate: parseFloat(overallOccupancyRate),
            averageRegistrationsPerEvent:
              totalEvents > 0
                ? (totalRegistrations / totalEvents).toFixed(2)
                : 0,
          };

          logDatabaseOperation("SELECT", "system_stats", stats);
          return { success: true, stats };
        },
      };

      // Frontend Functions
      function showTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll(".tab-content").forEach((content) => {
          content.classList.remove("active");
        });

        // Remove active class from all tabs
        document.querySelectorAll(".tab").forEach((tab) => {
          tab.classList.remove("active");
        });

        // Show selected tab content
        document.getElementById(tabName).classList.add("active");

        // Add active class to clicked tab
        event.target.classList.add("active");

        // Update content based on tab
        if (tabName === "database") {
          updateDatabaseView();
        }
      }

      function showMessage(text, type = "success") {
        const messageContainer = document.getElementById("messageContainer");
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = text;

        messageContainer.appendChild(messageDiv);

        setTimeout(() => {
          messageDiv.remove();
        }, 3000);
      }

      function updateUserSelect() {
        const select = document.getElementById("currentUser");
        const users = API.getUsers().users;

        select.innerHTML = '<option value="">Choose a user...</option>';
        users.forEach((user) => {
          const option = document.createElement("option");
          option.value = user.id;
          option.textContent = `${user.name} (${user.email})`;
          select.appendChild(option);
        });
      }

      function updateStatsDashboard() {
        const statsContainer = document.getElementById("statsGrid");
        const systemStatsResponse = API.getSystemStats();

        if (!systemStatsResponse.success) return;

        const stats = systemStatsResponse.stats;

        statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${stats.totalEvents}</div>
                    <div class="stat-label">Total Events</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.upcomingEvents}</div>
                    <div class="stat-label">Upcoming Events</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.pastEvents}</div>
                    <div class="stat-label">Past Events</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.totalUsers}</div>
                    <div class="stat-label">Registered Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.totalRegistrations}</div>
                    <div class="stat-label">Total Registrations</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.overallOccupancyRate}%</div>
                    <div class="stat-label">Overall Occupancy</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.averageRegistrationsPerEvent}</div>
                    <div class="stat-label">Avg Registrations/Event</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.totalCapacity}</div>
                    <div class="stat-label">Total Capacity</div>
                </div>
            `;
      }

      let allEvents = [];
      let filteredEvents = [];

      function displayEvents(eventsToShow = null) {
        const container = document.getElementById("eventsContainer");
        const response = API.getEvents();

        if (!response.success) {
          container.innerHTML = "<p>Error loading events</p>";
          return;
        }

        allEvents = response.events;
        const events = eventsToShow || allEvents;

        if (events.length === 0) {
          container.innerHTML =
            '<div style="text-align: center; padding: 60px; color: #999;"><p>No events match your criteria</p></div>';
          return;
        }

        container.innerHTML = events
          .map((event) => {
            const eventDate = new Date(event.date_time);
            const isUpcoming = eventDate > new Date();
            const isFull = event.availableSpots === 0;

            return `
                    <div class="event-card">
                        <h3>${event.title}</h3>
                        <p>${eventDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}</p>
                        <p>${eventDate.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</p>
                        <p>${event.location}</p>
                        <div class="event-meta">
                            <div class="event-status">
                                ${
                                  isFull
                                    ? "Fully Booked"
                                    : `${event.availableSpots} spots available`
                                }
                            </div>
                            <button class="btn ${
                              isFull ? "btn-secondary" : ""
                            }" 
                                    onclick="registerForEvent(${event.id})" 
                                    ${isFull || !isUpcoming ? "disabled" : ""}>
                                ${
                                  isFull
                                    ? "Waitlist"
                                    : isUpcoming
                                    ? "Register"
                                    : "Past Event"
                                }
                            </button>
                        </div>
                    </div>
                `;
          })
          .join("");
      }

      function filterAndSortEvents() {
        const searchTerm = document
          .getElementById("eventSearch")
          .value.toLowerCase();
        const filter = document.getElementById("eventFilter").value;
        const sort = document.getElementById("sortEvents").value;

        let filtered = allEvents.filter((event) => {
          const matchesSearch =
            event.title.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm);

          if (!matchesSearch) return false;

          switch (filter) {
            case "upcoming":
              return new Date(event.date_time) > new Date();
            case "available":
              return event.availableSpots > 0;
            case "full":
              return event.availableSpots === 0;
            default:
              return true;
          }
        });

        // Sort events
        filtered.sort((a, b) => {
          switch (sort) {
            case "title":
              return a.title.localeCompare(b.title);
            case "capacity":
              return b.capacity - a.capacity;
            case "date":
            default:
              return new Date(a.date_time) - new Date(b.date_time);
          }
        });

        displayEvents(filtered);
      }

      function displayUsers() {
        const container = document.getElementById("usersContainer");
        const response = API.getUsers();

        if (!response.success) {
          container.innerHTML = "<p>Error loading users</p>";
          return;
        }

        container.innerHTML = response.users
          .map(
            (user) => `
                <div class="user-card">
                    <h4>${user.name}</h4>
                    <p>${user.email}</p>
                    <p>Joined: ${new Date(
                      user.created_at
                    ).toLocaleDateString()}</p>
                </div>
            `
          )
          .join("");
      }

      function registerForEvent(eventId) {
        const currentUserId = document.getElementById("currentUser").value;

        if (!currentUserId) {
          showMessage("Please select a user first", "error");
          return;
        }

        const response = API.registerForEvent(eventId, parseInt(currentUserId));

        if (response.success) {
          showMessage(
            `✓ ${response.message} (${response.eventDetails.remainingSpots} spots remaining)`
          );
          refreshAllDisplays();
        } else {
          // Enhanced error handling with specific messages based on error type
          let errorMessage = response.error;

          switch (response.errorType) {
            case "DUPLICATE_REGISTRATION":
              errorMessage = `❌ Already registered! You registered for this event on ${new Date(
                response.existingRegistration.registeredAt
              ).toLocaleDateString()}`;
              break;
            case "EVENT_FULL":
              errorMessage = `❌ Event is full! All ${response.eventCapacity} spots are taken`;
              break;
            case "PAST_EVENT_REGISTRATION":
              errorMessage = `❌ Cannot register for past events! This event was on ${new Date(
                response.eventDate
              ).toLocaleDateString()}`;
              break;
            case "EVENT_NOT_FOUND":
              errorMessage = `❌ Event not found! Please refresh the page and try again`;
              break;
            case "USER_NOT_FOUND":
              errorMessage = `❌ User not found! Please select a valid user`;
              break;
            default:
              errorMessage = `❌ ${response.error}`;
          }

          showMessage(errorMessage, "error");

          // Log detailed error information for debugging
          console.log("Registration failed:", {
            statusCode: response.statusCode,
            errorType: response.errorType,
            fullResponse: response,
          });
        }
      }

      function testAPI(endpoint) {
        const responsesContainer = document.getElementById("apiResponses");
        let response;
        let endpointName = "";

        switch (endpoint) {
          case "users":
            response = API.getUsers();
            endpointName = "GET /api/users";
            break;
          case "events":
            response = API.getEvents();
            endpointName = "GET /api/events";
            break;
          case "upcoming":
            response = API.getUpcomingEvents();
            endpointName = "GET /api/events/upcoming";
            break;
          case "eventDetails":
            response = API.getEventDetails(1);
            endpointName = "GET /api/events/1";
            break;
          case "stats":
            response = API.getEventStats(1);
            endpointName = "GET /api/events/1/stats";
            break;
          case "systemStats":
            response = API.getSystemStats();
            endpointName = "GET /api/system/stats";
            break;
          case "userDetails":
            response = API.getUserById(1);
            endpointName = "GET /api/users/1";
            break;
          case "cancelReg":
            response = API.cancelRegistration(1, 2);
            endpointName = "DELETE /api/events/1/register/2";
            refreshAllDisplays();
            break;
        }

        const responseDiv = document.createElement("div");
        responseDiv.className = "api-demo";
        responseDiv.innerHTML = `
                <h4>Response from ${endpointName}:</h4>
                <pre>${JSON.stringify(response, null, 2)}</pre>
            `;

        responsesContainer.appendChild(responseDiv);
        responsesContainer.scrollTop = responsesContainer.scrollHeight;
      }

      function testValidation(testType) {
        const responsesContainer = document.getElementById("apiResponses");
        let response;
        let testName = "";
        let testDescription = "";

        switch (testType) {
          case "duplicateReg":
            // Try to register user 1 for event 1 (they're already registered)
            response = API.registerForEvent(1, 1);
            testName = "Duplicate Registration Test";
            testDescription =
              "Attempting to register User 1 for Event 1 (already registered)";
            break;

          case "fullEvent":
            // Create a small capacity event and fill it up
            const smallEvent = API.createEvent({
              title: "Small Test Event",
              dateTime: "2024-12-31T10:00:00",
              location: "Test Location",
              capacity: "1",
            });

            if (smallEvent.success) {
              // Fill the event
              API.registerForEvent(smallEvent.eventId, 1);
              // Try to register another user
              response = API.registerForEvent(smallEvent.eventId, 2);
              testName = "Full Event Registration Test";
              testDescription = `Created event with capacity 1, filled it, then tried to register another user`;
            }
            break;

          case "pastEvent":
            // Create a past event
            const pastEvent = API.createEvent({
              title: "Past Test Event",
              dateTime: "2020-01-01T10:00:00",
              location: "Past Location",
              capacity: "50",
            });

            if (pastEvent.success) {
              response = API.registerForEvent(pastEvent.eventId, 1);
              testName = "Past Event Registration Test";
              testDescription =
                "Attempting to register for an event in the past (2020)";
            }
            break;

          case "invalidUser":
            response = API.registerForEvent(1, 99999);
            testName = "Invalid User ID Test";
            testDescription =
              "Attempting to register non-existent user (ID: 99999)";
            break;

          case "invalidEvent":
            response = API.registerForEvent(99999, 1);
            testName = "Invalid Event ID Test";
            testDescription =
              "Attempting to register for non-existent event (ID: 99999)";
            break;

          case "lateCancellation":
            // Create an event that starts in 30 minutes (less than 1 hour)
            const soonEvent = new Date();
            soonEvent.setMinutes(soonEvent.getMinutes() + 30);

            const nearEvent = API.createEvent({
              title: "Soon Starting Event",
              dateTime: soonEvent.toISOString(),
              location: "Near Location",
              capacity: "50",
            });

            if (nearEvent.success) {
              // Register user first
              const registration = API.registerForEvent(nearEvent.eventId, 1);
              if (registration.success) {
                // Try to cancel (should fail due to 1-hour rule)
                response = API.cancelRegistration(nearEvent.eventId, 1);
                testName = "Late Cancellation Test";
                testDescription =
                  "Attempting to cancel registration 30 minutes before event (violates 1-hour rule)";
              }
            }
            break;
        }

        if (response) {
          const responseDiv = document.createElement("div");
          responseDiv.className = "api-demo";
          responseDiv.style.borderLeft = response.success
            ? "4px solid #10b981"
            : "4px solid #ef4444";
          responseDiv.innerHTML = `
                    <h4>${testName} ${response.success ? "✅" : "❌"}</h4>
                    <p style="margin-bottom: 15px; font-style: italic;">${testDescription}</p>
                    <p><strong>Status Code:</strong> ${
                      response.statusCode || "N/A"
                    }</p>
                    <p><strong>Error Type:</strong> ${
                      response.errorType || "N/A"
                    }</p>
                    <pre>${JSON.stringify(response, null, 2)}</pre>
                `;

          responsesContainer.appendChild(responseDiv);
          responsesContainer.scrollTop = responsesContainer.scrollHeight;

          // Refresh displays if data was modified
          if (
            testType === "fullEvent" ||
            testType === "pastEvent" ||
            testType === "lateCancellation"
          ) {
            refreshAllDisplays();
          }
        }
      }

      // Enhanced Event Management Functions
      function showUpcomingEvents() {
        const response = API.getUpcomingEvents();
        if (response.success) {
          displayEvents(response.events);
          showMessage(`Showing ${response.events.length} upcoming events`);
        }
      }

      function showAllEvents() {
        displayEvents();
        showMessage("Showing all events");
      }

      // Form display functions
      function showEventDetailsForm() {
        closeAllForms();
        populateEventSelects();
        document.getElementById("eventDetailsForm").style.display = "block";
      }

      function showCancelRegistrationForm() {
        closeAllForms();
        populateEventSelects();
        populateUserSelects();
        document.getElementById("cancelRegistrationForm").style.display =
          "block";
      }

      function showEventStatsForm() {
        closeAllForms();
        populateEventSelects();
        document.getElementById("eventStatsForm").style.display = "block";
      }

      function showUserEventsForm() {
        closeAllForms();
        populateUserSelects();
        document.getElementById("userEventsForm").style.display = "block";
      }

      function closeForm(formId) {
        document.getElementById(formId).style.display = "none";
      }

      function closeAllForms() {
        const forms = [
          "eventDetailsForm",
          "cancelRegistrationForm",
          "eventStatsForm",
          "userEventsForm",
        ];
        forms.forEach((formId) => {
          document.getElementById(formId).style.display = "none";
        });
        closeResults();
      }

      function closeResults() {
        document.getElementById("resultsModal").style.display = "none";
      }

      // Populate select dropdowns
      function populateEventSelects() {
        const response = API.getEvents();
        if (!response.success) return;

        const events = response.events;
        const selects = ["detailsEventId", "cancelEventId", "statsEventId"];

        selects.forEach((selectId) => {
          const select = document.getElementById(selectId);
          if (select) {
            select.innerHTML = '<option value="">Choose an event...</option>';
            events.forEach((event) => {
              const option = document.createElement("option");
              option.value = event.id;
              option.textContent = `${event.title} - ${new Date(
                event.date_time
              ).toLocaleDateString()}`;
              select.appendChild(option);
            });
          }
        });
      }

      function populateUserSelects() {
        const response = API.getUsers();
        if (!response.success) return;

        const users = response.users;
        const selects = ["cancelUserId", "userEventsUserId"];

        selects.forEach((selectId) => {
          const select = document.getElementById(selectId);
          if (select) {
            select.innerHTML = '<option value="">Choose a user...</option>';
            users.forEach((user) => {
              const option = document.createElement("option");
              option.value = user.id;
              option.textContent = `${user.name} (${user.email})`;
              select.appendChild(option);
            });
          }
        });
      }

      // Smart populate users based on selected event for cancellation
      function populateUsersForEvent(eventId) {
        if (!eventId) {
          populateUserSelects();
          return;
        }

        const eventResponse = API.getEventDetails(parseInt(eventId));
        if (!eventResponse.success) return;

        const registeredUsers = eventResponse.event.registeredUsers;
        const select = document.getElementById("cancelUserId");

        select.innerHTML =
          '<option value="">Choose a registered user...</option>';

        if (registeredUsers.length === 0) {
          const option = document.createElement("option");
          option.value = "";
          option.textContent = "No users registered for this event";
          option.disabled = true;
          select.appendChild(option);
          return;
        }

        registeredUsers.forEach((user) => {
          const option = document.createElement("option");
          option.value = user.id;
          option.textContent = `${user.name} (${user.email})`;
          select.appendChild(option);
        });
      }

      // Action functions
      function getEventDetails() {
        const eventId = document.getElementById("detailsEventId").value;

        if (!eventId) {
          showMessage("Please select an event", "error");
          return;
        }

        const response = API.getEventDetails(parseInt(eventId));

        if (response.success) {
          const event = response.event;
          const content = `
                    <div style="background: #fafafa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="font-family: 'Playfair Display', serif; margin-bottom: 20px; color: #1a1a1a;">${
                          event.title
                        }</h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                            <div>
                                <p><strong>Date & Time:</strong><br>${new Date(
                                  event.date_time
                                ).toLocaleString()}</p>
                                <p><strong>Location:</strong><br>${
                                  event.location
                                }</p>
                            </div>
                            <div>
                                <p><strong>Total Capacity:</strong> ${
                                  event.capacity
                                }</p>
                                <p><strong>Total Registrations:</strong> ${
                                  event.totalRegistrations
                                }</p>
                                <p><strong>Remaining Spots:</strong> ${
                                  event.remainingCapacity
                                }</p>
                                <p><strong>Capacity Used:</strong> ${
                                  event.capacityUsedPercentage
                                }%</p>
                            </div>
                        </div>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px;">
                            <h4 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">Registered Users (${
                              event.registeredUsers.length
                            }):</h4>
                            ${
                              event.registeredUsers.length > 0
                                ? event.registeredUsers
                                    .map(
                                      (user) => `
                                    <div style="background: #f8f8f8; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #1a1a1a;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div>
                                                <strong>${
                                                  user.name
                                                }</strong><br>
                                                <span style="color: #666;">${
                                                  user.email
                                                }</span>
                                            </div>
                                            <div style="text-align: right; font-size: 12px; color: #999;">
                                                Registered:<br>${new Date(
                                                  user.registered_at
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                `
                                    )
                                    .join("")
                                : '<p style="text-align: center; color: #999; padding: 20px;">No users registered yet.</p>'
                            }
                        </div>
                    </div>
                `;

          showResults("Event Details", content);
          closeForm("eventDetailsForm");
        } else {
          showMessage(response.error, "error");
        }
      }

      function getEventStats() {
        const eventId = document.getElementById("statsEventId").value;

        if (!eventId) {
          showMessage("Please select an event", "error");
          return;
        }

        const response = API.getEventStats(parseInt(eventId));

        if (response.success) {
          const stats = response.stats;
          const content = `
                    <div style="background: #fafafa; padding: 30px; border-radius: 8px;">
                        <h3 style="font-family: 'Playfair Display', serif; margin-bottom: 30px; color: #1a1a1a;">${
                          stats.eventTitle
                        }</h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                            <div style="background: white; padding: 20px; text-align: center; border-radius: 8px;">
                                <div style="font-size: 2.5em; font-weight: bold; color: #1a1a1a; margin-bottom: 10px;">${
                                  stats.totalRegistrations
                                }</div>
                                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #999;">Total Registrations</div>
                            </div>
                            
                            <div style="background: white; padding: 20px; text-align: center; border-radius: 8px;">
                                <div style="font-size: 2.5em; font-weight: bold; color: #1a1a1a; margin-bottom: 10px;">${
                                  stats.remainingCapacity
                                }</div>
                                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #999;">Remaining Capacity</div>
                            </div>
                            
                            <div style="background: white; padding: 20px; text-align: center; border-radius: 8px;">
                                <div style="font-size: 2.5em; font-weight: bold; color: #1a1a1a; margin-bottom: 10px;">${
                                  stats.capacityUsedPercentage
                                }%</div>
                                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #999;">Capacity Used</div>
                            </div>
                            
                            <div style="background: white; padding: 20px; text-align: center; border-radius: 8px;">
                                <div style="font-size: 2.5em; font-weight: bold; color: ${
                                  stats.isFull ? "#ef4444" : "#10b981"
                                }; margin-bottom: 10px;">${
            stats.isFull ? "FULL" : "OPEN"
          }</div>
                                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #999;">Status</div>
                            </div>
                        </div>
                        
                        <div style="background: white; padding: 20px; margin-top: 20px; border-radius: 8px;">
                            <p><strong>Event Date:</strong> ${new Date(
                              stats.eventDate
                            ).toLocaleString()}</p>
                            <p><strong>Location:</strong> ${stats.location}</p>
                            <p><strong>Total Capacity:</strong> ${
                              stats.capacity
                            }</p>
                        </div>
                    </div>
                `;

          showResults("Event Statistics", content);
          closeForm("eventStatsForm");
        } else {
          showMessage(response.error, "error");
        }
      }

      function getUserEvents() {
        const userId = document.getElementById("userEventsUserId").value;

        if (!userId) {
          showMessage("Please select a user", "error");
          return;
        }

        const response = API.getUserById(parseInt(userId));

        if (response.success) {
          const user = response.user;
          const events = user.registeredEvents || [];

          const content = `
                    <div style="background: #fafafa; padding: 30px; border-radius: 8px;">
                        <h3 style="font-family: 'Playfair Display', serif; margin-bottom: 20px; color: #1a1a1a;">${
                          user.name
                        }'s Registered Events</h3>
                        <p style="color: #666; margin-bottom: 30px;">${
                          user.email
                        }</p>
                        
                        ${
                          events.length > 0
                            ? events
                                .map(
                                  (event) => `
                                <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #1a1a1a;">
                                    <div style="display: flex; justify-content: space-between; align-items: start;">
                                        <div>
                                            <h4 style="margin: 0 0 10px 0; font-family: 'Playfair Display', serif;">${
                                              event.title
                                            }</h4>
                                            <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date(
                                              event.date_time
                                            ).toLocaleString()}</p>
                                            <p style="margin: 5px 0; color: #666;"><strong>Location:</strong> ${
                                              event.location
                                            }</p>
                                        </div>
                                        <div style="text-align: right; font-size: 12px; color: #999;">
                                            Registered:<br>${new Date(
                                              event.registered_at
                                            ).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            `
                                )
                                .join("")
                            : '<div style="background: white; padding: 40px; text-align: center; border-radius: 8px;"><p style="color: #999;">No events registered yet.</p></div>'
                        }
                    </div>
                `;

          showResults(`User Events (${events.length})`, content);
          closeForm("userEventsForm");
        } else {
          showMessage(response.error, "error");
        }
      }

      function cancelUserRegistration() {
        const eventId = document.getElementById("cancelEventId").value;
        const userId = document.getElementById("cancelUserId").value;

        if (!eventId) {
          showMessage("Please select an event first", "error");
          return;
        }

        if (!userId) {
          showMessage("Please select a registered user to cancel", "error");
          return;
        }

        // Get event and user names for confirmation message
        const eventResponse = API.getEventDetails(parseInt(eventId));
        const userResponse = API.getUserById(parseInt(userId));

        if (!eventResponse.success || !userResponse.success) {
          showMessage("Error retrieving event or user information", "error");
          return;
        }

        const response = API.cancelRegistration(
          parseInt(eventId),
          parseInt(userId)
        );

        if (response.success) {
          showMessage(
            `✓ Cancelled registration for ${userResponse.user.name} from "${eventResponse.event.title}"`
          );
          refreshAllDisplays();
          closeForm("cancelRegistrationForm");

          // Reset the form
          document.getElementById("cancelEventId").value = "";
          document.getElementById("cancelUserId").innerHTML =
            '<option value="">First select an event...</option>';
        } else {
          showMessage(response.error, "error");
        }
      }

      function showResults(title, content) {
        document.getElementById("resultsTitle").textContent = title;
        document.getElementById("resultsContent").innerHTML = content;
        document.getElementById("resultsModal").style.display = "block";
      }

      function logDatabaseOperation(operation, table, data) {
        const logContainer = document.getElementById("dbLog");
        const timestamp = new Date().toLocaleTimeString();

        const logEntry = document.createElement("div");
        logEntry.innerHTML = `
                <p><strong>[${timestamp}]</strong> ${operation} on ${table}</p>
                <pre>${JSON.stringify(data, null, 2)}</pre>
                <hr>
            `;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
      }

      function updateDatabaseView() {
        const container = document.getElementById("databaseView");
        container.innerHTML = `
                <div class="api-demo">
                    <h4>Users Table (${database.users.length} records):</h4>
                    <pre>${JSON.stringify(database.users, null, 2)}</pre>
                </div>
                <div class="api-demo">
                    <h4>Events Table (${database.events.length} records):</h4>
                    <pre>${JSON.stringify(database.events, null, 2)}</pre>
                </div>
                <div class="api-demo">
                    <h4>Registrations Table (${
                      database.registrations.length
                    } records):</h4>
                    <pre>${JSON.stringify(
                      database.registrations,
                      null,
                      2
                    )}</pre>
                </div>
            `;
      }

      // Form Event Listeners
      document
        .getElementById("userForm")
        .addEventListener("submit", function (e) {
          e.preventDefault();

          const userData = {
            name: document.getElementById("userName").value,
            email: document.getElementById("userEmail").value,
          };

          const response = API.createUser(userData);

          if (response.success) {
            showMessage("User created successfully!");
            this.reset();
            refreshAllDisplays();
          } else {
            showMessage(response.error, "error");
          }
        });

      document
        .getElementById("eventForm")
        .addEventListener("submit", function (e) {
          e.preventDefault();

          const eventData = {
            title: document.getElementById("eventTitle").value,
            dateTime: document.getElementById("eventDate").value,
            location: document.getElementById("eventLocation").value,
            capacity: document.getElementById("eventCapacity").value,
          };

          const response = API.createEvent(eventData);

          if (response.success) {
            showMessage("Event created successfully!");
            this.reset();
            refreshAllDisplays();
          } else {
            showMessage(response.error, "error");
          }
        });

      // Initialize the application
      document.addEventListener("DOMContentLoaded", function () {
        updateUserSelect();
        displayEvents();
        displayUsers();
        updateDatabaseView();
        updateStatsDashboard();

        // Set minimum date to today
        const dateInput = document.getElementById("eventDate");
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        dateInput.min = now.toISOString().slice(0, 16);

        // Add event listeners for search and filter
        document
          .getElementById("eventSearch")
          .addEventListener("input", filterAndSortEvents);
        document
          .getElementById("eventFilter")
          .addEventListener("change", filterAndSortEvents);
        document
          .getElementById("sortEvents")
          .addEventListener("change", filterAndSortEvents);
      });

      // Update all displays when data changes
      function refreshAllDisplays() {
        updateUserSelect();
        displayEvents();
        displayUsers();
        updateStatsDashboard();
        populateEventSelects(); // Update all event dropdowns
        populateUserSelects(); // Update all user dropdowns
        if (document.getElementById("database").classList.contains("active")) {
          updateDatabaseView();
        }
      }
  
      (function () {
        function c() {
          var b = a.contentDocument || a.contentWindow.document;
          if (b) {
            var d = b.createElement("script");
            d.innerHTML =
              "window.__CF$cv$params={r:'98ee13647589b550',t:'MTc2MDUxODI5OC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";
            b.getElementsByTagName("head")[0].appendChild(d);
          }
        }
        if (document.body) {
          var a = document.createElement("iframe");
          a.height = 1;
          a.width = 1;
          a.style.position = "absolute";
          a.style.top = 0;
          a.style.left = 0;
          a.style.border = "none";
          a.style.visibility = "hidden";
          document.body.appendChild(a);
          if ("loading" !== document.readyState) c();
          else if (window.addEventListener)
            document.addEventListener("DOMContentLoaded", c);
          else {
            var e = document.onreadystatechange || function () {};
            document.onreadystatechange = function (b) {
              e(b);
              "loading" !== document.readyState &&
                ((document.onreadystatechange = e), c());
            };
          }
        }
      })();