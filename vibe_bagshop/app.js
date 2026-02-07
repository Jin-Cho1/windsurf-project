// Three.js MD 추천 3D 모델 로드 + 인터랙션
let scene, camera, renderer, bag, controls;
let currentColor = '#111827';
let isAutoRotating = true;

function initThree() {
  const canvas = document.getElementById('bagCanvas');
  if (!canvas) return;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  // Scene
  scene = new THREE.Scene();
  scene.background = null;

  // Camera
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.z = 5;

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  const ambient = new THREE.AmbientLight('#ffffff', 0.6);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight('#ffffff', 0.8);
  directional.position.set(5, 5, 5);
  scene.add(directional);

  // OrbitControls for user interaction
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;
  controls.autoRotate = isAutoRotating;
  controls.autoRotateSpeed = 2.0;
  
  // Load 3D model
  load3DModel();
  
  // Animation
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Resize
  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);
  
  // User interaction events
  canvas.addEventListener('mousedown', () => {
    isAutoRotating = false;
    controls.autoRotate = false;
  });
  
  canvas.addEventListener('mouseup', () => {
    setTimeout(() => {
      isAutoRotating = true;
      controls.autoRotate = true;
    }, 3000); // 3초 후 다시 자동 회전
  });
}

// 3D 모델 로드 함수
function load3DModel() {
  const loader = new THREE.GLTFLoader();
  
  // 로딩 인디케이터 표시 (선택사항)
  const canvas = document.getElementById('bagCanvas');
  const hint = document.querySelector('.stage__hint');
  if (hint) {
    hint.textContent = '3D 모델 로딩 중...';
  }
  
  loader.load(
    './red handbag 3d model.glb',
    function (gltf) {
      // 모델 로드 성공
      bag = gltf.scene;
      
      // 모델 크기 조정 및 위치 설정
      const box = new THREE.Box3().setFromObject(bag);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // 모델 중앙 정렬
      bag.position.x = -center.x;
      bag.position.y = -center.y;
      bag.position.z = -center.z;
      
      // 모델 크기 조정 (화면에 맞게)
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.5 / maxDim;
      bag.scale.multiplyScalar(scale);
      
      scene.add(bag);
      
      // 로딩 완료 힌트 업데이트
      if (hint) {
        hint.textContent = '드래그하여 회전시킬 수 있습니다';
      }
      
      console.log('3D 모델이 성공적으로 로드되었습니다.');
    },
    function (progress) {
      // 로딩 진행률 (선택사항)
      console.log('로딩 진행률:', (progress.loaded / progress.total * 100) + '%');
    },
    function (error) {
      // 로딩 실패 시 기본 도형으로 대체
      console.error('3D 모델 로딩 실패:', error);
      createFallbackBag();
      
      if (hint) {
        hint.textContent = '기본 3D 모델을 표시합니다';
      }
    }
  );
}

// 대체용 기본 가방 모델 생성
function createFallbackBag() {
  const group = new THREE.Group();

  // Body (박스)
  const bodyGeometry = new THREE.BoxGeometry(2.5, 2, 1.2);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: currentColor, metalness: 0.1, roughness: 0.4 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  group.add(body);

  // Handles (토러스)
  const handleGeometry = new THREE.TorusGeometry(0.7, 0.12, 8, 32);
  const handleMaterial = new THREE.MeshStandardMaterial({ color: currentColor, metalness: 0.2, roughness: 0.3 });
  const handle1 = new THREE.Mesh(handleGeometry, handleMaterial);
  handle1.position.set(-0.8, 1.4, 0);
  handle1.rotation.z = Math.PI / 6;
  group.add(handle1);
  const handle2 = new THREE.Mesh(handleGeometry, handleMaterial);
  handle2.position.set(0.8, 1.4, 0);
  handle2.rotation.z = -Math.PI / 6;
  group.add(handle2);

  bag = group;
  scene.add(bag);
}

// 색상 변경
function updateBagColor(color) {
  currentColor = color;
  if (!bag) return;
  bag.traverse((child) => {
    if (child.isMesh) {
      child.material.color.set(color);
    }
  });
}

