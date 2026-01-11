// Admin Panel JavaScript
let currentCourse = null;
let coursesData = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadCoursesFromStorage();
    setupEventListeners();
});

// Load courses from localStorage or data.json
function loadCoursesFromStorage() {
    const saved = localStorage.getItem('certificatesData');
    if (saved) {
        coursesData = JSON.parse(saved);
        displayCourseList();
    } else {
        // Try to load from data.json
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

// Display course list
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
    
    coursesData.sort((a, b) => {
        // Sort by date (newest first)
        return new Date(b.completionDate) - new Date(a.completionDate);
    }).forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.onclick = () => loadCourseForEdit(course.id);
        
        const skills = Array.isArray(course.skills) ? 
            course.skills.slice(0, 3).map(s => s.trim()) : [];
        
        card.innerHTML = `
            <div class="course-header">
                <span class="course-id">${course.id}</span>
                <span class="course-status status-${course.status.toLowerCase().replace(' ', '-')}">
                    ${course.status}
                </span>
            </div>
            <div class="course-title">${course.courseName}</div>
            <div class="course-meta">
                <i class="fas fa-university"></i> ${course.platform} • 
                <i class="fas fa-calendar"></i> ${course.completionDate}
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 10px;">
                ${course.description.substring(0, 80)}...
            </div>
            ${course.image ? `<img src="${course.image}" class="preview-image" alt="Preview">` : ''}
        `;
        
        listContainer.appendChild(card);
    });
}

// Load course for editing
function loadCourseForEdit(courseId) {
    const course = coursesData.find(c => c.id === courseId);
    if (!course) return;
    
    currentCourse = courseId;
    
    // Show form section
    showSection('form');
    
    // Fill form
    document.getElementById('courseId').value = course.id;
    document.getElementById('courseName').value = course.courseName;
    document.getElementById('platform').value = course.platform;
    document.getElementById('description').value = course.description;
    document.getElementById('overview').value = course.overview || '';
    document.getElementById('experience').value = course.experience || '';
    document.getElementById('skills').value = Array.isArray(course.skills) ? 
        course.skills.join(', ') : (course.skills || '');
    document.getElementById('duration').value = course.duration || '';
    document.getElementById('courseStatus').value = course.status;
    
    // Format and set date
    const date = new Date(course.completionDate);
    document.getElementById('completionDate').value = date.toISOString().split('T')[0];
    
    // Show delete button
    document.getElementById('deleteBtn').style.display = 'inline-block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Save course
function saveCourse() {
    if (!validateForm()) return;
    
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
        status: document.getElementById('courseStatus').value
    };
    
    if (currentCourse) {
        // Update existing course
        const index = coursesData.findIndex(c => c.id === currentCourse);
        coursesData[index] = courseData;
    } else {
        // Add new course
        coursesData.push(courseData);
        currentCourse = courseData.id;
    }
    
    // Save to localStorage
    localStorage.setItem('certificatesData', JSON.stringify(coursesData));
    
    // Update display
    displayCourseList();
    
    // Show success message
    alert(`Course "${courseData.courseName}" saved successfully!`);
    
    // Clear form if new course
    if (!currentCourse) {
        clearForm();
    }
}

// Delete course
function deleteCourse() {
    if (!currentCourse || !confirm('Are you sure you want to delete this course?')) return;
    
    coursesData = coursesData.filter(c => c.id !== currentCourse);
    localStorage.setItem('certificatesData', JSON.stringify(coursesData));
    
    displayCourseList();
    clearForm();
    alert('Course deleted successfully!');
}

// Clear form
function clearForm() {
    document.getElementById('courseForm').reset();
    document.getElementById('deleteBtn').style.display = 'none';
    document.getElementById('previewImg').style.display = 'none';
    currentCourse = null;
    
    // Generate next ID
    const nextNum = coursesData.length + 1;
    document.getElementById('courseId').value = `DL-${String(nextNum).padStart(3, '0')}`;
    document.getElementById('completionDate').valueAsDate = new Date();
}

// Validate form
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

// Format date
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Export JSON
function exportJSON() {
    const dataStr = JSON.stringify(coursesData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'data.json';
    link.click();
    
    alert('data.json downloaded! Upload this to your GitHub repository.');
}

// Copy to clipboard
function copyToClipboard() {
    const dataStr = JSON.stringify(coursesData, null, 2);
    
    navigator.clipboard.writeText(dataStr)
        .then(() => alert('JSON copied to clipboard!'))
        .catch(err => console.error('Copy failed:', err));
}

// Image preview
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

// Add emoji to overview
function addEmoji(emoji) {
    const overview = document.getElementById('overview');
    const start = overview.selectionStart;
    const end = overview.selectionEnd;
    
    overview.value = overview.value.substring(0, start) + 
                    emoji + 
                    overview.value.substring(end);
    
    overview.focus();
    overview.selectionStart = overview.selectionEnd = start + emoji.length;
}

// Format overview text automatically
function autoFormatOverview() {
    const overview = document.getElementById('overview');
    const text = overview.value;
    
    // Formatting rules
    let formatted = text;
    
    // Add Course Overview heading if missing
    if (!text.match(/^🎯/)) {
        formatted = '🎯 **Course Overview**\n\n' + formatted;
    }
    
    // Format bullet points
    formatted = formatted.replace(/^\s*[-*•]\s*/gm, '• ');
    
    // Format section headers
    formatted = formatted.replace(/^(What I learned|Key Takeaways|Skills Gained|Projects|Conclusion):/gmi, '📚 **$1:**');
    formatted = formatted.replace(/^(Challenges|Difficulties):/gmi, '⚡ **$1:**');
    formatted = formatted.replace(/^(Next Steps|Future Plans):/gmi, '🚀 **$1:**');
    
    overview.value = formatted;
}

// Show/hide sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(`${sectionId}-section`).style.display = 'block';
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and activate corresponding nav item
    const navItems = document.querySelectorAll('.nav-item');
    const sectionMap = {
        'courses': 0,
        'form': 1,
        'export': 2,
        'help': 4
    };
    
    if (sectionMap[sectionId] !== undefined) {
        navItems[sectionMap[sectionId]].classList.add('active');
    }
    
    // If showing form and no current course, clear it
    if (sectionId === 'form' && !currentCourse) {
        clearForm();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Auto-save on form changes (optional)
    // const formElements = document.querySelectorAll('#courseForm input, #courseForm textarea');
    // formElements.forEach(el => {
    //     el.addEventListener('input', () => {
    //         // Auto-save logic here
    //     });
    // });
    
    // Auto-format overview on blur
    document.getElementById('overview').addEventListener('blur', autoFormatOverview);
        }
