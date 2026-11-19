/** ThreeJS管理：固定中景构图，模型旋转：玩家逆时针90°看右，怪物顺时针90°看左 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { dom } from './gameState.js';

// 玩家场景
const playerScene = new THREE.Scene();
playerScene.background = new THREE.Color(0x111122);
const playerCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const playerRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
playerRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
playerRenderer.shadowMap.enabled = true;
dom.playerViewport.appendChild(playerRenderer.domElement);

// 敌人场景
const enemyScene = new THREE.Scene();
enemyScene.background = new THREE.Color(0x1a0a0a);
const enemyCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const enemyRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
enemyRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
enemyRenderer.shadowMap.enabled = true;
dom.enemyViewport.appendChild(enemyRenderer.domElement);

export const modelRefs = {
    player: {
        model: null,
        mixer: null,
        scene: playerScene,
        camera: playerCamera,
        renderer: playerRenderer,
        viewport: dom.playerViewport
    },
    enemy: {
        model: null,
        mixer: null,
        scene: enemyScene,
        camera: enemyCamera,
        renderer: enemyRenderer,
        viewport: dom.enemyViewport
    }
};

function setupLights(scene) {
    scene.add(new THREE.AmbientLight(0x404060, 1.4));

    const dir = new THREE.DirectionalLight(0xffffff, 1.7);
    dir.position.set(3, 5, 4);
    dir.castShadow = true;
    scene.add(dir);

    const fill = new THREE.DirectionalLight(0x88aaff, 0.8);
    fill.position.set(-3, 2, 3);
    scene.add(fill);
}

setupLights(playerScene);
setupLights(enemyScene);

/**
 * 核心适配：模型大小已调好
 * 玩家：Y轴逆时针90°(-Math.PI/2)看向画面右侧
 * 敌人：Y轴顺时针90°(Math.PI/2)看向画面左侧
 */
export function fitModelToViewport(ref, vw, vh) {
    const { model, camera, renderer } = ref;
    if (!model || vw <= 0 || vh <= 0) return;

    // 每次重新开始，避免累积位移和缩放旋转
    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);
    model.rotation.set(0,0,0);

    // 强制关闭视锥剔除，防止模型局部消失
    model.traverse((n) => {
        if (n.isMesh) {
            n.frustumCulled = false;
        }
    });

    // 计算模型包围盒
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    if (size.y <= 0) return;

    // 相机位置
    const cameraDist = 10.0;
    const cameraHeight = 0.5;
    camera.position.set(0, cameraHeight, cameraDist);

    // 看向模型中部偏上一点
    const lookAtY = 3;
    camera.lookAt(0, lookAtY, 0);

    // 计算合适缩放
    const fovRad = camera.fov * Math.PI / 180;
    const visibleHeight = 2 * Math.tan(fovRad / 2) * cameraDist;
    const visibleWidth = visibleHeight * (vw / vh);

    const targetHeight = visibleHeight * 0.55;
    const scale = targetHeight / size.y;
    const extraScale = 1;
    model.scale.setScalar(scale * extraScale);

    // ========== 模型朝向旋转 ==========
    if(ref === modelRefs.player){
        // 玩家：Y轴逆时针旋转90度，看向画面右侧
        model.rotation.y = Math.PI / 2;
    }else if(ref === modelRefs.enemy){
        // 敌人：Y轴顺时针旋转90度，看向画面左侧
        model.rotation.y = -Math.PI / 2;
    }

    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    renderer.setSize(vw, vh);
}

/**
 * 内置兜底模型：保证离线或网络失败时一定能看到角色
 */
