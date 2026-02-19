// State Management
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let currentEditId = null;

// DOM Elements
const elements = {
    notesGrid: document.getElementById('notesGrid'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    sortSelect: document.getElementById('sortSelect'),
    tagFilter: document.getElementById('tagFilter'),
    addNoteBtn: document.getElementById('addNoteBtn'),
    emptyAddBtn: document.getElementById('emptyAddBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    noteModal: document.getElementById('noteModal'),
    modalTitle: document.getElementById('modalTitle'),
    noteTitle: document.getElementById('noteTitle'),
    noteContent: document.getElementById('noteContent'),
    noteTags: document.getElementById('noteTags'),
    saveNoteBtn: document.getElementById('saveNoteBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    closeModal: document.getElementById('closeModal'),
    themeToggle: document.getElementById('themeToggle'),
    toast: document.getElementById('toast')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    renderNotes();
    updateTagFilter();
    attachEventListeners();
});

// Theme Management
function loadTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'light') {
        document.body.classList.add('light');
    }
}

function toggleTheme() {
    document.body.classList.toggle('light');
    const theme = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem('theme', theme);
}

// Event Listeners
function attachEventListeners() {
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.addNoteBtn.addEventListener('click', openAddModal);
    elements.emptyAddBtn.addEventListener('click', openAddModal);
    elements.clearAllBtn.addEventListener('click', clearAllNotes);
    elements.saveNoteBtn.addEventListener('click', saveNote);
    elements.cancelBtn.addEventListener('click', closeModal);
    elements.closeModal.addEventListener('click', closeModal);
    elements.searchInput.addEventListener('input', renderNotes);
    elements.sortSelect.addEventListener('change', renderNotes);
    elements.tagFilter.addEventListener('change', renderNotes);
    
    elements.noteModal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.noteModal.classList.contains('show')) {
            closeModal();
        }
    });
}

// Modal Functions
function openAddModal() {
    currentEditId = null;
    elements.modalTitle.textContent = 'Create New Note';
    elements.noteTitle.value = '';
    elements.noteContent.value = '';
    elements.noteTags.value = '';
    elements.noteModal.classList.add('show');
    elements.noteTitle.focus();
}

function openEditModal(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    currentEditId = id;
    elements.modalTitle.textContent = 'Edit Note';
    elements.noteTitle.value = note.title;
    elements.noteContent.value = note.content;
    elements.noteTags.value = note.tags.join(', ');
    elements.noteModal.classList.add('show');
    elements.noteTitle.focus();
}

function closeModal() {
    elements.noteModal.classList.remove('show');
    currentEditId = null;
}

// CRUD Operations
function saveNote() {
    const title = elements.noteTitle.value.trim();
    const content = elements.noteContent.value.trim();
    const tagsInput = elements.noteTags.value.trim();
    
    if (!title) {
        showToast('Please enter a title', 'error');
        elements.noteTitle.focus();
        return;
    }
    
    if (!content) {
        showToast('Please enter content', 'error');
        elements.noteContent.focus();
        return;
    }
    
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    if (currentEditId !== null) {
        const note = notes.find(n => n.id === currentEditId);
        if (note) {
            note.title = title;
            note.content = content;
            note.tags = tags;
            note.modified = Date.now();
            showToast('Note updated successfully', 'success');
        }
    } else {
        const newNote = {
            id: Date.now(),
            title,
            content,
            tags,
            created: Date.now(),
            modified: Date.now(),
            pinned: false
        };
        notes.unshift(newNote);
        showToast('Note created successfully', 'success');
    }
    
    saveToLocalStorage();
    renderNotes();
    updateTagFilter();
    closeModal();
}

function deleteNote(id) {
    const noteCard = document.querySelector(`[data-id="${id}"]`);
    if (noteCard) {
        noteCard.classList.add('deleting');
        setTimeout(() => {
            notes = notes.filter(n => n.id !== id);
            saveToLocalStorage();
            renderNotes();
            updateTagFilter();
            showToast('Note deleted', 'warning');
        }, 400);
    }
}

function togglePin(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        note.pinned = !note.pinned;
        note.modified = Date.now();
        saveToLocalStorage();
        renderNotes();
        showToast(note.pinned ? 'Note pinned to top' : 'Note unpinned', 'success');
    }
}

function clearAllNotes() {
    if (notes.length === 0) {
        showToast('No notes to clear', 'warning');
        return;
    }
    
    if (confirm('Are you sure you want to delete all notes? This action cannot be undone.')) {
        notes = [];
        saveToLocalStorage();
        renderNotes();
        updateTagFilter();
        showToast('All notes cleared', 'warning');
    }
}

// Render Functions
function renderNotes() {
    let filteredNotes = [...notes];
    
    // Apply search filter
    const searchTerm = elements.searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredNotes = filteredNotes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm) ||
            note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply tag filter
    const selectedTag = elements.tagFilter.value;
    if (selectedTag !== 'all') {
        filteredNotes = filteredNotes.filter(note => note.tags.includes(selectedTag));
    }
    
    // Apply sorting
    const sortBy = elements.sortSelect.value;
    filteredNotes.sort((a, b) => {
        if (sortBy === 'pinned') {
            if (a.pinned !== b.pinned) return b.pinned - a.pinned;
            return b.modified - a.modified;
        } else if (sortBy === 'created') {
            return b.created - a.created;
        } else {
            return b.modified - a.modified;
        }
    });
    
    // Display notes or empty state
    if (filteredNotes.length === 0) {
        elements.notesGrid.innerHTML = '';
        elements.emptyState.classList.add('show');
    } else {
        elements.emptyState.classList.remove('show');
        elements.notesGrid.innerHTML = filteredNotes.map(note => createNoteCard(note)).join('');
    }
}

function createNoteCard(note) {
    const createdDate = formatDate(note.created);
    const modifiedDate = formatDate(note.modified);
    
    return `
        <div class="note-card ${note.pinned ? 'pinned' : ''}" data-id="${note.id}">
            <div class="note-header">
                <h3 class="note-title">${escapeHtml(note.title)}</h3>
                <div class="note-actions">
                    <button class="icon-btn pin-btn ${note.pinned ? 'active' : ''}" onclick="togglePin(${note.id})" title="${note.pinned ? 'Unpin note' : 'Pin note'}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="${note.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M12 17v5"/>
                            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
                        </svg>
                    </button>
                    <button class="icon-btn edit-btn" onclick="openEditModal(${note.id})" title="Edit note">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete-btn" onclick="deleteNote(${note.id})" title="Delete note">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                </div>
            </div>
            <p class="note-content">${escapeHtml(note.content)}</p>
            ${note.tags.length > 0 ? `
                <div class="note-tags">
                    ${note.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="note-footer">
                <span>Created: ${createdDate}</span>
                <span>Modified: ${modifiedDate}</span>
            </div>
        </div>
    `;
}

// Tag Filter
function updateTagFilter() {
    const allTags = new Set();
    notes.forEach(note => {
        note.tags.forEach(tag => allTags.add(tag));
    });
    
    const currentValue = elements.tagFilter.value;
    elements.tagFilter.innerHTML = '<option value="all">All Tags</option>';
    
    [...allTags].sort().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        elements.tagFilter.appendChild(option);
    });
    
    if (allTags.has(currentValue)) {
        elements.tagFilter.value = currentValue;
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Local Storage
function saveToLocalStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
