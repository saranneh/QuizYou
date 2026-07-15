import { appState } from './state.js';
import { navigateTo } from './navigation.js';

const BACKEND_URL = '';

function getHeaders() {
  const token = localStorage.getItem('quizyou_jwt');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Tab Switching Logic
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.admin-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => {
        c.style.display = 'none';
        c.classList.remove('active');
      });

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.style.display = 'block';
        targetContent.classList.add('active');
      }
    });
  });
}

// Data Fetching
async function fetchAdminData() {
  try {
    const [coursesRes, usersRes, sectionsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/courses`, { headers: getHeaders() }),
      fetch(`${BACKEND_URL}/api/users`, { headers: getHeaders() }),
      fetch(`${BACKEND_URL}/api/sections`, { headers: getHeaders() })
    ]);

    const courses = await coursesRes.json();
    const users = await usersRes.json();
    const sections = await sectionsRes.json();

    return { courses, users, sections };
  } catch (err) {
    console.error("Error fetching admin data:", err);
    return { courses: [], users: [], sections: [] };
  }
}

function renderCoursesList(courses) {
  const list = document.getElementById('admin-courses-list');
  list.innerHTML = '';
  courses.forEach(c => {
    // Only render actual courses, not the mapped sections for students
    if (c.sectionCode && c.sectionCode !== 'All Sections') return;
    
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.padding = '0.5rem';
    div.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
    
    div.innerHTML = `
      <span><strong>${c.code}</strong> - ${c.name}</span>
      <button class="btn btn-tertiary btn-delete-course" data-id="${c._id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: #ff6b6b; border-color: #ff6b6b;">Delete</button>
    `;
    list.appendChild(div);
  });

  document.querySelectorAll('.btn-delete-course').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (confirm('Are you sure you want to delete this course and all its sections/quizzes?')) {
        await deleteCourse(e.target.getAttribute('data-id'));
      }
    });
  });
}

function renderUsersList(users) {
  const list = document.getElementById('admin-users-list');
  list.innerHTML = '';
  users.forEach(u => {
    const div = document.createElement('div');
    div.className = 'user-list-item';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.padding = '0.5rem';
    div.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
    
    div.innerHTML = `
      <span><strong>${u.id}</strong> (${u.role}): ${u.firstName} ${u.lastName} - ${u.email}</span>
      ${u.id !== appState.currentUser.id ? `<button class="btn btn-tertiary btn-delete-user" data-id="${u._id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: #ff6b6b; border-color: #ff6b6b;">Delete</button>` : ''}
    `;
    list.appendChild(div);
  });

  document.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (confirm('Are you sure you want to delete this user?')) {
        await deleteUser(e.target.getAttribute('data-id'));
      }
    });
  });
}

function populateRosterDropdowns(courses, users, sections) {
  const courseDropdown = document.getElementById('roster-course');
  const profDropdown = document.getElementById('roster-prof');
  const sectionDropdown = document.getElementById('enroll-section');
  const studentCheckboxesContainer = document.getElementById('enroll-students-checkboxes');

  // Courses
  courseDropdown.innerHTML = '<option value="">Select Course</option>';
  // Filter out the mapped section courses
  const uniqueCourses = courses.filter(c => !c.sectionCode || c.sectionCode === 'All Sections');
  uniqueCourses.forEach(c => {
    courseDropdown.innerHTML += `<option value="${c._id}">${c.code} - ${c.name}</option>`;
  });

  // Professors
  profDropdown.innerHTML = '<option value="">Select Professor</option>';
  const professors = users.filter(u => u.role === 'professor');
  professors.forEach(p => {
    profDropdown.innerHTML += `<option value="${p._id}">${p.firstName} ${p.lastName} (${p.id})</option>`;
  });

  // Sections
  sectionDropdown.innerHTML = '<option value="">Select Section</option>';
  sections.forEach(s => {
    if (s.course) {
        sectionDropdown.innerHTML += `<option value="${s._id}">${s.course.code} - ${s.sectionCode} (${s.semester})</option>`;
    }
  });

  // Students Checkboxes
  studentCheckboxesContainer.innerHTML = '';
  const students = users.filter(u => u.role === 'student');
  students.forEach(s => {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '0.25rem';
    wrapper.innerHTML = `
      <label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem; margin: 0;">
        <input type="checkbox" class="student-checkbox" value="${s._id}">
        ${s.firstName} ${s.lastName} (${s.id})
      </label>
    `;
    studentCheckboxesContainer.appendChild(wrapper);
  });
}

export async function initAdminManagement() {
  setupTabs();

  const data = await fetchAdminData();
  renderCoursesList(data.courses);
  renderUsersList(data.users);
  populateRosterDropdowns(data.courses, data.users, data.sections);

  // Setup Back Button
  document.getElementById('btn-admin-management-back').onclick = () => {
    navigateTo('config');
  };

  // Setup User Search
  document.getElementById('admin-user-search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.user-list-item');
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(term) ? 'flex' : 'none';
    });
  });
}

// API Calls
async function deleteCourse(id) {
  const res = await fetch(`${BACKEND_URL}/api/courses/${id}`, { method: 'DELETE', headers: getHeaders() });
  if (res.ok) {
    alert("Course deleted successfully.");
    initAdminManagement();
  } else {
    alert("Error deleting course.");
  }
}

async function deleteUser(id) {
  const res = await fetch(`${BACKEND_URL}/api/users/${id}`, { method: 'DELETE', headers: getHeaders() });
  if (res.ok) {
    alert("User deleted successfully.");
    initAdminManagement();
  } else {
    alert("Error deleting user.");
  }
}

// Form Handlers
export function setupAdminManagementHandlers() {
  // Course Form
  document.getElementById('admin-course-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      code: document.getElementById('course-code').value,
      name: document.getElementById('course-name').value,
      description: document.getElementById('course-desc').value
    };
    
    const res = await fetch(`${BACKEND_URL}/api/courses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      alert("Course created successfully!");
      document.getElementById('admin-course-form').reset();
      initAdminManagement();
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  });

  // User Form
  document.getElementById('admin-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      id: document.getElementById('add-user-id').value,
      firstName: document.getElementById('add-user-firstname').value,
      lastName: document.getElementById('add-user-lastname').value,
      email: document.getElementById('add-user-email').value,
      password: document.getElementById('add-user-password').value,
      role: document.getElementById('add-user-role').value
    };
    
    const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      alert("User created successfully!");
      document.getElementById('admin-user-form').reset();
      initAdminManagement();
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  });

  // Section Form
  document.getElementById('admin-section-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      course: document.getElementById('roster-course').value,
      professor: document.getElementById('roster-prof').value,
      sectionCode: document.getElementById('roster-section-code').value,
      semester: document.getElementById('roster-semester').value
    };
    
    const res = await fetch(`${BACKEND_URL}/api/sections`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      alert("Section created successfully!");
      document.getElementById('admin-section-form').reset();
      initAdminManagement();
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  });

  // Enroll Form
  document.getElementById('admin-enroll-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const sectionId = document.getElementById('enroll-section').value;
    
    // Get checked checkboxes
    const checkboxes = document.querySelectorAll('.student-checkbox:checked');
    const studentIds = Array.from(checkboxes).map(cb => cb.value);
    
    if (studentIds.length === 0) {
      alert("Please select at least one student.");
      return;
    }
    
    const res = await fetch(`${BACKEND_URL}/api/sections/${sectionId}/enroll`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ studentIds })
    });
    
    if (res.ok) {
      alert("Students enrolled successfully!");
      initAdminManagement();
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  });
}