function createFallbackCharacter(key) {
    const group = new THREE.Group();

    if (key === 'player') {
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            metalness: 0.3,
            roughness: 0.6
        });

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), bodyMat);
        head.position.y = 0.7;

        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 12), bodyMat);
        torso.position.y = 0.2;

        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 8), bodyMat);
        legL.position.set(-0.22, -0.45, 0);

        const legR = legL.clone();
        legR.position.set(0.22, -0.45, 0);

        group.add(head, torso, legL, legR);
    } else {
        const mat = new THREE.MeshStandardMaterial({
            color: 0xdd3333,
            metalness: 0.6,
            roughness: 0.4
        });

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.4), mat);
        head.position.y = 0.7;

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.65, 0.35), mat);
        torso.position.y = 0.15;

        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.22), mat);
        legL.position.set(-0.25, -0.48, 0);

        const legR = legL.clone();
        legR.position.set(0.25, -0.48, 0);

        group.add(head, torso, legL, legR);
    }

    group.traverse((n) => {
        if (n.isMesh) {
            n.castShadow = true;
            n.receiveShadow = true;
            n.frustumCulled = false;
        }
    });

    return group;
}

const loader = new GLTFLoader();

export function loadModel(url, key, onLoaded) {
    const ref = modelRefs[key];
    const loadingEl = key === 'player' ? dom.playerLoading : dom.enemyLoading;

    let loadTimeout = setTimeout(() => {
        console.warn(`${key}模型加载超时，切换内置占位模型`);
        useFallback();
    }, 6000);

    function useFallback() {
        clearTimeout(loadTimeout);

        const fallbackModel = createFallbackCharacter(key);
        ref.scene.add(fallbackModel);
        ref.model = fallbackModel;
        ref.mixer = null;

        loadingEl.style.display = 'none';

        requestAnimationFrame(() => {
            const vw = ref.viewport.clientWidth;
            const vh = ref.viewport.clientHeight;
            fitModelToViewport(ref, vw, vh);
        });

        if (onLoaded) onLoaded();
    }

    loader.load(
        url,
        (gltf) => {
            clearTimeout(loadTimeout);

            const model = gltf.scene;
            ref.scene.add(model);
            ref.model = model;

            model.traverse((n) => {
                if (n.isMesh) {
                    n.castShadow = true;
                    n.receiveShadow = true;
                    n.frustumCulled = false;
                }
            });

            let mixer = null;
            if (gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(model);

                const clip =
                    (key === 'player'
                        ? THREE.AnimationClip.findByName(gltf.animations, 'Walk')
                        : null) || gltf.animations[0];

                if (clip) {
                    mixer.clipAction(clip).play();
                }

                ref.mixer = mixer;
            }

            requestAnimationFrame(() => {
                const vw = ref.viewport.clientWidth;
                const vh = ref.viewport.clientHeight;
                fitModelToViewport(ref, vw, vh);

                loadingEl.style.display = 'none';

                if (onLoaded) onLoaded();
            });
        },
        undefined,
        (err) => {
            console.error(`${key}网络glb加载失败`, err);
            useFallback();
        }
    );
}

// 渲染循环
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (modelRefs.player.mixer) {
        modelRefs.player.mixer.update(delta);
    }

    if (modelRefs.enemy.mixer) {
        modelRefs.enemy.mixer.update(delta);
    }

    playerRenderer.render(playerScene, playerCamera);
    enemyRenderer.render(enemyScene, enemyCamera);
}

animate();

// 窗口变化时重新适配
export function handleResize() {
    for (const key of ['player', 'enemy']) {
        const ref = modelRefs[key];
        const vw = ref.viewport.clientWidth;
        const vh = ref.viewport.clientHeight;

        if (vw > 0 && vh > 0) {
            if (ref.model) {
                fitModelToViewport(ref, vw, vh);
            } else {
                ref.camera.aspect = vw / vh;
                ref.camera.updateProjectionMatrix();
                ref.renderer.setSize(vw, vh);
            }
        }
    }
}

window.addEventListener('resize', handleResize);
requestAnimationFrame(handleResize);

// 【修复之前写反的模型url】玩家=狐狸Fox；敌人=RobotExpressive机器人
loadModel(
    'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/Fox/glTF-Binary/Fox.glb',
    'enemy'
);

loadModel(
    'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    'player'
);
