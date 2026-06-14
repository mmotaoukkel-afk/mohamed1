export const voiceSearchBridge = {
  postMessage: null
};

export const getHtmlContent = (modelUri, isDark) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: transparent !important;
    }
    #canvas-container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #loading {
      position: absolute;
      color: ${isDark ? '#E6C5C5' : '#B76E79'};
      font-family: sans-serif;
      font-size: 14px;
      font-weight: 500;
      pointer-events: none;
      transition: opacity 0.5s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .spinner {
      width: 30px;
      height: 30px;
      border: 3px solid rgba(183, 110, 121, 0.2);
      border-top-color: #B76E79;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    #error-msg {
      position: absolute;
      color: #ff4d4d;
      font-family: sans-serif;
      font-size: 12px;
      text-align: center;
      padding: 20px;
      display: none;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
  <div id="canvas-container">
    <div id="loading">
      <div class="spinner"></div>
      <div id="loading-text">جاري تحضير مساعدكِ الذكي 3D...</div>
    </div>
    <div id="error-msg">فشل تحميل المساعد ثلاثي الأبعاد. تأكد من الاتصال بالإنترنت.</div>
  </div>

  <script>
    let scene, camera, renderer, model;
    let clock = new THREE.Clock();
    let currentAnimationState = 'idle';
    let targetScale = 1;
    let baseScale = 1;
    let pulseSpeed = 1;
    let bobbingAmount = 0.04;
    let bobbingSpeed = 1.5;

    const container = document.getElementById('canvas-container');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error-msg');

    function init() {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.set(0, 0, 5);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(5, 10, 7);
      dirLight.castShadow = true;
      scene.add(dirLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
      fillLight.position.set(-5, 2, -5);
      scene.add(fillLight);

      const pointLight = new THREE.PointLight(0xB76E79, 1.5, 10);
      pointLight.position.set(0, -2, 2);
      scene.add(pointLight);

      const loader = new THREE.GLTFLoader();
      const modelUrl = "${modelUri}";

      loader.load(
        modelUrl,
        function(gltf) {
          model = gltf.scene;
          scene.add(model);
          loadingEl.style.opacity = 0;
          setTimeout(() => loadingEl.remove(), 500);

          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          model.position.x = -center.x;
          model.position.y = -center.y;
          model.position.z = -center.z;

          const pivot = new THREE.Group();
          scene.add(pivot);
          pivot.add(model);
          model = pivot;

          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 * Math.tan(fov / 2));
          cameraZ *= 2.0;
          camera.position.z = cameraZ;
          camera.position.y = 0;
          camera.lookAt(new THREE.Vector3(0, 0, 0));

          baseScale = 1.0;
          model.scale.set(baseScale, baseScale, baseScale);

          animate();
        },
        function(xhr) {
          if (xhr.total > 0) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            document.getElementById('loading-text').innerText = "جاري تحميل المساعد ثلاثي الأبعاد... " + percent + "%";
          }
        },
        function(error) {
          console.error('An error happened loading GLTF:', error);
          loadingEl.style.display = 'none';
          errorEl.style.display = 'block';
        }
      );

      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = false;
      controls.autoRotate = false;

      window.addEventListener('resize', onWindowResize);
    }

    function onWindowResize() {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          updateAnimationState(data.value);
        }
      } catch (e) {
        console.error("Error parsing postMessage data:", e);
      }
    });

    document.addEventListener("message", function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          updateAnimationState(data.value);
        }
      } catch (e) {
        console.error("Error parsing document message data:", e);
      }
    });

    function updateAnimationState(state) {
      currentAnimationState = state;
      switch(state) {
        case 'listening':
          targetScale = 1.15;
          pulseSpeed = 4.0;
          bobbingAmount = 0.15;
          bobbingSpeed = 4.0;
          break;
        case 'processing':
          targetScale = 1.0;
          pulseSpeed = 6.0;
          bobbingAmount = 0.05;
          bobbingSpeed = 6.0;
          break;
        case 'speaking':
          targetScale = 1.1;
          pulseSpeed = 2.5;
          bobbingAmount = 0.12;
          bobbingSpeed = 2.5;
          break;
        case 'error':
          targetScale = 0.9;
          pulseSpeed = 1.0;
          bobbingAmount = 0.02;
          bobbingSpeed = 1.0;
          break;
        case 'idle':
        default:
          targetScale = 1.0;
          pulseSpeed = 1.0;
          bobbingAmount = 0.04;
          bobbingSpeed = 1.5;
          break;
      }
    }

    function animate() {
      requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      if (model) {
        let roll = 0;   // Z rotation (tilt left/right)
        let pitch = 0;  // X rotation (tilt forward/backward)
        let yaw = 0;    // Y rotation (turn left/right)
        let translateY = 0; // Y translation (bobbing)

        switch(currentAnimationState) {
          case 'listening':
            // Listening: Tilt forward slightly (attentive interest) + gentle tilt
            pitch = 0.15;
            roll = Math.sin(time * 3) * 0.05;
            translateY = Math.sin(time * 3.0) * 0.06;
            break;
          case 'processing':
            // Processing: Rotate left/right slightly (pondering)
            yaw = Math.sin(time * 4) * 0.1;
            translateY = Math.sin(time * 5.0) * 0.04;
            break;
          case 'speaking':
            // Speaking: Happy left-right tilting (welcome/speaking motion) + rapid bobbing
            roll = Math.sin(time * 8) * 0.12; 
            pitch = Math.sin(time * 4) * 0.04; 
            translateY = Math.sin(time * 6.0) * 0.08;
            break;
          case 'error':
            // Error: Shake head side-to-side (shaking "no")
            yaw = Math.sin(time * 12) * 0.25; 
            translateY = Math.sin(time * 1.5) * 0.02;
            break;
          case 'idle':
          default:
            // Idle: Gentle hover float
            translateY = Math.sin(time * 1.5) * 0.03;
            roll = Math.sin(time * 0.8) * 0.02;
            break;
        }

        // Apply rotations and translations
        model.rotation.x = pitch;
        model.rotation.y = yaw;
        model.rotation.z = roll;
        model.position.y = translateY;

        // Scaling interpolation
        const currentScale = model.scale.x;
        const scaleStep = (targetScale - currentScale) * 0.1;
        const newScale = currentScale + scaleStep;
        
        let pulse = 0;
        if (currentAnimationState === 'listening') {
          pulse = Math.sin(time * 10) * 0.02;
        } else if (currentAnimationState === 'speaking') {
          pulse = Math.sin(time * 8) * 0.03;
        }
        
        model.scale.set(newScale + pulse, newScale + pulse, newScale + pulse);
      }

      renderer.render(scene, camera);
    }

    window.onload = init;
  </script>
</body>
</html>
  `;
};
