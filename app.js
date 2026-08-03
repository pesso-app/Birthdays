// ============================================
// BIRTHDAYS APP - REFACTORIZADO v2.1
// ============================================

const CONFIG = {
    DB_NAME: 'BirthdayDB',
    DB_VERSION: 3,
    STORE_PEOPLE: 'people',
    STORE_SETTINGS: 'settings',
    SPLASH_DURATION: 2500
};

// ============================================
// HAPTIC FEEDBACK
// ============================================

const haptic = {
    trigger(style = 'light') {
        if ('vibrate' in navigator) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30],
                success: [10, 50, 10],
                error: [30, 30, 30],
                delete: [20, 40, 20]
            };
            navigator.vibrate(patterns[style] || patterns.light);
        }
    },

    init() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-haptic]');
            if (btn) {
                this.trigger(btn.dataset.haptic);
            }
        });
    }
};

// ============================================
// SPLASH SCREEN - SIN ANIMACIÓN
// ============================================

const splash = {
    show() {
        const el = document.getElementById('splashScreen');
        if (el) el.classList.remove('hidden');
    },

    hide() {
        const el = document.getElementById('splashScreen');
        if (el) {
            el.classList.add('hidden');
            setTimeout(() => el.style.display = 'none', 600);
        }
    },

    init() {
        this.show();
        setTimeout(() => this.hide(), CONFIG.SPLASH_DURATION);
    }
};

// ============================================
// BASE DE DATOS - CON MANEJO DE ERRORES
// ============================================

class Database {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

            request.onerror = () => {
                console.error('Error abriendo IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.db.onerror = (event) => {
                    console.error('Error en IndexedDB:', event.target.error);
                };
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(CONFIG.STORE_PEOPLE)) {
                    db.createObjectStore(CONFIG.STORE_PEOPLE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(CONFIG.STORE_SETTINGS)) {
                    db.createObjectStore(CONFIG.STORE_SETTINGS, { keyPath: 'key' });
                }
            };
        });
    }

    async savePerson(person) {
        return this._put(CONFIG.STORE_PEOPLE, person);
    }

    async deletePerson(id) {
        return this._delete(CONFIG.STORE_PEOPLE, id);
    }

    async getAllPeople() {
        return this._getAll(CONFIG.STORE_PEOPLE);
    }

    async saveSetting(key, value) {
        return this._put(CONFIG.STORE_SETTINGS, { key, value, timestamp: Date.now() });
    }

    async getSetting(key, defaultValue = null) {
        try {
            const result = await this._get(CONFIG.STORE_SETTINGS, key);
            return result ? result.value : defaultValue;
        } catch (e) {
            console.error('Error leyendo setting:', e);
            return defaultValue;
        }
    }

    _put(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
            tx.onerror = () => reject(tx.error);
        });
    }

    _delete(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    _get(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    _getAll(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }
}

// ============================================
// UTILIDADES - CORREGIDAS PARA TIMEZONE
// ============================================

const utils = {
    zodiacSigns: [
        { name: 'Capricornio', symbol: '♑', start: [1, 1], end: [1, 19] },
        { name: 'Acuario', symbol: '♒', start: [1, 20], end: [2, 18] },
        { name: 'Piscis', symbol: '♓', start: [2, 19], end: [3, 20] },
        { name: 'Aries', symbol: '♈', start: [3, 21], end: [4, 19] },
        { name: 'Tauro', symbol: '♉', start: [4, 20], end: [5, 20] },
        { name: 'Géminis', symbol: '♊', start: [5, 21], end: [6, 20] },
        { name: 'Cáncer', symbol: '♋', start: [6, 21], end: [7, 22] },
        { name: 'Leo', symbol: '♌', start: [7, 23], end: [8, 22] },
        { name: 'Virgo', symbol: '♍', start: [8, 23], end: [9, 22] },
        { name: 'Libra', symbol: '♎', start: [9, 23], end: [10, 22] },
        { name: 'Escorpio', symbol: '♏', start: [10, 23], end: [11, 21] },
        { name: 'Sagitario', symbol: '♐', start: [11, 22], end: [12, 21] },
        { name: 'Capricornio', symbol: '♑', start: [12, 22], end: [12, 31] }
    ],

    parseLocalDate(dateStr) {
        if (!dateStr) return new Date();
        const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
        return new Date(dateStr);
    },

    getZodiac(date) {
        const m = date.getMonth() + 1, d = date.getDate();
        for (let z of this.zodiacSigns) {
            if (z.start[0] === z.end[0]) {
                if (m === z.start[0] && d >= z.start[1] && d <= z.end[1]) return z;
            } else {
                if ((m === z.start[0] && d >= z.start[1]) || (m === z.end[0] && d <= z.end[1])) return z;
            }
        }
        return this.zodiacSigns[0];
    },

    calculateAge(birthDate) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    },

    getDaysUntil(birthDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentYear = today.getFullYear();
        let next = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        next.setHours(0, 0, 0, 0);

        if (next < today) {
            next.setFullYear(currentYear + 1);
        }

        const diffMs = next - today;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0 && next.getDate() === today.getDate() && next.getMonth() === today.getMonth()) {
            return 0;
        }

        return diffDays;
    },

    getNextBirthdayDate(birthDate) {
        const today = new Date();
        const currentYear = today.getFullYear();
        let next = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        next.setHours(0, 0, 0, 0);

        if (next < today) {
            next.setFullYear(currentYear + 1);
        }
        return next;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    formatDate(date) {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    },

    categoryIcons: {
        family: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>',
        friends: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
        work: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
        other: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>'
    }
};

