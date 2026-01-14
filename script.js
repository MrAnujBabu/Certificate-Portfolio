// Main Website JavaScript
document.addEventListener("DOMContentLoaded", function() {
    const grid = document.getElementById("certificate-grid");
    let allCourses = [];
    let currentFilter = 'all';

    // 1. Fetch Data
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allCourses = data;
            displayCourses(data);
            updateStats(data);
            
            // Save to localStorage for admin panel compatibility
            localStorage.setItem('certificatesData', JSON.stringify(data));
        })
        .catch(error => {
            console.error('Error loading certificates:', error);
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #8b949e;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3em; color: #f0883e; margin-bottom: 20px;"></i>
                    <h3>Unable to load certificates</h3>
                    <p>Please check your internet connection or data.json file.</p>
                </div>
            `;
        });

    // 2. Icons & Helpers
    function getPlatformIcon(platform) {
        const p = platform.toLowerCase();
        if (p.includes('google')) return 'fab fa-google';
        if (p.includes('microsoft') || p.includes('azure')) return 'fab fa-microsoft';
        if (p.includes('ibm')) return 'fas fa-building';
        if (p.includes('amazon') || p.includes('aws')) return 'fab fa-aws';
        if (p.includes('udemy')) return 'fas fa-video';
        return 'fas fa-certificate';
    }

    function getPlatformClass(platform) {
        const p = platform.toLowerCase();
        if (p.includes('google')) return 'google';
        if (p.includes('coursera')) return 'coursera';
        if (p.includes('deeplearning')) return 'deeplearning';
        return '';
    }

    function formatTextWithEmojis(text) {
        if (!text) return '';
        return text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    // 3. Display Logic
    function displayCourses(courses) {
        grid.innerHTML = '';
        
        if (courses.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #8b949e;">
                    <i class="fas fa-folder-open" style="font-size: 3em; margin-bottom: 20px;"></i>
                    <h3>No certificates found</h3>
                </div>
            `;
            return;
        }
        
        courses.forEach((course, index) => {
            const card = document.createElement('div');
            card.className = 'cert-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            // Process Skills
            let skillsHtml = '';
            if (course.skills) {
                const skills = Array.isArray(course.skills) ? course.skills : course.skills.split(',');
                skillsHtml = `<div class="skill-tags">
                    ${skills.slice(0, 3).map(s => `<span class="skill-tag">${s.trim()}</span>`).join('')}
                    ${skills.length > 3 ? `<span class="skill-tag">+${skills.length - 3}</span>` : ''}
                </div>`;
            }

            // Process Links (The Feature You Requested)
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

            // Build Description
            let descHtml = formatTextWithEmojis(course.description);
            
            // Format Date
            const dateObj = new Date(course.completionDate);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            card.innerHTML = `
                <div class="cert-header">
                    <div class="cert-icon ${getPlatformClass(course.platform)}">
                        <i class="${getPlatformIcon(course.platform)}"></i>
                    </div>
                    <div class="cert-info">
                        <h3 class="cert-title">${course.courseName}</h3>
                        <p class="cert-platform">
                            <i class="fas fa-building" style="font-size: 0.8em;"></i> ${course.platform}
                        </p>
                    </div>
                </div>
                <div class="cert-body">
                    <div class="cert-meta">
                        <div class="cert-meta-item">
                            <i class="fas fa-calendar"></i> ${dateStr}
                        </div>
                        <div class="cert-meta-item">
                            <i class="fas fa-id-card"></i> ${course.id}
                        </div>
                    </div>
                    
                    <span class="cert-status ${course.status.toLowerCase().replace(' ', '-')}">
                        <i class="fas ${course.status === 'Verified' ? 'fa-check-circle' : 'fa-clock'}"></i>
                        ${course.status}
                    </span>

                    <div class="cert-desc">
                        ${descHtml}
                    </div>

                    ${skillsHtml}

                    ${linksHtml} <!-- Live Project Links Here -->

                    <button class="cert-link primary" onclick="window.open('${course.image}', '_blank')">
                        <i class="fas fa-eye"></i> View Certificate Image
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // 4. Update Stats
    function updateStats(courses) {
        const total = courses.length;
        const verified = courses.filter(c => c.status === 'Verified').length;
        const platforms = [...new Set(courses.map(c => c.platform))].length;

        animateValue("total-courses", total);
        animateValue("verified-count", verified);
        animateValue("platforms-count", platforms);

        const now = new Date();
        document.getElementById('last-updated').textContent = 
            now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function animateValue(id, end) {
        const obj = document.getElementById(id);
        if (!obj) return;
        let start = 0;
        const duration = 1500;
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            obj.innerHTML = Math.floor(progress * end);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end;
            }
        }
        window.requestAnimationFrame(step);
    }

    // 5. Filters
    window.filterCourses = function(status) {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');

        if (status === 'all') {
            displayCourses(allCourses);
        } else {
            const filtered = allCourses.filter(c => c.status === status);
            displayCourses(filtered);
        }
    };
});
