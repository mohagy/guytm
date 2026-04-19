const VMS = {
    _initPromise: null,
    _apiUrl: 'api.php',

    // Initialization: Ensure essential data structures exist
    init() {
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            // Priority 1: Try to get fresh data from server (XAMPP environment)
            try {
                const response = await fetch(this._apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    this._persistToLocal(data);
                    console.log('VMS: Data synced from server.');
                }
            } catch (err) {
                console.warn('VMS: Server sync failed, using localStorage fallback.');
            }

            // Priority 2: Fallback to localStorage if no server data
            if (!localStorage.getItem('vms_initialized')) {
                console.log('Starting VMS Initialization from data.json...');
                try {
                    const response = await fetch('./data.json');
                    const data = await response.json();
                    this._persistToLocal(data);
                    localStorage.setItem('vms_initialized', 'true');
                } catch (err) {
                    console.error('Data loading failed:', err.message);
                }
            }
        })();

        return this._initPromise;
    },

    _persistToLocal(data) {
        localStorage.setItem('vms_users', JSON.stringify(data.users || []));
        localStorage.setItem('vms_vehicles', JSON.stringify(data.vehicles || []));
        localStorage.setItem('vms_licenses', JSON.stringify(data.licenses || []));
        localStorage.setItem('vms_offences', JSON.stringify(data.offences || []));
        localStorage.setItem('vms_fitness', JSON.stringify(data.fitness || []));
        localStorage.setItem('vms_zones', JSON.stringify(data.zones || []));
    },

    async _sync(action, params = {}) {
        // Update LocalStorage first for instant UI
        this._updateLocal(action, params);

        // Attempt Server sync
        try {
            const body = { action: action, ...params };
            const response = await fetch(this._apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            return await response.json();
        } catch (err) {
            console.warn('Backend sync failed. Changes are local only.');
            return { success: true, localOnly: true };
        }
    },

    _updateLocal(action, params) {
        const vehicles = this.getVehicles();
        const licenses = JSON.parse(localStorage.getItem('vms_licenses')) || [];
        const offences = JSON.parse(localStorage.getItem('vms_offences')) || [];
        const fitness = JSON.parse(localStorage.getItem('vms_fitness')) || [];
        const users = this.getUsers();

        switch (action) {
            case 'add_vehicle':
                params.data.id = Date.now();
                vehicles.push(params.data);
                localStorage.setItem('vms_vehicles', JSON.stringify(vehicles));
                break;
            case 'delete_vehicle':
                const filteredV = vehicles.filter(v => v.reg_number !== params.reg);
                localStorage.setItem('vms_vehicles', JSON.stringify(filteredV));
                break;
            case 'add_license':
                params.data.id = Date.now();
                licenses.push(params.data);
                localStorage.setItem('vms_licenses', JSON.stringify(licenses));
                break;
            case 'delete_license':
                const filteredL = licenses.filter(l => l.id !== params.id);
                localStorage.setItem('vms_licenses', JSON.stringify(filteredL));
                break;
            case 'add_offence':
                params.data.id = Date.now();
                offences.push(params.data);
                localStorage.setItem('vms_offences', JSON.stringify(offences));
                break;
            case 'delete_offence':
                const filteredO = offences.filter(o => o.id !== params.id);
                localStorage.setItem('vms_offences', JSON.stringify(filteredO));
                break;
            case 'add_fitness':
                params.data.id = Date.now();
                fitness.push(params.data);
                localStorage.setItem('vms_fitness', JSON.stringify(fitness));
                break;
            case 'delete_fitness':
                const filteredF = fitness.filter(f => f.id !== params.id);
                localStorage.setItem('vms_fitness', JSON.stringify(filteredF));
                break;
        }
    },

    // Session Management
    login(username, password) {
        const users = this.getUsers();
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

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.toggle('active');
    },

    getCurrentUser() {
        return JSON.parse(sessionStorage.getItem('vms_current_user'));
    },

    requireLogin() {
        if (!this.getCurrentUser()) {
            window.location.href = 'login.html';
        }
    },

    isAdmin() {
        const user = this.getCurrentUser();
        if (!user) return false;
        return (user.role && user.role.toLowerCase() === 'admin') || (user.username && user.username.toLowerCase() === 'admin');
    },

    // CRUD Methods
    getVehicles() { return JSON.parse(localStorage.getItem('vms_vehicles')) || []; },
    getUsers() { return JSON.parse(localStorage.getItem('vms_users')) || []; },

    async addVehicle(vehicle) { return await this._sync('add_vehicle', { data: vehicle }); },
    async deleteVehicle(reg) { return await this._sync('delete_vehicle', { reg: reg }); },

    async applyLicense(license) { return await this._sync('add_license', { data: license }); },
    async deleteLicense(id) { return await this._sync('delete_license', { id: id }); },

    async addOffence(offence) { return await this._sync('add_offence', { data: offence }); },
    async deleteOffence(id) { return await this._sync('delete_offence', { id: id }); },

    async addFitness(record) { return await this._sync('add_fitness', { data: record }); },
    async deleteFitness(id) { return await this._sync('delete_fitness', { id: id }); },

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

    injectSidebar() {
        const user = this.getCurrentUser();
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        let navHtml = `<h2>GUYANA VMS</h2><a href="index.html" class="nav-link">Dashboard</a>`;
        if (user) {
            const isAdmin = this.isAdmin();
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
            navHtml += `<a href="#" onclick="VMS.logout()" class="nav-link" style="margin-top:2rem; color:var(--danger)">Logout (${user.username})</a>`;
        }
        sidebar.innerHTML = navHtml;

        if (!document.querySelector('.mobile-header')) {
            const mHeader = document.createElement('div');
            mHeader.className = 'mobile-header';
            mHeader.innerHTML = `<div style="font-weight:bold; color:var(--accent);">GUYANA VMS</div><button class="hamburger" onclick="VMS.toggleSidebar()">☰</button>`;
            document.body.prepend(mHeader);
        }

        document.querySelectorAll('table').forEach(table => {
            if (!table.parentElement.classList.contains('table-responsive')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }
};

VMS.init();