// ============================================
// SWIPE TO DELETE - CORREGIDO
// ============================================

class SwipeToDelete {
    static activeInstance = null;

    constructor(element, onDelete) {
        this.element = element;
        this.onDelete = onDelete;
        this.startX = 0;
        this.currentX = 0;
        this.isSwiping = false;
        this.hasMoved = false;
        this.threshold = 80;

        this.init();
    }

    init() {
        this.element.addEventListener('touchstart', (e) => {
            if (SwipeToDelete.activeInstance && SwipeToDelete.activeInstance !== this) {
                SwipeToDelete.activeInstance.reset();
            }
            SwipeToDelete.activeInstance = this;
            this.startX = e.touches[0].clientX;
            this.isSwiping = true;
            this.hasMoved = false;
        }, { passive: true });

        this.element.addEventListener('touchmove', (e) => {
            if (!this.isSwiping) return;

            this.currentX = e.touches[0].clientX;
            const diff = this.startX - this.currentX;

            // Solo permitir swipe hacia la izquierda
            if (diff > 10) {
                this.hasMoved = true;
            }

            if (diff > 0 && diff < this.threshold * 2) {
                this.element.style.transform = `translateX(-${Math.min(diff, this.threshold)}px)`;
            }
        }, { passive: true });

        this.element.addEventListener('touchend', () => {
            if (!this.isSwiping) return;

            const diff = this.startX - this.currentX;

            // Solo activar si hubo movimiento significativo (swipe real)
            if (diff > this.threshold && this.hasMoved) {
                this.element.classList.add('swiped');
                this.element.style.transform = '';
                haptic.trigger('medium');

                // Agregar botón de delete si no existe
                if (!this.element.querySelector('.swipe-delete')) {
                    const deleteBtn = document.createElement('div');
                    deleteBtn.className = 'swipe-delete';
                    deleteBtn.innerHTML = 'Eliminar';
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        haptic.trigger('delete');
                        if (confirm('¿Eliminar este cumpleaños?')) {
                            this.onDelete();
                        } else {
                            this.reset();
                        }
                    });
                    this.element.appendChild(deleteBtn);
                }
            } else {
                this.reset();
            }

            this.isSwiping = false;
            this.hasMoved = false;
            this.startX = 0;
            this.currentX = 0;
        });

        // Prevenir que el click normal active el swipe
        this.element.addEventListener('click', (e) => {
            if (this.element.classList.contains('swiped')) {
                e.stopPropagation();
                this.reset();
            }
        });
    }

    reset() {
        this.element.classList.remove('swiped');
        this.element.style.transform = '';
        const deleteBtn = this.element.querySelector('.swipe-delete');
        if (deleteBtn) deleteBtn.remove();
        if (SwipeToDelete.activeInstance === this) {
            SwipeToDelete.activeInstance = null;
        }
    }
}

// ============================================
// UI CONTROLLER
// ============================================

class UIController {
    constructor(app) {
        this.app = app;
        this.currentFilter = 'all';
        this.editingId = null;
        this.swipeInstances = [];
        this.selectedReminderDays = 1;
        this.notificationsEnabled = false;
    }

    async init() {
        await this.loadTheme();
        this.updateSegmentIndicator();
        this.render();
        this.checkTodayBirthdays();
        this.loadSettings();
    }

    async loadTheme() {
        try {
            const isDark = await this.app.db.getSetting('darkMode', false);
            if (isDark) {
                document.documentElement.setAttribute('data-theme', 'dark');
                document.getElementById('moonIcon')?.classList.add('hidden');
                document.getElementById('sunIcon')?.classList.remove('hidden');
            }
        } catch (e) {
            console.error('Error cargando tema:', e);
        }
    }