// Swatch UI
function initSwatches() {
  const swatches = document.querySelectorAll('.swatch');
  swatches.forEach((btn) => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      updateBagColor(color);
      swatches.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  // 첫 번째 활성화
  if (swatches[0]) {
    swatches[0].classList.add('active');
    updateBagColor(swatches[0].dataset.color);
  }
}

// 신상품 데이터 (localStorage 우선, 없으면 기본 더미)
function loadNewProducts() {
  const raw = localStorage.getItem('vibeBagshopNewProducts');
  if (raw) return JSON.parse(raw);
  return [
    { id: 101, name: 'Neo Mini', price: '₩99,000', desc: '미니멀한 디자인의 신상 미니백.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Neo+Mini' },
    { id: 102, name: 'Arc Tote', price: '₩159,000', desc: '아치형 라인이 돋보이는 토트백.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Arc+Tote' },
    { id: 103, name: 'Luna Clutch', price: '₩79,000', desc: '달빛을 닮은 은은한 클러치.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Luna+Clutch' },
    { id: 104, name: 'Flex Cross', price: '₩119,000', desc: '유연한 소재와 편안한 착용감.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Flex+Cross' },
    { id: 105, name: 'Pod Set', price: '₩69,000', desc: '소품 정리에 최적화된 파우치 세트.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Pod+Set' },
    { id: 106, name: 'Wave Bag', price: '₩139,000', desc: '파도 형태의 독특한 디자인.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Wave+Bag' },
    { id: 107, name: 'Cube Pouch', price: '₩49,000', desc: '큐브 형태의 사각 파우치.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Cube+Pouch' },
    { id: 108, name: 'Ring Bag', price: '₩89,000', desc: '링 장식이 포인트인 백.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Ring+Bag' },
  ];
}
let newProducts = loadNewProducts();

// MD 추천 데이터 (localStorage 1개, 없으면 기본 더미)
function loadMDProduct() {
  const raw = localStorage.getItem('vibeBagshopMDProduct');
  if (raw) return JSON.parse(raw);
  return {
    id: 999,
    name: 'VIBE Curve Mini',
    price: '₩189,000',
    desc: '빛에 따라 달라지는 컬러, 손에 착 감기는 실루엣.',
    image: 'https://via.placeholder.com/300x300/ddd/999?text=MD+Curve',
  };
}
let mdProduct = loadMDProduct();

// 인기상품 데이터 로드 (localStorage 우선, 없으면 기본 더미)
function loadPopularProducts() {
  const raw = localStorage.getItem('vibeBagshopProducts');
  if (raw) {
    return JSON.parse(raw);
  }
  // 기본 더미 데이터 (이미지는 임시 placeholder)
  return [
    { id: 1, name: 'Vibe Tote', price: '₩149,000', desc: '데일리와 비즈니스를 모두 커버하는 토트백. 내수성과 수납이 뛰어납니다.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Tote' },
    { id: 2, name: 'Curve Cross', price: '₩119,000', desc: '유니크한 커브 라인의 크로스백. 가볍고 편안한 착용감이 특징입니다.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Cross' },
    { id: 3, name: 'Mini Clutch', price: '₩89,000', desc: '파티와 미팅에 어울리는 미니 클러치. 필수품만 수납 가능한 사이즈입니다.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Clutch' },
    { id: 4, name: 'Weekender', price: '₩229,000', desc: '주말 여행을 위한 위켄더백. 대용량과 세련된 디자인을 모두 잡았습니다.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Weekender' },
    { id: 5, name: 'Sling Bag', price: '₩99,000', desc: '액티브한 라이프스타일을 위한 슬링백. 움직임에 방해되지 않습니다.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Sling' },
    { id: 6, name: 'Bucket Hat', price: '₩79,000', desc: '트렌디한 버킷백. 캐주얼과 포멀 모두 잘 어울립니다.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Bucket' },
    { id: 7, name: 'Travel Set', price: '₩179,000', desc: '여행 필수품을 정리하는 트래블 세트. 기능성과 디자인을 모두 챙겼습니다.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Travel' },
    { id: 8, name: 'Pouch Trio', price: '₩59,000', desc: '3종 세트 파우치. 화장품, 소지품, 전자기기까지 깔끔하게 정리하세요.', image: 'https://via.placeholder.com/300x300/ddd/999?text=Pouch' },
  ];
}
let popularProducts = loadPopularProducts();

// 상품 카드 생성
function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  const imgContent = product.image
    ? `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
    : `<div style="font-size:48px;color:#d1d5db;">🛍</div>`;
  card.innerHTML = `
    <div class="product-card__img">${imgContent}</div>
    <div class="product-card__body">
      <h3 class="product-card__name">${product.name}</h3>
      <p class="product-card__price">${product.price}</p>
    </div>
  `;
  // 클릭 시 상세 모달 열기
  card.addEventListener('click', () => {
    openDetailModal(product);
  });
  return card;
}

// MD 추천 섹션 렌더
function renderMDSection() {
  const nameEl = document.getElementById('mdName');
  const priceEl = document.getElementById('mdPrice');
  if (!nameEl || !priceEl) return;
  nameEl.textContent = mdProduct.name;
  priceEl.textContent = mdProduct.price;
}

// 신상품 슬라이더 렌더 (최대 6개)
function renderNewSlider() {
  const track = document.getElementById('newTrack');
  if (!track) return;
  const toShow = newProducts.slice(0, 6);
  toShow.forEach((p) => track.appendChild(createProductCard(p)));
}

// 신상품 슬라이더 내비게이션
function initNewSliderNav() {
  const prevBtn = document.getElementById('newPrevBtn');
  const nextBtn = document.getElementById('newNextBtn');
  const viewport = document.getElementById('newSliderViewport');
  if (!prevBtn || !nextBtn || !viewport) return;

  prevBtn.addEventListener('click', () => {
    viewport.scrollBy({ left: -344, behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    viewport.scrollBy({ left: 344, behavior: 'smooth' });
  });
}

// 신상품 더보기 모달
function initNewModal() {
  const moreBtn = document.getElementById('newMoreBtn');
  const modal = document.getElementById('newMoreModal');
  const closeBtn = document.getElementById('closeNewModalBtn');
  const modalGrid = document.getElementById('newModalGrid');
  if (!moreBtn || !modal || !closeBtn || !modalGrid) return;

  newProducts.forEach((p) => modalGrid.appendChild(createProductCard(p)));

  moreBtn.addEventListener('click', () => modal.showModal());
  closeBtn.addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
}

// 슬라이더 렌더 (최대 6개)
function renderSlider() {
  const track = document.getElementById('popularTrack');
  if (!track) return;
  const toShow = popularProducts.slice(0, 6);
  toShow.forEach((p) => track.appendChild(createProductCard(p)));
}

// 슬라이더 내비게이션
function initSliderNav() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const viewport = document.getElementById('sliderViewport');
  if (!prevBtn || !nextBtn || !viewport) return;

  prevBtn.addEventListener('click', () => {
    viewport.scrollBy({ left: -344, behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    viewport.scrollBy({ left: 344, behavior: 'smooth' });
  });
}

// 모달 (더보기)
function initModal() {
  const moreBtn = document.getElementById('moreBtn');
  const modal = document.getElementById('moreModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const modalGrid = document.getElementById('modalGrid');
  if (!moreBtn || !modal || !closeBtn || !modalGrid) return;

  // 모달 콘텐츠 채우기
  popularProducts.forEach((p) => modalGrid.appendChild(createProductCard(p)));

  // 열기/닫기
  moreBtn.addEventListener('click', () => {
    modal.showModal();
  });
  closeBtn.addEventListener('click', () => {
    modal.close();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
}

// 상세 모달 열기
function openDetailModal(product) {
  const modal = document.getElementById('detailModal');
  const nameEl = document.getElementById('detailName');
  const priceEl = document.getElementById('detailPrice');
  const descEl = document.getElementById('detailDesc');
  const imgEl = document.getElementById('detailImg');
  if (!modal || !nameEl || !priceEl || !descEl || !imgEl) return;

  nameEl.textContent = product.name;
  priceEl.textContent = product.price;
  descEl.textContent = product.desc;
  imgEl.innerHTML = product.image
    ? `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;">`
    : `<div style="font-size:120px;color:#d1d5db;">🛍</div>`;
  modal.showModal();
}

