    
    // Admin Panel JavaScript
let currentCourse = null;
let coursesData = [];

document.addEventListener('DOMContentLoaded', function() {
    loadCoursesFromStorage();
    setupEventListeners();
});

function loadCoursesFromStorage() {
    const saved = localStorage.getItem('certificatesData');
    if (saved) {
        coursesData = JSON.parse(saved);
        displayCourseList();
    } else {
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                coursesData = data;
                localStorage.setItem('certificatesData', JSON.stringify(data));
                displayCourseList();
            })
            .catch(error => {
                console.error('Error loading courses:', error);
                coursesData = [];
            });
    }
}

function displayCourseList() {
    const listContainer = document.getElementById('course-list');
    
    if (coursesData.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <i class="fas fa-book" style="font-size: 3em; color: #ddd;"></i>
                <p>No courses yet. Add your first course!</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = '';
    
    coursesData.sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate)).forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.onclick = () => loadCourseForEdit(course.id);
        
        card.innerHTML = `
            <div class="course-header">
                <span class="course-id">${course.id}</span>
                <span class="course-status status-${course.status.toLowerCase().replace(' ', '-')}">${course.status}</span>
            </div>
            <div class="course-title">${course.courseName}</div>
            <div class="course-meta">
                <i class="fas fa-university"></i> ${course.platform} • 
                <i class="fas fa-calendar"></i> ${course.completionDate}
            </div>
            ${course.projectLinks && course.projectLinks.length > 0 ? 
                `<div style="margin-top:5px; font-size:11px; color:#00C853;"><i class="fas fa-link"></i> ${course.projectLinks.length} Links Attached</div>` : ''}
            ${course.image ? `<img src="${course.image}" class="preview-image" alt="Preview">` : ''}
        `;
        listContainer.appendChild(card);
    });
}

function loadCourseForEdit(courseId) {
    const course = coursesData.find(c => c.id === courseId);
    if (!course) return;
    
    currentCourse = courseId;
    showSection('form');
    
    document.getElementById('courseId').value = course.id;
    document.getElementById('courseName').value = course.courseName;
    document.getElementById('platform').value = course.platform;
    document.getElementById('description').value = course.description;
    document.getElementById('overview').value = course.overview || '';
    document.getElementById('experience').value = course.experience || '';
    document.getElementById('skills').value = Array.isArray(course.skills) ? course.skills.join(', ') : (course.skills || '');
    document.getElementById('duration').value = course.duration || '';
    document.getElementById('courseStatus').value = course.status;
    
    // Load Links
    clearLinkInputs();
    if (course.projectLinks && Array.isArray(course.projectLinks)) {
        course.projectLinks.forEach((link, index) => {
            if (index < 3) {
                document.getElementById(`linkName${index + 1}`).value = link.name;
                document.getElementById(`linkUrl${index + 1}`).value = link.url;
            }
        });
    }

    const date = new Date(course.completionDate);
    document.getElementById('completionDate').value = date.toISOString().split('T')[0];
    document.getElementById('deleteBtn').style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveCourse() {
    if (!validateForm()) return;
    
    // Gather Links
    const links = [];
    for (let i = 1; i <= 3; i++) {
        const name = document.getElementById(`linkName${i}`).value.trim();
        const url = document.getElementById(`linkUrl${i}`).value.trim();
        if (name && url) {
            links.push({ name, url });
        }
    }

    const courseData = {
        id: document.getElementById('courseId').value,
        courseName: document.getElementById('courseName').value,
        platform: document.getElementById('platform').value,
        completionDate: formatDateForDisplay(document.getElementById('completionDate').value),
        image: `images/${document.getElementById('courseId').value}.png`,
        description: document.getElementById('description').value,
        overview: document.getElementById('overview').value,
        experience: document.getElementById('experience').value,
        skills: document.getElementById('skills').value.split(',').map(s => s.trim()).filter(s => s),
        duration: document.getElementById('duration').value,
        status: document.getElementById('courseStatus').value,
        projectLinks: links // Added links array
    };
    
    if (currentCourse) {
        const index = coursesData.findIndex(c => c.id === currentCourse);
        coursesData[index] = courseData;
    } else {
        coursesData.push(courseData);
        currentCourse = courseData.id;
    }
    
    localStorage.setItem('certificatesData', JSON.stringify(coursesData));
    displayCourseList();
    alert(`Course "${courseData.courseName}" saved successfully!`);
    
    if (!currentCourse) clearForm();
}

function deleteCourse() {
    if (!currentCourse || !confirm('Are you sure you want to delete this course?')) return;
    coursesData = coursesData.filter(c => c.id !== currentCourse);
    localStorage.setItem('certificatesData', JSON.stringify(coursesData));
    displayCourseList();
    clearForm();
    alert('Course deleted successfully!');
}

function clearForm() {
    document.getElementById('courseForm').reset();
    document.getElementById('deleteBtn').style.display = 'none';
    document.getElementById('previewImg').style.display = 'none';
    currentCourse = null;
    clearLinkInputs();
    const nextNum = coursesData.length + 1;
    document.getElementById('courseId').value = `DL-${String(nextNum).padStart(3, '0')}`;
    document.getElementById('completionDate').valueAsDate = new Date();
}

function clearLinkInputs() {
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`linkName${i}`).value = '';
        document.getElementById(`linkUrl${i}`).value = '';
    }
}

