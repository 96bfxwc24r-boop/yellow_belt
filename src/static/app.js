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

      // Reset select (keep default prompt)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Title
        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        // Description
        const descP = document.createElement("p");
        descP.textContent = details.description;
        activityCard.appendChild(descP);

        // Schedule
        const schedP = document.createElement("p");
        schedP.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        activityCard.appendChild(schedP);

        // Availability
        const availP = document.createElement("p");
        availP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        activityCard.appendChild(availP);

        // Participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants";

        // small count badge
        const countSpan = document.createElement("span");
        countSpan.className = "count";
        countSpan.textContent = `${details.participants.length}`;
        participantsHeader.appendChild(countSpan);

        participantsDiv.appendChild(participantsHeader);

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const ul = document.createElement("ul");


          details.participants.forEach((p) => {
            const li = document.createElement("li");

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";

            // Determine display name and initials
            let displayName = "";
            if (typeof p === "string") {
              displayName = p;
            } else if (p && typeof p === "object") {
              displayName = p.name || p.email || "Unknown User";
            } else {
              displayName = String(p);
            }

            // Derive initials: handle both names and emails
            let local = displayName;
            if (displayName.includes("@")) {
              local = displayName.split("@")[0];
            }
            const parts = local.split(/[\s._-]+/).filter(Boolean);

            // Robust initials logic:
            let initials = "";
            if (parts.length === 0) {
              initials = (displayName.slice(0, 2) || "?").toUpperCase();
            } else if (parts.length === 1) {
              initials = (parts[0].slice(0, 2) || parts[0][0] || "?").toUpperCase();
            } else {
              const first = parts[0] && parts[0][0] ? parts[0][0] : "";
              const lastPart = parts[parts.length - 1];
              const last = lastPart && lastPart[0] ? lastPart[0] : "";
              initials = (first + last).toUpperCase();
            }

            avatar.textContent = initials;

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = displayName;

            // Delete icon
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-participant";
            deleteBtn.title = "Remove participant";
            deleteBtn.innerHTML = "&#128465;"; // Trash can emoji
            deleteBtn.style.background = "none";
            deleteBtn.style.border = "none";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.marginLeft = "4px";
            deleteBtn.style.fontSize = "16px";
            deleteBtn.style.color = "#c62828";

            deleteBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              if (!confirm(`Remove ${displayName} from ${name}?`)) return;
              try {
                const resp = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(displayName)}`, {
                  method: "DELETE",
                });
                const result = await resp.json();
                if (resp.ok) {
                  fetchActivities();
                } else {
                  alert(result.detail || "Failed to remove participant.");
                }
              } catch (err) {
                alert("Error removing participant.");
              }
            });

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });

          participantsDiv.appendChild(ul);
        } else {
          const emptyP = document.createElement("p");
          emptyP.className = "info";
          emptyP.textContent = "No participants yet.";
          participantsDiv.appendChild(emptyP);
        }

        activityCard.appendChild(participantsDiv);

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
    const submitBtn = signupForm.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { "Cache-Control": "no-cache" },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Always force update activities after signup
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