// 상세 모달 닫기
function initDetailModal() {
  const modal = document.getElementById('detailModal');
  const closeBtn = document.getElementById('closeDetailBtn');
  if (!modal || !closeBtn) return;

  closeBtn.addEventListener('click', () => {
    modal.close();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
}

// 부드러운 스크롤 (앵커)
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// 검색바 관련
function openSearch() {
  const bar = document.getElementById('searchBar');
  const input = document.getElementById('searchInput');
  if (!bar || !input) return;
  bar.classList.add('open');
  setTimeout(() => input.focus(), 300);
}
function closeSearch() {
  const bar = document.getElementById('searchBar');
  const input = document.getElementById('searchInput');
  if (!bar || !input) return;
  bar.classList.remove('open');
  input.value = '';
  clearSearchHighlights(); // 하이라이트 초기화
}

// 검색 기능: 상품명 필터링 + 하이라이트
function performSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    clearSearchHighlights();
    return;
  }
  // 모든 상품 카드 순회
  document.querySelectorAll('.product-card').forEach((card) => {
    const nameEl = card.querySelector('.product-card__name');
    if (!nameEl) return;
    const name = nameEl.textContent.toLowerCase();
    if (name.includes(q)) {
      card.style.display = '';
      // 하이라이트
      const original = nameEl.textContent;
      const regex = new RegExp(`(${query})`, 'gi');
      nameEl.innerHTML = original.replace(regex, '<mark>$1</mark>');
    } else {
      card.style.display = 'none';
    }
  });
}
function clearSearchHighlights() {
  document.querySelectorAll('.product-card').forEach((card) => {
    card.style.display = '';
    const nameEl = card.querySelector('.product-card__name');
    if (nameEl) nameEl.innerHTML = nameEl.textContent;
  });
}

