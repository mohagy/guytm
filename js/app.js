/**
 * Guyana VMS - Core Logic
 * Handles data persistence using localStorage
 */

const VMS = {
    _initPromise: null,
    // Initialization: Ensure essential data structures exist
    init() {
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            if (!localStorage.getItem('vms_initialized')) {
                console.log('Starting VMS Initialization...');
                try {
                    // Use relative path but ensure it targets the same dir as the script
                    const response = await fetch('./data.json');
                    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

                    const data = await response.json();

                    localStorage.setItem('vms_users', JSON.stringify(data.users));
                    localStorage.setItem('vms_vehicles', JSON.stringify(data.vehicles));
                    localStorage.setItem('vms_licenses', JSON.stringify(data.licenses));
                    localStorage.setItem('vms_offences', JSON.stringify(data.offences));
                    localStorage.setItem('vms_fitness', JSON.stringify(data.fitness || []));
                    localStorage.setItem('vms_zones', JSON.stringify(data.zones));

                    localStorage.setItem('vms_initialized', 'true');
                    console.log('VMS Data successfully loaded from data.json');
                } catch (err) {
                    console.error('Data loading failed:', err.message);
                    // Fallback to essential admin if everything fails
                    if (!localStorage.getItem('vms_users')) {
                        console.warn('Falling back to default admin credentials.');
                        localStorage.setItem('vms_users', JSON.stringify([
                            { id: 1, username: 'admin', password: '123', role: 'Admin', full_name: 'System Admin', email: 'admin@vms.gy' }
                        ]));
                        localStorage.setItem('vms_initialized', 'true');
                    }
                }
            }
        })();

        return this._initPromise;
    },

    // Session Management (Mock)
    login(username, password) {
        const users = JSON.parse(localStorage.getItem('vms_users'));
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            sessionStorage.setItem('vms_current_user', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid username or password' };
    },

    logout() {
        sessionStorage.removeItem('vms_current_user');
        window.location.href = 'login.html';
    },

    getCurrentUser() {
        return JSON.parse(sessionStorage.getItem('vms_current_user'));
    },

    requireLogin() {
        if (!this.getCurrentUser()) {
            window.location.href = 'login.html';
        }
    },

    // CRUD - Vehicles
    addVehicle(vehicle) {
        const vehicles = JSON.parse(localStorage.getItem('vms_vehicles'));
        vehicle.id = Date.now();
        vehicle.reg_date = new Date().toISOString().split('T')[0];
        vehicles.push(vehicle);
        localStorage.setItem('vms_vehicles', JSON.stringify(vehicles));
        return vehicle;
    },

    getVehicles() {
        return JSON.parse(localStorage.getItem('vms_vehicles'));
    },

    // CRUD - Licenses
    applyLicense(license) {
        const licenses = JSON.parse(localStorage.getItem('vms_licenses'));
        license.id = Date.now();
        license.status = 'Pending';
        licenses.push(license);
        localStorage.setItem('vms_licenses', JSON.stringify(licenses));
        return license;
    },

    getVehicleDataByReg(reg) {
        const vehicles = this.getVehicles();
        const v = vehicles.find(item => item.reg_number.toUpperCase() === reg.toUpperCase());
        if (!v) return null;

        const licenses = JSON.parse(localStorage.getItem('vms_licenses')) || [];
        const offences = JSON.parse(localStorage.getItem('vms_offences')) || [];
        const fitness = JSON.parse(localStorage.getItem('vms_fitness')) || [];

        return {
            vehicle: v,
            licenses: licenses.filter(l => l.user_id === v.owner_id),
            offences: offences.filter(o => o.reg.toUpperCase() === reg.toUpperCase()),
            fitness: fitness.filter(f => f.reg.toUpperCase() === reg.toUpperCase())
        };
    },

    getUsers() {
        return JSON.parse(localStorage.getItem('vms_users')) || [];
    },

    addUser(user) {
        const users = this.getUsers();
        user.id = Date.now();
        users.push(user);
        localStorage.setItem('vms_users', JSON.stringify(users));
        return user;
    },

    deleteUser(userId) {
        let users = this.getUsers();
        users = users.filter(u => u.id !== userId);
        localStorage.setItem('vms_users', JSON.stringify(users));
    },

    // UI Helpers
    injectSidebar() {
        const user = this.getCurrentUser();
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        let navHtml = `
            <h2>GUYANA VMS</h2>
            <a href="index.html" class="nav-link">Dashboard</a>
        `;

        if (user) {
            console.log('Sidebar Injector: User found:', user.username, 'Role:', user.role);
            const isAdmin = user.role && user.role.toLowerCase() === 'admin';
            const isOfficer = user.role && user.role.toLowerCase() === 'licensing officer';

            if (isAdmin || isOfficer) {
                navHtml += `
                    <a href="vehicles.html" class="nav-link">Vehicles</a>
                    <a href="licenses.html" class="nav-link">Licensing</a>
                    <a href="offences.html" class="nav-link">Offences</a>
                    <a href="lookup.html" class="nav-link">Vehicle Lookup</a>
                    <a href="fitness.html" class="nav-link">Fitness & Zones</a>
                    ${isAdmin ? '<a href="users.html" class="nav-link">User Management</a>' : ''}
                `;
            }
            if (user.role === 'Vehicle Owner') {
                navHtml += `
                    <a href="my_vehicles.html" class="nav-link">My Vehicles</a>
                    <a href="my_licenses.html" class="nav-link">My Licenses</a>
                `;
            }
            navHtml += `<a href="#" onclick="VMS.logout()" class="nav-link" style="margin-top:2rem; color:var(--danger)">Logout (${user.username})</a>`;
        } else {
            navHtml += `<a href="login.html" class="nav-link">Login</a>`;
        }

        sidebar.innerHTML = navHtml;
    }
};

// Initialize data
VMS.init();

VMS.resetData = function () {
    localStorage.removeItem('vms_initialized');
    localStorage.removeItem('vms_users');
    localStorage.removeItem('vms_vehicles');
    localStorage.removeItem('vms_licenses');
    localStorage.removeItem('vms_offences');
    localStorage.removeItem('vms_fitness');
    localStorage.removeItem('vms_zones');
    console.log('VMS Storage Cleared. Refresh to re-initialize.');
};
