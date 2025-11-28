document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear activity select before adding
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants container
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants";
        participantsContainer.appendChild(participantsHeader);

        if (details.participants && details.participants.length > 0) {
          const list = document.createElement("ul");
          list.className = "participants-list";
          // keep the activity name in a local const for use in closures
          const activityName = name;
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // Derive a simple display name from email
            const namePrefix = email.split("@")[0];
            const displayName = namePrefix
              .split(/[^a-zA-Z0-9]+/)
              .filter(Boolean)
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ");

            li.innerHTML = `
              <div class="participant-info">
                <span class="participant-avatar">${displayName.charAt(0) || "?"}</span>
                <span class="participant-name">${displayName}</span>
                <span class="participant-email">${email}</span>
              </div>
              <button class="participant-remove" title="Remove participant" aria-label="Remove ${displayName}" data-email="${email}">
                <!-- Trash icon (SVG) -->
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M19 6l-1 14c-.1 1-1 2-2 2H8c-1 0-2-.9-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M10 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            `;

            // Add remove button behavior
            const removeBtn = li.querySelector('.participant-remove');
            removeBtn.addEventListener('click', async () => {
              const confirmRemove = confirm(`Remove ${email} from ${activityName}?`);
              if (!confirmRemove) return;

              try {
                const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`, {
                  method: 'DELETE',
                });

                const data = await resp.json();
                if (resp.ok) {
                  messageDiv.textContent = data.message || 'Removed participant';
                  messageDiv.className = 'message success';
                  messageDiv.classList.remove('hidden');
                  // Refresh activities to show change
                  fetchActivities();
                } else {
                  messageDiv.textContent = data.detail || 'Failed to remove participant';
                  messageDiv.className = 'message error';
                  messageDiv.classList.remove('hidden');
                }

                // Hide message after 5s
                setTimeout(() => { messageDiv.classList.add('hidden'); }, 5000);
              } catch (err) {
                console.error('Error removing participant:', err);
                messageDiv.textContent = 'Failed to remove participant. Please try again.';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
              }
            });

            list.appendChild(li);
          });

          participantsContainer.appendChild(list);
        } else {
          const noOne = document.createElement("p");
          noOne.className = "no-participants info";
          noOne.textContent = "No participants yet";
          participantsContainer.appendChild(noOne);
        }

        activityCard.appendChild(participantsContainer);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh the activities list so new participant shows up
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