function validateForm() {
    const required = ['courseId', 'courseName', 'platform', 'completionDate', 'description'];
    for (let field of required) {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            alert(`Please fill in the ${field.replace('course', '').toLowerCase()} field`);
            element.focus();
            return false;
        }
    }
    return true;
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function exportJSON() {
    const dataStr = JSON.stringify(coursesData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'data.json';
    link.click();
    alert('data.json downloaded! Upload this to your GitHub repository.');
}

function copyToClipboard() {
    const dataStr = JSON.stringify(coursesData, null, 2);
    navigator.clipboard.writeText(dataStr).then(() => alert('JSON copied to clipboard!')).catch(err => console.error('Copy failed:', err));
}

function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('previewImg');
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function addEmoji(emoji) {
    const overview = document.getElementById('overview');
    const start = overview.selectionStart;
    const end = overview.selectionEnd;
    overview.value = overview.value.substring(0, start) + emoji + overview.value.substring(end);
    overview.focus();
    overview.selectionStart = overview.selectionEnd = start + emoji.length;
}

function autoFormatOverview() {
    const overview = document.getElementById('overview');
    const text = overview.value;
    let formatted = text;
    if (!text.match(/^🎯/)) formatted = '🎯 **Course Overview**\n\n' + formatted;
    formatted = formatted.replace(/^\s*[-*•]\s*/gm, '• ');
    formatted = formatted.replace(/^(What I learned|Key Takeaways|Skills Gained|Projects|Conclusion):/gmi, '📚 **$1:**');
    formatted = formatted.replace(/^(Challenges|Difficulties):/gmi, '⚡ **$1:**');
    formatted = formatted.replace(/^(Next Steps|Future Plans):/gmi, '🚀 **$1:**');
    overview.value = formatted;
}

function showSection(sectionId) {
    document.querySelectorAll('.form-section').forEach(section => section.style.display = 'none');
    document.getElementById(`${sectionId}-section`).style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const navItems = document.querySelectorAll('.nav-item');
    const sectionMap = { 'courses': 0, 'form': 1, 'export': 2, 'help': 4 };
    if (sectionMap[sectionId] !== undefined) navItems[sectionMap[sectionId]].classList.add('active');
    if (sectionId === 'form' && !currentCourse) clearForm();
}

function setupEventListeners() {
    document.getElementById('overview').addEventListener('blur', autoFormatOverview);
}