    async toggleDarkMode() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newMode = isDark ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newMode);
        await this.app.db.saveSetting('darkMode', !isDark);

        const moon = document.getElementById('moonIcon');
        const sun = document.getElementById('sunIcon');
        if (moon && sun) {
            moon.classList.toggle('hidden', !isDark);
            sun.classList.toggle('hidden', isDark);
        }

        // Actualizar toggle en settings
        const toggle = document.getElementById('darkModeToggle');
        const value = document.getElementById('darkModeValue');
        if (toggle) toggle.classList.toggle('active', !isDark);
        if (value) value.textContent = !isDark ? 'Activado' : 'Desactivado';

        this.showToast(newMode === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado');
    }

    // SETTINGS
    async loadSettings() {
        try {
            const isDark = await this.app.db.getSetting('darkMode', false);
            const notifEnabled = await this.app.db.getSetting('notifications', false);
            const reminderDays = await this.app.db.getSetting('reminderDays', 1);

            this.notificationsEnabled = notifEnabled;
            this.selectedReminderDays = reminderDays;

            // Actualizar UI de settings
            const darkToggle = document.getElementById('darkModeToggle');
            const darkValue = document.getElementById('darkModeValue');
            if (darkToggle) darkToggle.classList.toggle('active', isDark);
            if (darkValue) darkValue.textContent = isDark ? 'Activado' : 'Desactivado';

            const notifToggle = document.getElementById('notifToggle');
            const notifValue = document.getElementById('notifValue');
            if (notifToggle) notifToggle.classList.toggle('active', notifEnabled);
            if (notifValue) notifValue.textContent = notifEnabled ? 'Activadas' : 'Desactivadas';

            const remindersValue = document.getElementById('remindersValue');
            if (remindersValue) {
                const labels = { 0: 'El mismo día', 1: '1 día antes', 3: '3 días antes', 7: '1 semana antes', 14: '2 semanas antes' };
                remindersValue.textContent = labels[reminderDays] || '1 día antes';
            }
        } catch (e) {
            console.error('Error cargando settings:', e);
        }
    }

    showSettings() {
        document.getElementById('settingsModal')?.classList.remove('hidden');
        haptic.trigger('light');
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        const sheet = modal?.querySelector('.sheet-ios');

        if (sheet) {
            sheet.classList.add('closing');
            setTimeout(() => {
                modal?.classList.add('hidden');
                sheet.classList.remove('closing');
            }, 400);
        } else {
            modal?.classList.add('hidden');
        }
    }

    async toggleNotifications() {
        if (!('Notification' in window)) {
            this.showToast('Notificaciones no soportadas en este navegador');
            return;
        }

        if (this.notificationsEnabled) {
            this.notificationsEnabled = false;
            await this.app.db.saveSetting('notifications', false);
            this.showToast('Notificaciones desactivadas');
        } else {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.notificationsEnabled = true;
                await this.app.db.saveSetting('notifications', true);

                // Enviar notificación de prueba nativa
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'SHOW_NOTIFICATION',
                        title: 'Birthdays',
                        body: '¡Notificaciones activadas! Recibirás alertas nativas de iOS.',
                        icon: 'assets/icons/icon-192x192.png'
                    });
                }

                this.showToast('Notificaciones activadas');
            } else {
                this.showToast('Permiso denegado. Ve a Ajustes de iOS > Notificaciones > Birthdays');
                return;
            }
        }

        const toggle = document.getElementById('notifToggle');
        const value = document.getElementById('notifValue');
        if (toggle) toggle.classList.toggle('active', this.notificationsEnabled);
        if (value) value.textContent = this.notificationsEnabled ? 'Activadas' : 'Desactivadas';

        haptic.trigger('medium');
    }

    showRemindersModal() {
        document.getElementById('remindersModal')?.classList.remove('hidden');

        // Marcar la opción seleccionada
        document.querySelectorAll('.reminder-option').forEach(opt => {
            const check = opt.querySelector('.reminder-check');
            const days = parseInt(opt.dataset.days);
            if (days === this.selectedReminderDays) {
                check?.classList.remove('hidden');
            } else {
                check?.classList.add('hidden');
            }
        });

        haptic.trigger('light');
    }

    closeRemindersModal() {
        const modal = document.getElementById('remindersModal');
        const sheet = modal?.querySelector('.sheet-ios');

        if (sheet) {
            sheet.classList.add('closing');
            setTimeout(() => {
                modal?.classList.add('hidden');
                sheet.classList.remove('closing');
            }, 400);
        } else {
            modal?.classList.add('hidden');
        }
    }

    selectReminder(element) {
        document.querySelectorAll('.reminder-option .reminder-check').forEach(c => c.classList.add('hidden'));
        element.querySelector('.reminder-check')?.classList.remove('hidden');
        this.selectedReminderDays = parseInt(element.dataset.days);
        haptic.trigger('light');
    }

    async saveReminders() {
        await this.app.db.saveSetting('reminderDays', this.selectedReminderDays);

        const labels = { 0: 'El mismo día', 1: '1 día antes', 3: '3 días antes', 7: '1 semana antes', 14: '2 semanas antes' };
        const remindersValue = document.getElementById('remindersValue');
        if (remindersValue) remindersValue.textContent = labels[this.selectedReminderDays];

        this.closeRemindersModal();
        this.showToast('Recordatorios actualizados');
        haptic.trigger('success');
    }

    async backupData() {
        try {
            const data = {
                people: this.app.people,
                settings: {
                    darkMode: await this.app.db.getSetting('darkMode', false),
                    notifications: await this.app.db.getSetting('notifications', false),
                    reminderDays: await this.app.db.getSetting('reminderDays', 1)
                },
                exportedAt: new Date().toISOString(),
                version: '2.0.0'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `birthday-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('Backup descargado');
            haptic.trigger('success');
        } catch (e) {
            console.error('Error en backup:', e);
            this.showToast('Error al hacer backup');
        }
    }

    async restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                if (!data.people || !Array.isArray(data.people)) {
                    throw new Error('Formato inválido');
                }

                if (confirm(`¿Restaurar ${data.people.length} contactos? Esto reemplazará los datos actuales.`)) {
                    // Limpiar datos actuales
                    for (const person of this.app.people) {
                        await this.app.db.deletePerson(person.id);
                    }

                    // Restaurar nuevos datos
                    for (const person of data.people) {
                        await this.app.db.savePerson(person);
                    }

                    // Restaurar settings
                    if (data.settings) {
                        if (data.settings.darkMode !== undefined) {
                            await this.app.db.saveSetting('darkMode', data.settings.darkMode);
                        }
                        if (data.settings.notifications !== undefined) {
                            await this.app.db.saveSetting('notifications', data.settings.notifications);
                        }
                        if (data.settings.reminderDays !== undefined) {
                            await this.app.db.saveSetting('reminderDays', data.settings.reminderDays);
                        }
                    }

                    await this.app.loadData();
                    this.render();
                    this.loadSettings();
                    this.showToast('Datos restaurados');
                    haptic.trigger('success');
                }
            } catch (err) {
                console.error('Error restaurando:', err);
                this.showToast('Error al restaurar backup');
            }
        };

        input.click();
    }

    // Segment indicator animation
    updateSegmentIndicator() {
        const indicator = document.getElementById('segmentIndicator');
        const activeBtn = document.querySelector('.segment-btn.active');

        if (indicator && activeBtn) {
            const parent = activeBtn.parentElement;
            const parentRect = parent.getBoundingClientRect();
            const btnRect = activeBtn.getBoundingClientRect();

            indicator.style.width = `${btnRect.width}px`;
            indicator.style.left = `${btnRect.left - parentRect.left}px`;
        }
    }

    // Renderizado principal
    render(searchTerm = '') {
        const list = document.getElementById('birthdaysList');
        const empty = document.getElementById('emptyState');
        const todaySection = document.getElementById('todaySection');
        const skeleton = document.getElementById('skeletonLoading');

        if (!list) return;

        if (skeleton) skeleton.classList.add('hidden');

        list.innerHTML = '';
        this.swipeInstances = [];

        let filtered = this.app.people.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (this.currentFilter !== 'all') {
            if (this.currentFilter === 'upcoming') {
                filtered = filtered.filter(p => utils.getDaysUntil(utils.parseLocalDate(p.birthDate)) <= 30);
            } else {
                filtered = filtered.filter(p => p.category === this.currentFilter);
            }
        }

        const today = new Date();
        const todayBirthdays = filtered.filter(p => utils.getDaysUntil(utils.parseLocalDate(p.birthDate)) === 0);
        const upcoming = filtered.filter(p => utils.getDaysUntil(utils.parseLocalDate(p.birthDate)) > 0)
            .sort((a, b) => utils.getDaysUntil(utils.parseLocalDate(a.birthDate)) - utils.getDaysUntil(utils.parseLocalDate(b.birthDate)));

        if (todaySection) {
            todaySection.classList.toggle('hidden', todayBirthdays.length === 0);
            const todayNames = document.getElementById('todayNames');
            if (todayNames && todayBirthdays.length > 0) {
                todayNames.textContent = todayBirthdays.map(p => p.name).join(' y ');
            }
        }

        if (upcoming.length === 0 && todayBirthdays.length === 0) {
            list.innerHTML = '';
            empty?.classList.remove('hidden');
            return;
        }

        empty?.classList.add('hidden');

        const toRender = [...todayBirthdays, ...upcoming];

        toRender.forEach(p => {
            const birthDate = utils.parseLocalDate(p.birthDate);
            const days = utils.getDaysUntil(birthDate);
            const age = utils.calculateAge(birthDate);
            const nextAge = days === 0 ? age : age + 1;
            const zodiac = utils.getZodiac(birthDate);
            const categoryIcon = utils.categoryIcons[p.category] || utils.categoryIcons.other;

            const item = document.createElement('div');
            item.className = 'list-item-ios theme-transition';
            item.onclick = () => this.showEditModal(p.id);

            let badge = '';
            if (days === 0) badge = '<span class="badge-ios">Hoy</span>';
            else if (days === 1) badge = '<span class="badge-ios">Mañana</span>';
            else if (days <= 7) badge = `<span class="badge-ios badge-ios-blue">${days} días</span>`;

            item.innerHTML = `
                <div class="avatar-ios avatar-ios-small">${p.name.charAt(0)}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-title-3 truncate" style="color: var(--text-primary);">${p.name}</h3>
                        ${badge}
                    </div>
                    <div class="text-callout flex items-center gap-1" style="color: var(--text-secondary);">
                        <span class="flex items-center">${categoryIcon}</span>
                        <span>${zodiac.symbol} Cumple ${nextAge} • ${birthDate.getDate()} ${birthDate.toLocaleDateString('es-ES', {month:'short'})}</span>
                    </div>
                    ${p.notes ? `<div class="text-footnote mt-1 truncate">${p.notes}</div>` : ''}
                </div>
                <svg class="w-6 h-6 flex-shrink-0" style="color: var(--text-tertiary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                </svg>
            `;

            list.appendChild(item);

            const swipe = new SwipeToDelete(item, () => {
                this.app.deletePersonById(p.id);
            });
            this.swipeInstances.push(swipe);
        });
    }

    // Filtros
    filter(type) {
        this.currentFilter = type;
        document.querySelectorAll('.segment-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === type);
        });
        this.updateSegmentIndicator();
        this.render(document.getElementById('searchInput')?.value || '');
        haptic.trigger('light');
    }

    search(value) {
        this.render(value);
    }

    // Modales
    showAddModal() {
        this.editingId = null;
        this._resetForm();
        document.getElementById('modalTitle').textContent = 'Nuevo';
        document.getElementById('deleteBtn')?.classList.add('hidden');
        document.getElementById('shareBtnContainer')?.classList.add('hidden');
        document.getElementById('calendarBtnContainer')?.classList.add('hidden');

        const modal = document.getElementById('personModal');
        modal?.classList.remove('hidden');

        document.getElementById('fabBtn')?.classList.add('hidden');
        haptic.trigger('medium');
    }

    showEditModal(id) {
        const p = this.app.people.find(x => x.id === id);
        if (!p) return;

        this.editingId = id;
        document.getElementById('modalTitle').textContent = 'Editar';
        document.getElementById('personName').value = p.name;
        document.getElementById('birthDate').value = p.birthDate.split('T')[0];
        document.getElementById('category').value = p.category;
        document.getElementById('notes').value = p.notes || '';
        document.getElementById('avatarPreview').textContent = p.name.charAt(0);

        document.getElementById('deleteBtn')?.classList.remove('hidden');
        document.getElementById('shareBtnContainer')?.classList.remove('hidden');
        document.getElementById('calendarBtnContainer')?.classList.remove('hidden');

        const modal = document.getElementById('personModal');
        modal?.classList.remove('hidden');

        document.getElementById('fabBtn')?.classList.add('hidden');
        haptic.trigger('light');
    }

    closeModal() {
        const modal = document.getElementById('personModal');
        const sheet = modal?.querySelector('.sheet-ios');

        if (sheet) {
            sheet.classList.add('closing');
            setTimeout(() => {
                modal?.classList.add('hidden');
                sheet.classList.remove('closing');
            }, 400);
        } else {
            modal?.classList.add('hidden');
        }

        this.editingId = null;
        document.getElementById('fabBtn')?.classList.remove('hidden');
    }

    _resetForm() {
        document.getElementById('personName').value = '';
        document.getElementById('birthDate').value = '';
        document.getElementById('category').value = 'family';
        document.getElementById('notes').value = '';
        document.getElementById('avatarPreview').textContent = '?';
    }

    updateAvatar() {
        const name = document.getElementById('personName')?.value || '';
        const preview = document.getElementById('avatarPreview');
        if (preview) {
            preview.textContent = name ? name.charAt(0).toUpperCase() : '?';
        }
    }

    // Stats
    showStats() {
        const total = this.app.people.length;
        const today = new Date();
        const currentMonth = today.getMonth();

        const thisMonth = this.app.people.filter(p => {
            const birthDate = utils.parseLocalDate(p.birthDate);
            return birthDate.getMonth() === currentMonth;
        }).length;

        let avgAge = 0;
        if (total > 0) {
            const totalAge = this.app.people.reduce((sum, p) => {
                return sum + utils.calculateAge(utils.parseLocalDate(p.birthDate));
            }, 0);
            avgAge = Math.round(totalAge / total);
        }

        let nextPerson = '-';
        if (this.app.people.length > 0) {
            const sorted = [...this.app.people].sort((a, b) => {
                return utils.getDaysUntil(utils.parseLocalDate(a.birthDate)) - utils.getDaysUntil(utils.parseLocalDate(b.birthDate));
            });
            const days = utils.getDaysUntil(utils.parseLocalDate(sorted[0].birthDate));
            nextPerson = days === 0 ? '¡Hoy!' : `${days} ${days === 1 ? 'día' : 'días'}`;
        }

        document.getElementById('statTotal').textContent = total;
        document.getElementById('statThisMonth').textContent = thisMonth;
        document.getElementById('statAvgAge').textContent = avgAge || '-';
        document.getElementById('statNext').textContent = nextPerson;

        document.getElementById('statsModal')?.classList.remove('hidden');
        haptic.trigger('light');
    }

    closeStats() {
        document.getElementById('statsModal')?.classList.add('hidden');
    }

    // Timeline
    showTimeline() {
        const modal = document.getElementById('timelineModal');
        const content = document.getElementById('timelineContent');
        if (!modal || !content) return;

        const sorted = [...this.app.people].sort((a, b) => {
            return utils.getDaysUntil(utils.parseLocalDate(a.birthDate)) - utils.getDaysUntil(utils.parseLocalDate(b.birthDate));
        });

        const today = new Date();
        const currentMonth = today.getMonth();
        const months = {};
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        sorted.forEach(person => {
            const birthDate = utils.parseLocalDate(person.birthDate);
            const nextBirthday = utils.getNextBirthdayDate(birthDate);
            const month = nextBirthday.getMonth();

            if (!months[month]) months[month] = [];
            months[month].push({
                ...person,
                nextBirthday,
                daysUntil: utils.getDaysUntil(birthDate),
                age: utils.calculateAge(birthDate) + 1
            });
        });

        let html = '';
        Object.keys(months).sort((a, b) => {
            const monthA = parseInt(a) >= currentMonth ? parseInt(a) : parseInt(a) + 12;
            const monthB = parseInt(b) >= currentMonth ? parseInt(b) : parseInt(b) + 12;
            return monthA - monthB;
        }).forEach(monthIndex => {
            const monthPeople = months[monthIndex];
            const isCurrentMonth = parseInt(monthIndex) === currentMonth;

            html += `
                <div class="timeline-month ${isCurrentMonth ? 'current-month' : ''}">
                    <div class="timeline-month-header">
                        <span class="month-name">${monthNames[monthIndex]}</span>
                        ${isCurrentMonth ? '<span class="current-badge">Actual</span>' : ''}
                        <span class="month-count">${monthPeople.length} cumpleaños</span>
                    </div>
                    <div class="timeline-events">
                        ${monthPeople.map(person => {
                            const birthDate = utils.parseLocalDate(person.birthDate);
                            const zodiac = utils.getZodiac(birthDate);
                            const isToday = person.daysUntil === 0;

                            return `
                                <div class="timeline-event ${isToday ? 'today' : ''}" onclick="app.ui.showEditModal('${person.id}')">
                                    <div class="event-date">
                                        <span class="day-number">${person.nextBirthday.getDate()}</span>
                                        <span class="day-name">${person.nextBirthday.toLocaleDateString('es-ES', {weekday: 'short'})}</span>
                                    </div>
                                    <div class="event-content">
                                        <div class="event-name">${person.name}</div>
                                        <div class="event-details">
                                            ${zodiac.symbol} ${zodiac.name} • Cumple ${person.age}
                                            ${person.daysUntil > 0 ? `• En ${person.daysUntil} días` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        content.innerHTML = html || '<div class="text-center py-12 text-footnote">No hay cumpleaños registrados</div>';
        modal.classList.remove('hidden');

        setTimeout(() => {
            modal.querySelector('.timeline-sheet')?.classList.add('show');
        }, 10);

        haptic.trigger('light');
    }

    closeTimeline() {
        const modal = document.getElementById('timelineModal');
        const sheet = modal?.querySelector('.timeline-sheet');
        if (sheet) {
            sheet.classList.add('closing');
            setTimeout(() => {
                modal?.classList.add('hidden');
                sheet.classList.remove('closing');
            }, 500);
        }
    }

    // Utilidades UI
    checkTodayBirthdays() {
        const today = new Date();
        const todayBirthdays = this.app.people.filter(person => {
            const birthDate = utils.parseLocalDate(person.birthDate);
            return birthDate.getMonth() === today.getMonth() && birthDate.getDate() === today.getDate();
        });

        if (todayBirthdays.length > 0) {
            todayBirthdays.forEach(person => {
                const birthDate = utils.parseLocalDate(person.birthDate);
                const age = utils.calculateAge(birthDate);
                this.showToast(`🎉 ${person.name} cumple ${age} años hoy!`);
            });
            this.createConfetti();
        }
    }

    createConfetti() {
        const colors = ['#007AFF', '#FF2D55', '#AF52DE', '#34C759', '#FF9500'];
        for (let i = 0; i < 40; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = Math.random() * 100 + 'vw';
            c.style.background = colors[Math.floor(Math.random() * colors.length)];
            c.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(c);
            setTimeout(() => c.remove(), 3500);
        }
    }

    showToast(msg) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const t = document.createElement('div');
        t.className = 'toast-ios';
        t.textContent = msg;
        container.appendChild(t);
        setTimeout(() => {
            t.style.animation = 'toast-in 0.3s reverse';
            setTimeout(() => t.remove(), 300);
        }, 2200);
    }
}

// ============================================
// CALENDARIO (ICS EXPORT)
// ============================================

class CalendarManager {
    constructor(app) {
        this.app = app;
    }

    add(personId = null) {
        const id = personId || this.app.ui.editingId;
        if (!id) return;

        const person = this.app.people.find(p => p.id === id);
        if (!person) return;

        const birthDate = utils.parseLocalDate(person.birthDate);
        const nextBirthday = utils.getNextBirthdayDate(birthDate);
        const age = utils.calculateAge(birthDate) + 1;

        const icsContent = this._generateICS(person, nextBirthday, age);
        this._download(icsContent, `cumpleanos-${person.name.replace(/\s+/g, '-').toLowerCase()}.ics`);

        this.app.ui.showToast('Calendario descargado');
        haptic.trigger('success');
    }

    _generateICS(person, date, age) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const startDate = `${year}${month}${day}`;

        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        const endDateStr = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`;

        const uid = `${person.id}@birthdays-app`;
        const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Birthdays App//ES',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${now}`,
            `DTSTART;VALUE=DATE:${startDate}`,
            `DTEND;VALUE=DATE:${endDateStr}`,
            `SUMMARY:🎂 Cumpleaños de ${person.name}`,
            `DESCRIPTION:Cumple ${age} años\n${person.notes ? 'Notas: ' + person.notes : ''}`,
            'RRULE:FREQ=YEARLY',
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            'DESCRIPTION:Recordatorio de cumpleaños',
            'TRIGGER:-P1D',
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
    }

    _download(content, filename) {
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// ============================================
// SHARE (WHATSAPP)
// ============================================

class ShareManager {
    constructor(app) {
        this.app = app;
    }

    whatsApp(personId = null) {
        const id = personId || this.app.ui.editingId;
        if (!id) return;

        const person = this.app.people.find(p => p.id === id);
        if (!person) return;

        const birthDate = utils.parseLocalDate(person.birthDate);
        const days = utils.getDaysUntil(birthDate);
        const age = utils.calculateAge(birthDate) + 1;
        const zodiac = utils.getZodiac(birthDate);

        let message = '';

        if (days === 0) {
            message = `🎉 ¡Hoy es el cumpleaños de ${person.name}! Cumple ${age} años. ¡No olvides felicitarle! 🎂`;
        } else if (days === 1) {
            message = `📅 Mañana cumple ${person.name} ${age} años. ¡Prepárate para felicitarle! 🎉`;
        } else {
            message = `📅 Cumpleaños de ${person.name} en ${days} días. Cumplirá ${age} años. ${zodiac.symbol} ${zodiac.name}`;
        }

        if (person.notes) {
            message += `\n\n📝 Notas: ${person.notes}`;
        }

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        this.app.ui.showToast('Abriendo WhatsApp...');
    }
}

// ============================================
// APP PRINCIPAL
// ============================================

class BirthdayApp {
    constructor() {
        this.db = new Database();
        this.ui = new UIController(this);
        this.calendar = new CalendarManager(this);
        this.share = new ShareManager(this);
        this.people = [];
    }

    async init() {
        try {
            haptic.init();
            splash.init();

            await this.db.init();
            await this.loadData();

            setTimeout(() => {
                this.ui.init();
            }, CONFIG.SPLASH_DURATION);

            console.log('✅ App inicializada');
        } catch (error) {
            console.error('Error inicializando app:', error);
            this.ui.showToast('Error al iniciar la app');
        }
    }

    async loadData() {
        try {
            this.people = await this.db.getAllPeople();
        } catch (e) {
            console.error('Error cargando datos:', e);
            this.people = [];
        }
    }

    async refresh() {
        const btn = document.getElementById('refreshBtn');
        if (btn) {
            btn.style.transform = 'rotate(360deg)';
            btn.style.transition = 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)';
        }

        this.ui.showToast('Actualizando...');
        await this.loadData();
        this.ui.render();

        setTimeout(() => {
            if (btn) btn.style.transform = 'rotate(0deg)';
        }, 500);
    }

    async savePerson() {
        const name = document.getElementById('personName')?.value.trim();
        const birthDate = document.getElementById('birthDate')?.value;

        if (!name || !birthDate) {
            this.ui.showToast('Completa el nombre y fecha');
            haptic.trigger('error');
            return;
        }

        const person = {
            id: this.ui.editingId || utils.generateId(),
            name,
            birthDate,
            category: document.getElementById('category')?.value || 'family',
            notes: document.getElementById('notes')?.value.trim() || ''
        };

        try {
            await this.db.savePerson(person);

            if (this.ui.editingId) {
                const idx = this.people.findIndex(p => p.id === this.ui.editingId);
                this.people[idx] = person;
            } else {
                this.people.push(person);
            }

            this.ui.render();
            this.ui.closeModal();
            this.ui.showToast(this.ui.editingId ? 'Actualizado' : 'Añadido');
            haptic.trigger('success');
        } catch (e) {
            console.error('Error guardando:', e);
            this.ui.showToast('Error al guardar');
            haptic.trigger('error');
        }
    }

    async deletePerson() {
        if (!this.ui.editingId) return;
        if (!confirm('¿Eliminar este cumpleaños?')) return;

        await this.deletePersonById(this.ui.editingId);
    }

    async deletePersonById(id) {
        try {
            await this.db.deletePerson(id);
            this.people = this.people.filter(p => p.id !== id);

            this.ui.render();
            this.ui.closeModal();
            this.ui.showToast('Eliminado');
            haptic.trigger('delete');
        } catch (e) {
            console.error('Error eliminando:', e);
            this.ui.showToast('Error al eliminar');
        }
    }

    exportPDF() {
        const jsPDF = window.jspdf?.jsPDF;
        if (!jsPDF) {
            this.ui.showToast('Error: Librería no cargada');
            return;
        }

        try {
            const doc = new jsPDF();

            doc.setFontSize(24);
            doc.text('Mis Cumpleaños', 105, 20, { align: 'center' });

            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 105, 30, { align: 'center' });

            let y = 50;
            const sorted = [...this.people].sort((a, b) => {
                return utils.getDaysUntil(utils.parseLocalDate(a.birthDate)) - utils.getDaysUntil(utils.parseLocalDate(b.birthDate));
            });

            sorted.forEach((person, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }

                const birthDate = utils.parseLocalDate(person.birthDate);
                const days = utils.getDaysUntil(birthDate);
                const age = utils.calculateAge(birthDate);
                const zodiac = utils.getZodiac(birthDate);

                doc.setFontSize(14);
                doc.setTextColor(0);
                doc.text(`${index + 1}. ${person.name}`, 20, y);

                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(`${birthDate.getDate()}/${birthDate.getMonth() + 1} • ${zodiac.symbol} ${zodiac.name} • Cumple ${age + 1} años • ${days === 0 ? '¡HOY!' : `En ${days} días`}`, 20, y + 6);

                y += 20;
            });

            doc.save('cumpleanos.pdf');
            this.ui.showToast('PDF descargado');
            haptic.trigger('success');
        } catch (e) {
            console.error('Error exportando PDF:', e);
            this.ui.showToast('Error al exportar PDF');
        }
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

const app = new BirthdayApp();

window.onload = () => app.init();

// Cerrar modales al hacer click fuera
window.onclick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
        if (e.target.id === 'personModal') app.ui.closeModal();
        if (e.target.id === 'statsModal') app.ui.closeStats();
        if (e.target.id === 'timelineModal') app.ui.closeTimeline();
        if (e.target.id === 'settingsModal') app.ui.closeSettings();
        if (e.target.id === 'remindersModal') app.ui.closeRemindersModal();
    }
};

// Keyboard handling para modales en móvil
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        app.ui.closeModal();
        app.ui.closeStats();
        app.ui.closeTimeline();
        app.ui.closeSettings();
        app.ui.closeRemindersModal();
    }
});
