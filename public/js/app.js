const app = {
    config: {
        apiKey: "AIzaSyDCEeOsgMDzwrMPmnYWVJIzYA3GuRQQ65Y",
        authDomain: "daehansa-workflow.firebaseapp.com",
        projectId: "daehansa-workflow",
        storageBucket: "daehansa-workflow.firebasestorage.app"
    },
    storage: null,
    db: null,
    auth: null,
    currentUser: null,
    isAdmin: false,
    imageCache: {},
    products: [],
    parts_db: {},

    init() {
        // Initialize Firebase immediately with hardcoded config
        this.initFirebase();
        this.bindEvents();
    },

    initFirebase() {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(this.config);
            }

            this.db = firebase.firestore();
            this.storage = firebase.storage();
            this.auth = firebase.auth();

            console.log("Firebase initialized");

            // Auth State Observer
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    document.getElementById('loginModal').style.display = 'none';
                    await this.checkUserRole(user);
                    this.loadProducts();
                } else {
                    this.currentUser = null;
                    this.isAdmin = false;
                    document.getElementById('loginModal').style.display = 'flex';
                    document.getElementById('openSettings').style.display = 'none';
                }
            });

        } catch (error) {
            console.error("Firebase init error:", error);
            document.getElementById('errorState').style.display = 'flex';
        }
    },

    async handleLogin() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await this.auth.signInWithPopup(provider);
        } catch (error) {
            console.error("Login failed:", error);
            alert("로그인에 실패했습니다: " + error.message);
        }
    },

    async handleLogout() {
        try {
            await this.auth.signOut();
            location.reload();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    },

    async checkUserRole(user) {
        try {
            const userRef = this.db.collection('users').doc(user.uid);
            const doc = await userRef.get();

            if (!doc.exists) {
                // Create new user (default role: user)
                await userRef.set({
                    email: user.email,
                    displayName: user.displayName,
                    name: user.displayName, // Workflow 호환
                    photoURL: user.photoURL,
                    role: 'user',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                this.isAdmin = false;
            } else {
                const userData = doc.data();
                // 'admin' 또는 'manager' 둘 다 관리자로 인정
                this.isAdmin = ['admin', 'manager'].includes(userData.role);

                // Update basic info just in case
                if (userData.email !== user.email || userData.displayName !== user.displayName) {
                    userRef.update({
                        email: user.email,
                        displayName: user.displayName,
                        name: user.displayName, // Workflow 호환용 name 필드도 업데이트
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }

            // Show settings button only if admin
            if (this.isAdmin) {
                document.getElementById('openSettings').style.display = 'flex';
            } else {
                document.getElementById('openSettings').style.display = 'none';
            }

        } catch (error) {
            console.error("Error checking user role:", error);
        }
    },

    bindEvents() {
        document.getElementById('openSettings').onclick = () => this.openSettings();
        document.getElementById('closeSettings').onclick = () => this.closeSettings();
        document.getElementById('syncParts').onclick = () => this.migrateParts();

        // Auth Buttons
        document.getElementById('btnLogin').onclick = () => this.handleLogin();
        document.getElementById('btnLogout').onclick = () => this.handleLogout();

        // Logo Click (Home Reset)
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.onclick = () => {
                this.showDetailView(false);
                this.showPartView(false);

                // Reset inputs
                ['sCode', 'sModel', 'sHousing', 'sCarrier'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });

                // Clear list
                this.renderProducts([]);
                const emptyState = document.getElementById('emptyState');
                if (emptyState) {
                    emptyState.style.display = 'flex';
                    emptyState.innerText = "검색 조건을 입력하세요.";
                }

                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
        }

        // New Search Logic (Segmented Control)
        this.currentType = 'domestic';

        const toggleContainer = document.getElementById('typeToggleContainer');
        const optDomestic = document.getElementById('optDomestic');
        const optImported = document.getElementById('optImported');

        const updateToggle = (type) => {
            this.currentType = type;
            if (type === 'imported') {
                toggleContainer.classList.add('imported');
                optDomestic.classList.remove('active');
                optImported.classList.add('active');
            } else {
                toggleContainer.classList.remove('imported');
                optDomestic.classList.add('active');
                optImported.classList.remove('active');
            }

            // Clear current list and show guide
            this.renderProducts([]);
            const emptyState = document.getElementById('emptyState');
            if (emptyState) {
                emptyState.style.display = 'flex';
                emptyState.innerText = "검색 조건을 입력하세요.";
            }
        };

        if (optDomestic) optDomestic.onclick = () => updateToggle('domestic');
        if (optImported) optImported.onclick = () => updateToggle('imported');

        const btnSearch = document.getElementById('btnSearch');
        if (btnSearch) {
            btnSearch.onclick = () => this.performSearch();
        }

        ['sCode', 'sModel', 'sHousing', 'sCarrier'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.onkeypress = (e) => {
                    if (e.key === 'Enter') this.performSearch();
                };
            }
        });

        window.onpopstate = (e) => {
            if (e.state && e.state.page === 'part') {
                this.showPartView(true);
            } else if (e.state && e.state.page === 'detail') {
                this.showPartView(false);
                this.showDetailView(true);
            } else {
                this.showPartView(false);
                this.showDetailView(false);
            }
        };
    },

    performSearch() {
        if (!this.products || this.products.length === 0) return;

        const sCode = document.getElementById('sCode').value.trim().toLowerCase();
        const sModel = document.getElementById('sModel').value.trim().toLowerCase();
        const sHousing = document.getElementById('sHousing').value.trim().toLowerCase();
        const sCarrier = document.getElementById('sCarrier').value.trim().toLowerCase();

        // Check empty
        if (!sCode && !sModel && !sHousing && !sCarrier) {
            alert("하나 이상의 검색 조건을 입력하세요.");
            return;
        }

        const filtered = this.products.filter(p => {
            // 1. Type Filter
            const isImported = (p.origin === '수입') || (p.제조사 === '수입');

            if (this.currentType === 'domestic' && isImported) return false;
            if (this.currentType === 'imported' && !isImported) return false;

            // 2. Input Filters (AND logic)
            if (sCode && !String(p.코드 || '').toLowerCase().includes(sCode)) return false;

            if (sModel) {
                // 호환차종 제외 (검색 범위 축소 요청)
                // const modelStr = [p.코드모델명, p.모델명, p.호환차종, p.검색창내용].join(' ').toLowerCase();
                const modelStr = [p.코드모델명, p.모델명, p.검색창내용].join(' ').toLowerCase();
                if (!modelStr.includes(sModel)) return false;
            }

            if (sHousing && !String(p.하우징 || '').toLowerCase().includes(sHousing)) return false;
            if (sCarrier && !String(p.캐리어 || '').toLowerCase().includes(sCarrier)) return false;

            return true;
        });

        this.renderProducts(filtered);
    },

    async migrateParts() {
        if (!confirm('스프레드시트의 부속품 데이터를 Firebase에 업로드하시겠습니까?\n이 작업은 잠시 시간이 걸릴 수 있습니다.')) return;

        const btn = document.getElementById('syncParts');
        const oldText = btn.innerText;
        btn.disabled = true;
        btn.innerText = '⏳ 업로드 중...';

        try {
            // PARTS_DATA는 js/parts_data.js에서 로드됨
            if (typeof PARTS_DATA === 'undefined') throw new Error('데이터를 찾을 수 없습니다.');

            const batchLimit = 500;
            let count = 0;

            for (let i = 0; i < PARTS_DATA.length; i += batchLimit) {
                const batch = this.db.batch();
                const chunk = PARTS_DATA.slice(i, i + batchLimit);

                chunk.forEach(part => {
                    // 빈 키(Empty field name) 제거 - Firestore 제약사항
                    const sanitizedPart = {};
                    Object.keys(part).forEach(key => {
                        if (key.trim() !== '') {
                            sanitizedPart[key] = part[key];
                        }
                    });

                    if (sanitizedPart.Code) {
                        const ref = this.db.collection('parts').doc(String(sanitizedPart.Code));
                        batch.set(ref, sanitizedPart, { merge: true });
                    }
                });

                await batch.commit();
                count += chunk.length;
                btn.innerText = `⏳ 업로드 중... (${count}/${PARTS_DATA.length})`;
            }

            alert(`성공적으로 ${count}개의 부속품 데이터를 동기화했습니다.`);
        } catch (error) {
            console.error('Migration failed:', error);
            alert('동기화 실패: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.innerText = oldText;
        }
    },

    filterProducts(query) {
        if (!this.products) return;
        const q = query.toLowerCase().trim();
        if (q === '') {
            this.renderProducts(this.products);
            return;
        }
        const filtered = this.products.filter(p => {
            const fields = [
                p.코드, p.코드모델명, p.제조사, p.시스템, p.타입,
                p.검색창내용, p.호환차종,
                p.피스톤1, p.피스톤2, p.피스톤3,
                p.씰1, p.씰2, p.씰3,
                p.부트1, p.부트2, p.부트3,
                p.핀1, p.핀2,
                p.핀부트1, p.핀부트2, p.핀부트3
            ];
            return fields.some(f => f && String(f).toLowerCase().includes(q));
        });
        this.renderProducts(filtered);
    },

    async loadUserList() {
        if (!this.isAdmin) return;
        const userListParam = document.getElementById('userList');
        userListParam.innerHTML = '<p style="padding:10px; text-align:center;">로딩 중...</p>';

        try {
            const snapshot = await this.db.collection('users').orderBy('createdAt', 'desc').get();
            let html = '';
            snapshot.forEach(doc => {
                const u = doc.data();
                const isMe = this.currentUser.uid === doc.id;
                html += `
                    <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${u.photoURL || 'https://via.placeholder.com/32'}" style="width:32px; height:32px; border-radius:50%;">
                            <div>
                                <div style="font-weight:bold; font-size:0.9rem;">${u.displayName || 'No Name'}</div>
                                <div style="font-size:0.8rem; color:#666;">${u.email}</div>
                            </div>
                        </div>
                        <div style="font-size:0.8rem;">
                            ${u.role === 'admin' ? '<span style="color:red; font-weight:bold;">관리자</span>' : '사용자'}
                        </div>
                    </div>
                `;
            });
            userListParam.innerHTML = html;
        } catch (e) {
            console.error("Load users failed:", e);
            userListParam.innerHTML = '<p style="color:red;">목록 로드 실패</p>';
        }
    },

    openSettings() {
        if (!this.isAdmin) {
            alert("관리자 권한이 없습니다.");
            return;
        }
        document.getElementById('settingsModal').style.display = 'flex';
        this.loadUserList();
    },

    closeSettings() {
        document.getElementById('settingsModal').style.display = 'none';
    },

    async loadProducts() {
        const spinner = document.getElementById('loadingSpinner');
        const productList = document.getElementById('productList');
        const productCount = document.getElementById('productCount');

        spinner.style.display = 'flex';
        productList.innerHTML = '';
        productCount.innerText = '';

        try {
            const snapshot = await this.db.collection('products').get();
            this.products = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // 데이터 표준화 (국산/수입 호환)
                const normalized = {
                    id: doc.id,
                    ...data,
                    코드: data.코드 || doc.id, // 코드가 없으면 문서 ID 사용
                    코드모델명: data.코드모델명 || data.모델명 || '', // 모델명 필드 호환
                    제조사: data.제조사 || data.origin || '', // origin 필드 호환
                    // 수입차 호환 (캐스팅 하우징/캐리어)
                    하우징: data.하우징 || data['캐스팅 하우징'] || '',
                    캐리어: data.캐리어 || data['캐스팅 캐리어'] || '',
                    // 위치 필드 호환
                    '완제품 위치': data['완제품 위치'] || data['위치'] || '',
                };
                this.products.push(normalized);
            });

            this.products.sort((a, b) => {
                const codeA = String(a.코드 || '');
                const codeB = String(b.코드 || '');
                return codeA.localeCompare(codeB);
            });

            // 초기 로딩 시 전체 목록 표시하지 않음 (검색 유도)
            this.renderProducts([]);
            const emptyState = document.getElementById('emptyState');
            if (emptyState) {
                emptyState.style.display = 'flex';
                emptyState.innerText = "검색 조건을 입력하세요.";
            }

            spinner.style.display = 'none';
        } catch (error) {
            console.error("Error loading products:", error);
            spinner.style.display = 'none';
            document.getElementById('errorState').style.display = 'flex';
        }
    },

    renderProducts(products) {
        const productList = document.getElementById('productList');
        const productCount = document.getElementById('productCount');
        const emptyState = document.getElementById('emptyState');

        productList.innerHTML = '';

        if (!products || products.length === 0) {
            // 목록이 비었을 때: 검색 결과 없음 또는 초기 상태
            // 이미 초기 상태 메시지가 있다면 유지, 없다면 '결과 없음' 표시
            if (emptyState.style.display === 'none') {
                emptyState.style.display = 'flex';
                emptyState.innerText = "검색 결과가 없습니다.";
            }
            productCount.style.display = 'none';
            return;
        }

        // 목록이 있을 때
        emptyState.style.display = 'none';
        productCount.style.display = 'block';
        productCount.innerText = `${products.length}개 제품`;

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.onclick = () => {
                this.openProductDetail(product);
                // 상세페이지 진입 시 검색창 초기화
                ['sCode', 'sModel', 'sHousing', 'sCarrier'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
            };

            let displayName = product.코드모델명;
            if (displayName && displayName.includes('_')) {
                displayName = displayName.split('_')[1];
            }

            const isImported = (product.origin === '수입') || (product.제조사 === '수입');

            card.innerHTML = `
                <div class="product-thumb" id="thumb-${product.코드}">📦</div>
                <div class="product-info">
                    <div class="product-code">${product.코드}</div>
                    <div class="product-model">${displayName}</div>
                    <div class="product-tags">
                        ${isImported ? '<span class="tag" style="background:#e7f5ff; color:#1c7ed6;">수입</span>' : ''}
                        <span class="tag">${product.제조사 || '-'}</span>
                        <span class="tag">${product.타입 || '-'}</span>
                        ${product.시스템 ? `<span class="tag">${product.시스템}</span>` : ''}
                    </div>
                </div>
                <div class="product-arrow">❯</div>
            `;
            productList.appendChild(card);
            this.loadImage(product, `thumb-${product.코드}`);
        });
    },

    async loadImage(p, elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;
        if (this.imageCache[p.코드]) {
            el.innerHTML = `<img src="${this.imageCache[p.코드]}" alt="${p.코드}" loading="lazy">`;
            return;
        }
        try {
            // 이미지 필드 우선순위: 이미지 > 이미지1 > alt=media > 문서ID.jpg...
            const fieldUrl = p.이미지 || p.이미지1 || p['alt=media'];
            if (fieldUrl && String(fieldUrl).startsWith('http')) {
                this.imageCache[p.코드] = fieldUrl;
                el.innerHTML = `<img src="${fieldUrl}" alt="${p.코드}" loading="lazy">`;
                return;
            }
            const extensions = ['.jpg', '.png', '.JPG', '.jpeg'];
            for (const ext of extensions) {
                try {
                    const ref = this.storage.ref(`products/${p.코드}${ext}`);
                    const url = await ref.getDownloadURL();
                    if (url) {
                        this.imageCache[p.코드] = url;
                        el.innerHTML = `<img src="${url}" alt="${p.코드}" loading="lazy">`;
                        return;
                    }
                } catch (e) { }
            }
        } catch (error) {
            console.error("Image load fail:", p.코드, error);
        }
    },

    showDetailView(show) {
        const overlay = document.getElementById('detailOverlay');
        if (show) overlay.classList.add('active');
        else overlay.classList.remove('active');
    },

    openProductDetail(product) {
        this.renderProductDetail(product);
        this.showDetailView(true);
        history.pushState({ page: 'detail', id: product.코드 }, '', `#detail-${product.코드}`);
    },

    closeProductDetail() {
        this.showDetailView(false);
        history.pushState(null, '', ' ');
    },

    renderProductDetail(p) {
        document.getElementById('detailTitle').innerText = p.코드;
        const container = document.getElementById('detailContent');

        let bomHtml = '';

        // 국산차/수입차 BOM 통합 처리
        const bomItems = [];

        // 1. 국산차 필드 처리
        if (p.피스톤1 || p.씰1 || p.부트1 || p.핀1 || p.핀부트1) {
            bomItems.push(
                { label: '피스톤', codes: [p.피스톤1, p.피스톤2, p.피스톤3], class: 'badge-piston' },
                { label: '씰', codes: [p.씰1, p.씰2, p.씰3], class: 'badge-seal' },
                { label: '부트', codes: [p.부트1, p.부트2, p.부트3], class: 'badge-boot' },
                { label: '핀', codes: [p.핀1, p.핀2], class: 'badge-pin' },
                { label: '핀부트', codes: [p.핀부트1, p.핀부트2, p.핀부트3], class: 'badge-pinboot' }
            );
        }

        // 2. 수입차 필드 처리 ('매뉴얼' 필드 파싱)
        // 예: "PO22 / PSO8 / B117 / ..."
        // 국산차 필드(피스톤, 씰 등)가 하나라도 있으면 매뉴얼 구성품은 중복 표시하지 않음
        if (p.매뉴얼 && bomItems.length === 0) {
            const manualCodes = p.매뉴얼.split('/').map(c => c.trim()).filter(c => c);
            const importedBom = { label: '구성품', codes: manualCodes, class: 'badge-seal' }; // 공통 색상 사용
            bomItems.push(importedBom);
        }

        // 3. 수입차 별도 부속 필드 (부속1, 부속2...)
        const extraParts = [];
        for (let i = 1; i <= 10; i++) {
            if (p[`부속${i}`] && p[`부속${i}`] !== '-') extraParts.push(p[`부속${i}`]);
        }
        if (extraParts.length > 0) {
            bomItems.push({ label: '기타부속', codes: extraParts, class: 'badge-pin' });
        }

        bomItems.forEach(item => {
            if (!item.codes) return;
            item.codes.forEach(code => {
                if (code && String(code).trim() !== '' && String(code) !== '-') {

                    let extraInfo = '';
                    if (typeof PARTS_DATA !== 'undefined') {
                        const part = PARTS_DATA.find(p => p.Code === code);
                        if (part) {
                            const type = part.구분 ? `[${part.구분}]` : '';
                            const memo = part.적요 ? `${part.적요}` : '';
                            const space = (type && memo) ? ' ' : '';
                            if (type || memo) {
                                extraInfo = `<span style="font-size:0.85rem; color:#868e96; margin-left:8px; font-weight:500;">${type}${space}${memo}</span>`;
                            }
                        }
                    }

                    bomHtml += `
                        <div class="bom-item" onclick="app.openPartDetail('${code}', '${item.label}')">
                            <div class="bom-info">
                                <span class="badge ${item.class}">${item.label}</span>
                                <span class="bom-code">${code}${extraInfo}</span>
                            </div>
                            <div class="product-arrow">❯</div>
                        </div>
                    `;
                }
            });
        });

        container.innerHTML = `
            <div class="detail-image-container" id="detailImage-${p.코드}">📦</div>
            <div class="detail-section">
                <div class="section-header">
                    <span class="section-title">PRODUCT INFO</span>
                    <div class="section-line"></div>
                </div>
                <div class="info-grid">
                    <div class="info-item"><div class="info-label">코드</div><div class="info-value">${p.코드}</div></div>
                    <div class="info-item"><div class="info-label">모델명</div><div class="info-value">${p.코드모델명}</div></div>
                    <div class="info-item"><div class="info-label">제조사</div><div class="info-value">${p.제조사 || '-'}</div></div>
                    <div class="info-item"><div class="info-label">시스템</div><div class="info-value">${p.시스템 || '-'}</div></div>
                    <div class="info-item"><div class="info-label">타입</div><div class="info-value">${p.타입 || '-'}</div></div>
                    <div class="info-item"><div class="info-label">니플</div><div class="info-value">${p.니플 || '-'}</div></div>
                    <div class="info-item full"><div class="info-label">규격</div><div class="info-value">${p.규격 || '-'}</div></div>
                    <div class="info-item"><div class="info-label">하우징</div><div class="info-value">${p.하우징 || '-'}</div></div>
                    <div class="info-item"><div class="info-label">캐리어</div><div class="info-value">${p.캐리어 || '-'}</div></div>
                    <div class="info-item full"><div class="info-label">호환차종</div><div class="info-value">${p.호환차종 || '-'}</div></div>
                    <div class="info-item full">
                        <div class="info-label">매뉴얼</div>
                        <div class="info-value" style="color:var(--accent-color); font-weight:700;">${p.매뉴얼 || p.검색창내용 || '-'}</div>
                    </div>
                </div>
            </div>
            <div class="detail-section">
                <div class="section-header"><span class="section-title">BOM (부속품)</span><div class="section-line"></div></div>
                <div class="bom-list">${bomHtml || '<p style="color:#adb5bd; font-size:0.9rem;">등록된 부속품이 없습니다.</p>'}</div>
            </div>
            <div class="detail-section">
                <div class="section-header"><span class="section-title">LOCATION INFO</span><div class="section-line"></div></div>
                <div class="location-grid">
                    <div class="location-card"><div class="info-label">완제품 위치</div><div class="loc-value ${!p['완제품 위치'] || p['완제품 위치'] === '-' ? 'none' : ''}">${p['완제품 위치'] || '-'}</div></div>
                    <div class="location-card"><div class="info-label">하우징 위치</div><div class="loc-value ${!p['하우징 위치'] || p['하우징 위치'] === '-' ? 'none' : ''}">${p['하우징 위치'] || '-'}</div></div>
                    <div class="location-card"><div class="info-label">캐리어 위치</div><div class="loc-value ${!p['캐리어 위치'] || p['캐리어 위치'] === '-' ? 'none' : ''}">${p['캐리어 위치'] || '-'}</div></div>
                    <div class="location-card"><div class="info-label">창고 위치</div><div class="loc-value ${!p['창고 위치'] || p['창고 위치'] === '-' ? 'none' : ''}">${p['창고 위치'] || '-'}</div></div>
                    <div class="location-card" style="grid-column: span 2;"><div class="info-label">고품 위치</div><div class="loc-value ${!p['고품 위치'] || p['고품 위치'] === '-' ? 'none' : ''}">${p['고품 위치'] || '-'}</div></div>
                </div>
            </div>
            ${p.제품관련적요 ? `
            <div class="detail-section">
                <div class="section-header"><span class="section-title">MEMO</span><div class="section-line"></div></div>
                <div class="memo-box">${p.제품관련적요}</div>
            </div>
            ` : ''}
        `;
        this.loadImage(p, `detailImage-${p.코드}`);
    },

    showPartView(show) {
        const overlay = document.getElementById('partOverlay');
        if (show) overlay?.classList.add('active');
        else overlay?.classList.remove('active');
    },

    closePartDetail() {
        this.showPartView(false);
        history.back();
    },

    async openPartDetail(code, type) {
        this.renderPartDetail(code, type);
        this.showPartView(true);
        history.pushState({ page: 'part', id: code }, '', `#part-${code}`);

        // Firestore에서 상세 정보 가져오기 시도
        try {
            const doc = await this.db.collection('parts').doc(code).get();
            if (doc.exists) {
                this.renderPartDetail(code, type, doc.data());
            }
        } catch (e) { console.error('Part detail load fail', e); }
    },

    openProductFromPart(code) {
        this.showPartView(false);
        const product = this.products.find(x => String(x.코드) === String(code));
        if (product) {
            this.renderProductDetail(product);
            history.replaceState({ page: 'detail', id: code }, '', `#detail-${code}`);
        }
    },

    renderPartDetail(code, type, data = null) {
        document.getElementById('partTitle').innerText = code;
        const container = document.getElementById('partContent');

        const usedIn = this.products.filter(p => {
            const bomFields = [
                p.피스톤1, p.피스톤2, p.피스톤3,
                p.씰1, p.씰2, p.씰3,
                p.부트1, p.부트2, p.부트3,
                p.핀1, p.핀2,
                p.핀부트1, p.핀부트2, p.핀부트3
            ];
            return bomFields.map(f => String(f)).includes(String(code));
        });

        let usedInHtml = usedIn.map(p => `
            <div class="bom-item" onclick="app.openProductFromPart('${p.코드}')">
                <div class="bom-info">
                    <span class="bom-code" style="color:var(--accent-color)">${p.코드}</span>
                    <span style="font-size:0.85rem; color:var(--text-secondary)">${p.코드모델명?.split('_')[1] || ''}</span>
                </div>
                <div class="product-arrow">❯</div>
            </div>
        `).join('');

        let specHtml = `
            <div class="memo-box" style="text-align:center; padding:30px; border:1px dashed #ced4da; border-left:none; background:#f8f9fa;">
                <div style="font-size:2rem; margin-bottom:10px;">📐</div>
                <p style="color:var(--text-secondary);">해당 부속의 상세 데이터가 없습니다.</p>
            </div>
        `;

        if (data) {
            specHtml = `
                <div class="info-grid">
                    ${data['D mm'] ? `<div class="info-item"><div class="info-label">D mm</div><div class="info-value">${data['D mm']}</div></div>` : ''}
                    ${data['H mm'] ? `<div class="info-item"><div class="info-label">H mm</div><div class="info-value">${data['H mm']}</div></div>` : ''}
                    ${data['D mm2'] ? `<div class="info-item"><div class="info-label">D mm2</div><div class="info-value">${data['D mm2']}</div></div>` : ''}
                    ${data['세부사항'] ? `<div class="info-item full"><div class="info-label">세부사항</div><div class="info-value">${data['세부사항']}</div></div>` : ''}
                    ${data['Ref.1'] ? `<div class="info-item"><div class="info-label">Ref.1</div><div class="info-value">${data['Ref.1']}</div></div>` : ''}
                    ${data['Ref.2'] ? `<div class="info-item"><div class="info-label">Ref.2</div><div class="info-value">${data['Ref.2']}</div></div>` : ''}
                    ${data['적요'] ? `<div class="info-item full"><div class="info-label">적요</div><div class="info-value">${data['적요']}</div></div>` : ''}
                </div>
            `;
            if (data.이미지) {
                specHtml = `
                    <div class="detail-image-container" style="background:#fff; margin-bottom:20px;">
                        <img src="${data.이미지}" alt="${code}" loading="lazy">
                    </div>
                ` + specHtml;
            }
        }

        container.innerHTML = `
            <div class="detail-section">
                <div class="section-header"><span class="section-title">PART INFO</span><div class="section-line"></div></div>
                <div class="info-grid">
                    <div class="info-item"><div class="info-label">부품코드</div><div class="info-value" style="font-family:'JetBrains Mono', monospace; font-size:1.2rem; color:var(--accent-color);">${code}</div></div>
                    <div class="info-item"><div class="info-label">구분</div><div class="info-value">${type}</div></div>
                </div>
            </div>
            <div class="detail-section">
                <div class="section-header"><span class="section-title">SPECIFICATION</span><div class="section-line"></div></div>
                ${specHtml}
            </div>
            <div class="detail-section">
                <div class="section-header"><span class="section-title">USED IN PRODUCTS (${usedIn.length})</span><div class="section-line"></div></div>
                <div class="bom-list">${usedInHtml || '<p style="color:#adb5bd; font-size:0.9rem;">사용 제품 정보가 없습니다.</p>'}</div>
            </div>
        `;
    }
};

window.onload = () => app.init();