function initSearch() {
  const toggleBtn = document.getElementById('searchToggleBtn');
  const closeBtn = document.getElementById('closeSearchBtn');
  const input = document.getElementById('searchInput');
  if (!toggleBtn || !closeBtn || !input) return;

  toggleBtn.addEventListener('click', openSearch);
  closeBtn.addEventListener('click', closeSearch);
  input.addEventListener('input', (e) => performSearch(e.target.value));
  // ESC 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });
}

// 장바구니 관련
let cart = [];

function loadCart() {
  const raw = localStorage.getItem('vibeBagshopCart');
  cart = raw ? JSON.parse(raw) : [];
}

function saveCart() {
  localStorage.setItem('vibeBagshopCart', JSON.stringify(cart));
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

function addToCart(product) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  updateCartBadge();
  renderCart();
  showCartToast();
}

// 장바구니 알림 팝업
function showCartToast() {
  const modal = document.getElementById('cartToast');
  const closeBtn = document.getElementById('cartToastCloseBtn');
  if (!modal || !closeBtn) return;
  modal.showModal();
  closeBtn.onclick = () => modal.close();
  modal.onclick = (e) => {
    if (e.target === modal) modal.close();
  };
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  updateCartBadge();
  renderCart();
}

function updateQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  updateCartBadge();
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const empty = document.getElementById('cartEmpty');
  const totalEl = document.getElementById('cartTotal');
  if (!container || !empty || !totalEl) return;

  if (cart.length === 0) {
    container.style.display = 'none';
    empty.style.display = 'block';
    totalEl.textContent = '₩0';
    return;
  }

  container.style.display = 'flex';
  empty.style.display = 'none';

  container.innerHTML = cart.map((item) => {
    const imgContent = item.image
      ? `<img src="${item.image}" alt="${item.name}">`
      : `<div style="font-size:24px;color:#d1d5db;">🛍</div>`;
    return `
      <div class="cart-item">
        <div class="cart-item__img">${imgContent}</div>
        <div class="cart-item__info">
          <h4 class="cart-item__name">${item.name}</h4>
          <p class="cart-item__price">${item.price}</p>
          <div class="cart-item__controls">
            <div class="cart-item__qty">
              <button type="button" onclick="updateQty(${item.id}, -1)">−</button>
              <span>${item.qty}</span>
              <button type="button" onclick="updateQty(${item.id}, 1)">+</button>
            </div>
            <button class="cart-item__remove" type="button" onclick="removeFromCart(${item.id})">삭제</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // 총합 계산 (단순화: ₩ 제거 후 숫자로 변환, 수량 곱)
  const total = cart.reduce((sum, item) => {
    const num = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
    return sum + num * item.qty;
  }, 0);
  totalEl.textContent = `₩${total.toLocaleString()}`;
}

function openCart() {
  const sidebar = document.getElementById('cartSidebar');
  if (!sidebar) return;
  sidebar.classList.add('open');
  renderCart();
}

function closeCart() {
  const sidebar = document.getElementById('cartSidebar');
  if (!sidebar) return;
  sidebar.classList.remove('open');
}

function initCart() {
  loadCart();
  updateCartBadge();

  // 장바구니 버튼
  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('closeCartBtn')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

  // 상세 모달 장바구니 버튼
  document.getElementById('detailAddToCartBtn')?.addEventListener('click', () => {
    const nameEl = document.getElementById('detailName');
    const priceEl = document.getElementById('detailPrice');
    const descEl = document.getElementById('detailDesc');
    const imgEl = document.querySelector('#detailImg img');
    if (!nameEl || !priceEl || !descEl) return;
    const product = {
      id: Date.now(), // 임시 id
      name: nameEl.textContent,
      price: priceEl.textContent,
      desc: descEl.textContent,
      image: imgEl ? imgEl.src : null,
    };
    addToCart(product);
  });

  // 상품 카드 장바구니 버튼 (동적 바인딩)
  document.addEventListener('click', (e) => {
    if (e.target.matches('.btn--ghost') && e.target.textContent.trim() === '장바구니') {
      const card = e.target.closest('.product-card');
      if (!card) return;
      const name = card.querySelector('.product-card__name')?.textContent;
      const price = card.querySelector('.product-card__price')?.textContent;
      const img = card.querySelector('.product-card__img img');
      if (!name || !price) return;
      const product = {
        id: Date.now(),
        name,
        price,
        desc: '',
        image: img ? img.src : null,
      };
      addToCart(product);
    }
  });
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  initThree();
  initSwatches();
  renderMDSection();
  renderNewSlider();
  initNewSliderNav();
  initNewModal();
  renderSlider();
  initSliderNav();
  initModal();
  initDetailModal();
  initSearch();
  initCart();
  initSmoothScroll();
});
