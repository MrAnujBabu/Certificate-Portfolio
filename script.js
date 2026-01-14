// Main Website JavaScript
document.addEventListener("DOMContentLoaded", function() {
    const grid = document.getElementById("certificate-grid");
    let allCourses = [];
    let currentFilter = 'all';

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allCourses = data;
            displayCourses(data);
            updateStats(data);
            localStorage.setItem('certificatesData', JSON.stringify(data));
        })
        .catch(error => {
            console.error('Error loading certificates:', error);
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3em; color: #ff9800; margin-bottom: 20px;"></i>
                    <h3>Unable to load certificates</h3>
                    <p>Please check your internet connection and try again.</p>
                </div>
            `;
        });

    function displayCourses(courses) {
        grid.innerHTML = '';
        if (courses.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="fas fa-book-open" style="font-size: 3em; color: #ddd; margin-bottom: 20px;"></i>
                    <h3>No certificates yet</h3>
                    <p>Add your first course using the Admin Panel!</p>
                </div>
            `;
            return;
        }
        courses.forEach((course, index) => {
            const card = createCourseCard(course, index);
            grid.appendChild(card);
        });
    }

    function createCourseCard(course, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        let descriptionHTML = course.description;
        if (course.overview) descriptionHTML += '<br><br>' + formatTextWithEmojis(course.overview);
        if (course.experience) descriptionHTML += '<br><br><strong>💭 My Experience:</strong><br>' + formatTextWithEmojis(course.experience);
        if (course.skills && course.skills.length > 0) {
            const skills = Array.isArray(course.skills) ? course.skills : course.skills.split(',').map(s => s.trim());
            descriptionHTML += '<br><br><strong>🛠️ Skills Gained:</strong><br>';
            skills.forEach(skill => descriptionHTML += `• ${skill.trim()}<br>`);
        }
        if (course.duration) descriptionHTML += `<br><strong>⏱️ Duration:</strong> ${course.duration}`;

        // Project Links Logic
        let linksHtml = '';
        if (course.projectLinks && course.projectLinks.length > 0) {
            linksHtml = '<div class="project-links-container">';
            course.projectLinks.forEach(link => {
                let icon = 'fas fa-external-link-alt';
                if (link.name.toLowerCase().includes('verify')) icon = 'fas fa-certificate';
                if (link.name.toLowerCase().includes('github') || link.name.toLowerCase().includes('source')) icon = 'fab fa-github';
                
                linksHtml += `
                    <a href="${link.url}" target="_blank" class="project-link-btn">
                        <i class="${icon}"></i> ${link.name}
                    </a>
                `;
            });
            linksHtml += '</div>';
        }

        card.innerHTML = `
            <div class="card-image">
                <img src="${course.image}" alt="${course.courseName} Certificate" onclick="openImage('${course.image}')" loading="lazy">
            </div>
            <div class="card-content">
                <span class="status ${course.status.toLowerCase().replace(' ', '-')}">${course.status}</span>
                <h3>${course.courseName}</h3>
                <p class="meta">
                    <i class="fas fa-university"></i> ${course.platform}
                    <i class="fas fa-calendar-alt" style="margin-left: 15px;"></i> ${course.completionDate}
                </p>
                <div class="desc">${descriptionHTML}</div>
                ${linksHtml} <!-- Added Links Here -->
                <div class="card-footer">
                    <small>ID: ${course.id}</small>
                    <div class="skill-tags">
                        ${(course.skills && Array.isArray(course.skills) ? course.skills.slice(0, 3).map(s => `<span class="skill-tag">${s}</span>`).join('') : '')}
                    </div>
                </div>
            </div>
        `;
        return card;
    }

    function formatTextWithEmojis(text) {
        return text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    window.filterCourses = function(status) {
        currentFilter = status;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        let filteredCourses = status === 'all' ? allCourses : allCourses.filter(course => course.status === status);
        displayCourses(filteredCourses);
    };

    function updateStats(courses) {
        if (typeof window.updateStats === 'function') window.updateStats(courses);
    }

    window.openImage = function(src) {
        window.open(src, '_blank');
    };
});

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
