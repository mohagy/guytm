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
            case 'edit_vehicle':
                const index = vehicles.findIndex(v => v.reg_number === params.data.reg_number);
                if (index !== -1) {
                    vehicles[index] = { ...vehicles[index], ...params.data };
                    localStorage.setItem('vms_vehicles', JSON.stringify(vehicles));
                }
                break;
            case 'edit_license':
                const indL = licenses.findIndex(l => l.id == params.data.id);
                if (indL !== -1) {
                    licenses[indL] = { ...licenses[indL], ...params.data };
                    localStorage.setItem('vms_licenses', JSON.stringify(licenses));
                }
                break;
            case 'edit_offence':
                const indO = offences.findIndex(o => o.id == params.data.id);
                if (indO !== -1) {
                    offences[indO] = { ...offences[indO], ...params.data };
                    localStorage.setItem('vms_offences', JSON.stringify(offences));
                }
                break;
            case 'edit_fitness':
                const indF = fitness.findIndex(f => f.id == params.data.id);
                if (indF !== -1) {
                    fitness[indF] = { ...fitness[indF], ...params.data };
                    localStorage.setItem('vms_fitness', JSON.stringify(fitness));
                }
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

    // Premium UI Modals
    _injectModalContainer() {
        if (document.getElementById('vms-modal')) return;
        const modalHtml = `
            <div id="vms-modal" class="modal-overlay" onclick="if(event.target===this) VMS.hideModal()">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title">Notification</h3>
                        <button class="modal-close" onclick="VMS.hideModal()">×</button>
                    </div>
                    <div id="modal-body" class="modal-body"></div>
                    <div id="modal-footer" class="modal-footer"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    showModal(title, body, buttons = []) {
        this._injectModalContainer();
        const modal = document.getElementById('vms-modal');
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerHTML = body;

        const footer = document.getElementById('modal-footer');
        footer.innerHTML = '';

        if (buttons.length === 0) {
            buttons.push({ text: 'Close', class: 'btn-secondary', onclick: () => this.hideModal() });
        }

        buttons.forEach(btn => {
            const b = document.createElement('button');
            b.innerText = btn.text;
            b.className = btn.class || '';
            b.onclick = () => {
                if (btn.onclick) btn.onclick();
                if (!btn.preventClose) this.hideModal();
            };
            footer.appendChild(b);
        });

        modal.classList.add('active');
    },

    hideModal() {
        const modal = document.getElementById('vms-modal');
        if (modal) modal.classList.remove('active');
    },

    showConfirm(title, message, onConfirm) {
        this.showModal(title, message, [
            { text: 'Cancel', class: 'btn-secondary', onclick: () => this.hideModal() },
            { text: 'Delete', class: 'btn-danger', onclick: onConfirm }
        ]);
    },

    async editVehicle(updatedVehicle) { return await this._sync('edit_vehicle', { data: updatedVehicle }); },

    showManageVehicle(reg) {
        const data = this.getVehicleDataByReg(reg);
        if (!data) return;

        const body = `
            <form id="edit-vehicle-form" style="text-align:left">
                <div class="form-group">
                    <label>Registration: <strong>${data.vehicle.reg_number}</strong></label>
                    <input type="hidden" id="edit_reg" value="${data.vehicle.reg_number}">
                </div>
                <div class="form-group" style="display:flex; gap:1rem;">
                    <div style="flex:1;">
                        <label>Make</label>
                        <input type="text" id="edit_make" required value="${data.vehicle.make}">
                    </div>
                    <div style="flex:1;">
                        <label>Model</label>
                        <input type="text" id="edit_model" required value="${data.vehicle.model}">
                    </div>
                </div>
                <div class="form-group" style="display:flex; gap:1rem;">
                    <div style="flex:1;">
                        <label>Category</label>
                        <select id="edit_category" required>
                            <option value="Private" ${data.vehicle.category === 'Private' ? 'selected' : ''}>Private</option>
                            <option value="Hire Car" ${data.vehicle.category === 'Hire Car' ? 'selected' : ''}>Hire Car (Taxi)</option>
                            <option value="Motor Bus" ${data.vehicle.category === 'Motor Bus' ? 'selected' : ''}>Motor Bus</option>
                            <option value="Lorry" ${data.vehicle.category === 'Lorry' ? 'selected' : ''}>Lorry / Goods</option>
                            <option value="Tractor" ${data.vehicle.category === 'Tractor' ? 'selected' : ''}>Tractor</option>
                        </select>
                    </div>
                    <div style="flex:1;">
                        <label>Year</label>
                        <input type="number" id="edit_year" required value="${data.vehicle.year}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Owner Username</label>
                    <input type="text" id="edit_owner" required value="${data.vehicle.owner_id}">
                </div>
                <div class="form-group">
                    <label>Business License #</label>
                    <input type="text" id="edit_biz" value="${data.vehicle.business_license_no || ''}">
                </div>
                <hr style="margin:1rem 0; opacity:0.1">
                <p><strong>Recent Offences:</strong> ${data.offences.length}</p>
                <p><strong>License Status:</strong> ${data.licenses.length > 0 ? data.licenses[0].status : 'N/A'}</p>
            </form>
        `;

        this.showModal('Edit Vehicle', body, [
            { text: 'Cancel', class: 'btn-secondary', onclick: () => this.hideModal() },
            {
                text: 'Save Changes', class: '', preventClose: true, onclick: async () => {
                    const updated = {
                        reg_number: document.getElementById('edit_reg').value,
                        make: document.getElementById('edit_make').value,
                        model: document.getElementById('edit_model').value,
                        category: document.getElementById('edit_category').value,
                        year: document.getElementById('edit_year').value,
                        owner_id: document.getElementById('edit_owner').value,
                        business_license_no: document.getElementById('edit_biz').value,
                        reg_date: data.vehicle.reg_date // keep original
                    };

                    await this.editVehicle(updated);
                    this.hideModal();
                    if (typeof renderVehicles === 'function') renderVehicles();
                }
            }
        ]);
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
        const role = String(user.role || '').toLowerCase();
        const username = String(user.username || '').toLowerCase();
        return role === 'admin' || username === 'admin';
    },

    // CRUD Methods
    getVehicles() { return JSON.parse(localStorage.getItem('vms_vehicles')) || []; },
    getUsers() { return JSON.parse(localStorage.getItem('vms_users')) || []; },

    async addVehicle(vehicle) { return await this._sync('add_vehicle', { data: vehicle }); },
    async deleteVehicle(reg) { return await this._sync('delete_vehicle', { reg: reg }); },

    async applyLicense(license) { return await this._sync('add_license', { data: license }); },
    async deleteLicense(id) { return await this._sync('delete_license', { id: id }); },
    async editLicense(updated) { return await this._sync('edit_license', { data: updated }); },

    async addOffence(offence) { return await this._sync('add_offence', { data: offence }); },
    async deleteOffence(id) { return await this._sync('delete_offence', { id: id }); },
    async editOffence(updated) { return await this._sync('edit_offence', { data: updated }); },

    async addFitness(record) { return await this._sync('add_fitness', { data: record }); },
    async deleteFitness(id) { return await this._sync('delete_fitness', { id: id }); },
    async editFitness(updated) { return await this._sync('edit_fitness', { data: updated }); },

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
