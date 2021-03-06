import { frustum, ray } from '../../geometry';
import { GFXClearFlag } from '../../gfx/define';
import { lerp, Mat4, Rect, toRadian, Vec3, Color } from '../../math';
import { CAMERA_DEFAULT_MASK } from '../../pipeline/define';
import { RenderView } from '../../pipeline';
import { Node } from '../../scene-graph';
import { RenderScene } from './render-scene';
import { GFXDevice } from '../../gfx';
import { legacyCC } from '../../global-exports';
import { RenderWindow } from '../core/render-window';
import { CameraHandle, CameraPool, CameraView, FrustumHandle, FrustumPool, FrustumView, NULL_HANDLE, SceneHandle } from '../core/memory-pools';
import { JSB } from 'internal:constants';

export enum CameraFOVAxis {
    VERTICAL,
    HORIZONTAL,
}

export enum CameraProjection {
    ORTHO,
    PERSPECTIVE,
}

export enum CameraAperture {
    F1_8,
    F2_0,
    F2_2,
    F2_5,
    F2_8,
    F3_2,
    F3_5,
    F4_0,
    F4_5,
    F5_0,
    F5_6,
    F6_3,
    F7_1,
    F8_0,
    F9_0,
    F10_0,
    F11_0,
    F13_0,
    F14_0,
    F16_0,
    F18_0,
    F20_0,
    F22_0,
}

export enum CameraISO {
    ISO100,
    ISO200,
    ISO400,
    ISO800,
}

export enum CameraShutter {
    D1,
    D2,
    D4,
    D8,
    D15,
    D30,
    D60,
    D125,
    D250,
    D500,
    D1000,
    D2000,
    D4000,
}

const FSTOPS: number[] = [1.8, 2.0, 2.2, 2.5, 2.8, 3.2, 3.5, 4.0, 4.5, 5.0, 5.6, 6.3, 7.1, 8.0, 9.0, 10.0, 11.0, 13.0, 14.0, 16.0, 18.0, 20.0, 22.0];
const SHUTTERS: number[] = [1.0, 1.0 / 2.0, 1.0 / 4.0, 1.0 / 8.0, 1.0 / 15.0, 1.0 / 30.0, 1.0 / 60.0, 1.0 / 125.0,
    1.0 / 250.0, 1.0 / 500.0, 1.0 / 1000.0, 1.0 / 2000.0, 1.0 / 4000.0];
const ISOS: number[] = [100.0, 200.0, 400.0, 800.0];

export interface ICameraInfo {
    name: string;
    node: Node;
    projection: number;
    targetDisplay?: number;
    window?: RenderWindow | null;
    priority: number;
    pipeline?: string;
    flows?: string[];
}

const v_a = new Vec3();
const v_b = new Vec3();
const _tempMat1 = new Mat4();
const _tempMat2 = new Mat4();

export const SKYBOX_FLAG = GFXClearFlag.STENCIL << 1;

export class Camera {

    public isWindowSize: boolean = true;
    public screenScale: number;

    private _device: GFXDevice;
    private _scene: RenderScene | null = null;
    private _node: Node | null = null;
    private _name: string | null = null;
    private _enabled: boolean = false;
    private _proj: CameraProjection = -1;
    private _aspect: number;
    private _orthoHeight: number = 10.0;
    private _fovAxis = CameraFOVAxis.VERTICAL;
    private _fov: number = toRadian(45);
    private _nearClip: number = 1.0;
    private _farClip: number = 1000.0;
    private _clearColor: Color = new Color(51, 51, 51, 255);
    private _viewport: Rect = new Rect(0, 0, 1, 1);
    private _isProjDirty = true;
    private _matView: Mat4 = new Mat4();
    private _matViewInv: Mat4 | null = null;
    private _matProj: Mat4 = new Mat4();
    private _matProjInv: Mat4 = new Mat4();
    private _matViewProj: Mat4 = new Mat4();
    private _matViewProjInv: Mat4 = new Mat4();
    private _frustum: frustum = new frustum();
    private _forward: Vec3 = new Vec3();
    private _position: Vec3 = new Vec3();
    private _view: RenderView | null = null;
    private _visibility = CAMERA_DEFAULT_MASK;
    private _priority: number = 0;
    private _aperture: CameraAperture = CameraAperture.F16_0;
    private _apertureValue: number;
    private _shutter: CameraShutter = CameraShutter.D125;
    private _shutterValue: number = 0.0;
    private _iso: CameraISO = CameraISO.ISO100;
    private _isoValue: number = 0.0;
    private _ec: number = 0.0;
    private _poolHandle: CameraHandle = NULL_HANDLE;
    private _frustumHandle: FrustumHandle = NULL_HANDLE;

    constructor (device: GFXDevice) {
        this._device = device;
        this._apertureValue = FSTOPS[this._aperture];
        this._shutterValue = SHUTTERS[this._shutter];
        this._isoValue = ISOS[this._iso];

        this._aspect = this.screenScale = 1;
    }

    public initialize (info: ICameraInfo) {
        this._name = info.name;
        this._node = info.node;
        this._proj = info.projection;
        this._priority = info.priority || 0;

        this._aspect = this.screenScale = 1;
        const handle = this._poolHandle = CameraPool.alloc();
        CameraPool.set(handle, CameraView.WIDTH, 1);
        CameraPool.set(handle, CameraView.HEIGHT, 1);
        CameraPool.set(handle, CameraView.CLEAR_FLAG, GFXClearFlag.NONE);
        CameraPool.set(handle, CameraView.CLEAR_DEPTH, 1.0);
        CameraPool.set(handle, CameraView.NODE, this._node.handle);
        if (this._scene) CameraPool.set(handle, CameraView.SCENE, this._scene.handle);
        if (JSB) {
            this._frustumHandle = FrustumPool.alloc();
            CameraPool.set(handle, CameraView.FRUSTUM, this._frustumHandle);
        }

        this.updateExposure();
        this._view = legacyCC.director.root.createView({
            camera: this,
            name: this._name,
            priority: this._priority,
            flows: info.flows,
        });
        legacyCC.director.root.attachCamera(this);
        this.changeTargetWindow(info.window);

        console.log('Created Camera: ' + this._name + ' ' + CameraPool.get(handle
            , CameraView.WIDTH) + 'x' + CameraPool.get(handle, CameraView.HEIGHT));
    }

    public destroy () {
        legacyCC.director.root.detachCamera(this);
        if (this._view) {
            this._view.destroy();
            this._view = null;
        }
        this._name = null;
        if (this._poolHandle) {
            CameraPool.free(this._poolHandle);
            this._poolHandle = NULL_HANDLE;
            if (this._frustumHandle) {
                FrustumPool.free(this._frustumHandle);
                this._frustumHandle = NULL_HANDLE;
            }
        }
    }

    public attachToScene (scene: RenderScene) {
        this._scene = scene;
        CameraPool.set(this._poolHandle, CameraView.SCENE, scene.handle);
        if (this._view) {
            this._view.enable(true);
        }
    }

    public detachFromScene () {
        this._scene = null;
        CameraPool.set(this._poolHandle, CameraView.SCENE, 0 as unknown as SceneHandle);
        if (this._view) {
            this._view.enable(false);
        }
    }

    public resize (width: number, height: number) {
        const handle = this._poolHandle;
        CameraPool.set(handle, CameraView.WIDTH, width);
        CameraPool.set(handle, CameraView.HEIGHT, height);
        this._aspect = (width * this._viewport.width) / (height * this._viewport.height);
        this._isProjDirty = true;
    }

    public setFixedSize (width: number, height: number) {

        const handle = this._poolHandle;
        CameraPool.set(handle, CameraView.WIDTH, width);
        CameraPool.set(handle, CameraView.HEIGHT, height);
        this._aspect = (width * this._viewport.width) / (height * this._viewport.height);
        this.isWindowSize = false;
    }

    public update (forceUpdate = false) { // for lazy eval situations like the in-editor preview
        if (!this._node) return;

        // view matrix
        if (this._node.hasChangedFlags || forceUpdate) {
            Mat4.invert(this._matView, this._node.worldMatrix);
            CameraPool.setMat4(this._poolHandle, CameraView.MAT_VIEW, this._matView);

            this._forward.x = -this._matView.m02;
            this._forward.y = -this._matView.m06;
            this._forward.z = -this._matView.m10;
            this._node.getWorldPosition(this._position);
            CameraPool.setVec3(this._poolHandle, CameraView.POSITION, this._position);
            CameraPool.setVec3(this._poolHandle, CameraView.FORWARD, this._forward);
        }

        // projection matrix
        if (this._isProjDirty) {
            let projectionSignY = this._device.screenSpaceSignY;
            if (this._view && this._view.window.hasOffScreenAttachments) {
                projectionSignY *= this._device.UVSpaceSignY; // need flipping if drawing on render targets
            }
            if (this._proj === CameraProjection.PERSPECTIVE) {
                Mat4.perspective(this._matProj, this._fov, this._aspect, this._nearClip, this._farClip,
                    this._fovAxis === CameraFOVAxis.VERTICAL, this._device.clipSpaceMinZ, projectionSignY);
            } else {
                const x = this._orthoHeight * this._aspect;
                const y = this._orthoHeight;
                Mat4.ortho(this._matProj, -x, x, -y, y, this._nearClip, this._farClip,
                    this._device.clipSpaceMinZ, projectionSignY);
            }
            Mat4.invert(this._matProjInv, this._matProj);
            CameraPool.setMat4(this._poolHandle, CameraView.MAT_PROJ, this._matProj);
            CameraPool.setMat4(this._poolHandle, CameraView.MAT_PROJ_INV, this._matProjInv);
        }

        // view-projection
        if (this._node.hasChangedFlags || this._isProjDirty || forceUpdate) {
            Mat4.multiply(this._matViewProj, this._matProj, this._matView);
            Mat4.invert(this._matViewProjInv, this._matViewProj);
            this._frustum.update(this._matViewProj, this._matViewProjInv);
            CameraPool.setMat4(this._poolHandle, CameraView.MAT_VIEW_PROJ, this._matViewProj);
            CameraPool.setMat4(this._poolHandle, CameraView.MAT_VIEW_PROJ_INV, this._matViewProjInv);
            this.recordFrustumInSharedMemory();
        }

        this._isProjDirty = false;
    }

    public getSplitFrustum (out: frustum, nearClip: number, farClip: number) {
        if (!this._node) return;

        nearClip = Math.max(nearClip, this._nearClip);
        farClip = Math.min(farClip, this._farClip);

        // view matrix
        Mat4.invert(this._matView,  this._node.worldMatrix);
        CameraPool.setMat4(this._poolHandle, CameraView.MAT_VIEW, this._matView);

        // projection matrix
        if (this._proj === CameraProjection.PERSPECTIVE) {
            Mat4.perspective(_tempMat1, this._fov, this._aspect, nearClip, farClip,
                this._fovAxis === CameraFOVAxis.VERTICAL, this._device.clipSpaceMinZ, this._device.screenSpaceSignY);
        } else {
            const x = this._orthoHeight * this._aspect;
            const y = this._orthoHeight;
            Mat4.ortho(_tempMat1, -x, x, -y, y, nearClip, farClip,
                this._device.clipSpaceMinZ, this._device.screenSpaceSignY);
        }

        // view-projection
        Mat4.multiply(_tempMat2, _tempMat1, this._matView);
        Mat4.invert(_tempMat1, _tempMat2);
        out.update(_tempMat2, _tempMat1);
    }

    set node (val: Node) {
        this._node = val;
    }

    get node () {
        return this._node!;
    }

    set enabled (val) {
        this._enabled = val;
        if (this._view) {
            this._view.enable(val);
        }
    }

    get enabled () {
        return this._enabled;
    }

    get view (): RenderView {
        return this._view!;
    }

    set orthoHeight (val) {
        this._orthoHeight = val;
        this._isProjDirty = true;
    }

    get orthoHeight () {
        return this._orthoHeight;
    }

    set projectionType (val) {
        this._proj = val;
        this._isProjDirty = true;
    }

    get projectionType () {
        return this._proj;
    }

    set fovAxis (axis) {
        this._fovAxis = axis;
        this._isProjDirty = true;
    }

    get fovAxis () {
        return this._fovAxis;
    }

    set fov (fov) {
        this._fov = fov;
        this._isProjDirty = true;
    }

    get fov () {
        return this._fov;
    }

    set nearClip (nearClip) {
        this._nearClip = nearClip;
        this._isProjDirty = true;
    }

    get nearClip () {
        return this._nearClip;
    }

    set farClip (farClip) {
        this._farClip = farClip;
        this._isProjDirty = true;
    }

    get farClip () {
        return this._farClip;
    }

    set clearColor (val) {
        this._clearColor = val;
        CameraPool.setVec4(this._poolHandle, CameraView.CLEAR_COLOR, val);
    }

    get clearColor () {
        return this._clearColor;
    }

    get viewport () {
        return this._viewport;
    }

    set viewport (val) {
        const signY = this._device.screenSpaceSignY;
        this._viewport.x = val.x;
        if (signY > 0) { this._viewport.y = val.y; }
        else { this._viewport.y = 1 - val.y - val.height; }
        this._viewport.width = val.width;
        this._viewport.height = val.height;
        CameraPool.setVec4(this._poolHandle, CameraView.VIEW_PORT, this._viewport);
    }

    get scene () {
        return this._scene;
    }

    get name () {
        return this._name;
    }

    get width () {
        return CameraPool.get(this._poolHandle, CameraView.WIDTH);
    }

    get height () {
        return CameraPool.get(this._poolHandle, CameraView.HEIGHT);
    }

    get aspect () {
        return this._aspect;
    }

    set matView (val) {
        this._matView = val;
        CameraPool.setMat4(this._poolHandle, CameraView.MAT_VIEW, this._matView);
    }

    get matView () {
        return this._matView;
    }

    set matViewInv (val: Mat4 | null) {
        this._matViewInv = val;
    }

    get matViewInv () {
        return this._matViewInv || this._node!.worldMatrix;
    }

    set matProj (val) {
        this._matProj = val;
        CameraPool.setMat4(this._poolHandle, CameraView.MAT_PROJ, this._matProj);
    }

    get matProj () {
        return this._matProj;
    }

    set matProjInv (val) {
        this._matProjInv = val;
        CameraPool.setMat4(this._poolHandle, CameraView.MAT_PROJ_INV, this._matProjInv);
    }

    get matProjInv () {
        return this._matProjInv;
    }

    set matViewProj (val) {
        this._matViewProj = val;
        CameraPool.setMat4(this._poolHandle, CameraView.MAT_VIEW_PROJ, this._matViewProj);
    }

    get matViewProj () {
        return this._matViewProj;
    }

    set matViewProjInv (val) {
        this._matViewProjInv = val;
        CameraPool.setMat4(this._poolHandle, CameraView.MAT_VIEW_PROJ_INV, this._matViewProjInv);
    }

    get matViewProjInv () {
        return this._matViewProjInv;
    }

    set frustum (val) {
        this._frustum = val;
        this.recordFrustumInSharedMemory();
    }

    get frustum () {
        return this._frustum;
    }

    set forward (val) {
        this._forward = val;
        CameraPool.setVec3(this._poolHandle, CameraView.FORWARD, this._forward);
    }

    get forward () {
        return this._forward;
    }

    set position (val) {
        this._position = val;
        CameraPool.setVec3(this._poolHandle, CameraView.POSITION, this._position);
    }

    get position () {
        return this._position;
    }

    set visibility (vis) {
        this._visibility = vis;
        if (this._view) {
            this._view.visibility = vis;
        }
    }
    get visibility () {
        return this._visibility;
    }

    get priority (): number {
        return this._view ? this._view.priority : -1;
    }

    set priority (val: number) {
        this._priority = val;
        if (this._view) {
            this._view.priority = this._priority;
        }
    }

    set aperture (val: CameraAperture) {
        this._aperture = val;
        this._apertureValue = FSTOPS[this._aperture];
        this.updateExposure();
    }

    get aperture (): CameraAperture {
        return this._aperture;
    }

    get apertureValue (): number {
        return this._apertureValue;
    }

    set shutter (val: CameraShutter) {
        this._shutter = val;
        this._shutterValue = SHUTTERS[this._shutter];
        this.updateExposure();
    }

    get shutter (): CameraShutter {
        return this._shutter;
    }

    get shutterValue (): number {
        return this._shutterValue;
    }

    set iso (val: CameraISO) {
        this._iso = val;
        this._isoValue = ISOS[this._iso];
        this.updateExposure();
    }

    get iso (): CameraISO {
        return this._iso;
    }

    get isoValue (): number {
        return this._isoValue;
    }

    set ec (val: number) {
        this._ec = val;
    }

    get ec (): number {
        return this._ec;
    }

    get exposure (): number {
        return CameraPool.get(this._poolHandle, CameraView.EXPOSURE);
    }

    set flows (val: string[]) {
        if (this._view) {
            this._view.setExecuteFlows(val);
        }
    }

    get clearFlag () : GFXClearFlag {
        return CameraPool.get(this._poolHandle, CameraView.CLEAR_FLAG);
    }

    set clearFlag (flag: GFXClearFlag) {
        CameraPool.set(this._poolHandle, CameraView.CLEAR_FLAG, flag);
    }

    get clearDepth () : number {
        return CameraPool.get(this._poolHandle, CameraView.CLEAR_DEPTH);
    }

    set clearDepth (depth: number) {
        CameraPool.set(this._poolHandle, CameraView.CLEAR_DEPTH, depth);
    }

    get clearStencil () : number {
        return CameraPool.get(this._poolHandle, CameraView.CLEAR_STENCIL);
    }

    set clearStencil (stencil: number) {
        CameraPool.set(this._poolHandle, CameraView.CLEAR_STENCIL, stencil);
    }

    get handle () : CameraHandle {
        return this._poolHandle;
    }

    public changeTargetWindow (window: RenderWindow | null = null) {
        const win = window || legacyCC.director.root.mainWindow;
        if (win && this._view) {
            this._view.window = win;
            this.resize(win.width, win.height);
        }
    }

    /**
     * transform a screen position to a world space ray
     */
    public screenPointToRay (out: ray, x: number, y: number): ray {
        const handle = this._poolHandle;
        const width = CameraPool.get(handle, CameraView.WIDTH);
        const height = CameraPool.get(handle, CameraView.HEIGHT);
        const cx = this._viewport.x * width;
        const cy = this._viewport.y * height;
        const cw = this._viewport.width * width;
        const ch = this._viewport.height * height;

        // far plane intersection
        Vec3.set(v_a, (x - cx) / cw * 2 - 1, (y - cy) / ch * 2 - 1, 1);
        v_a.y *= this._device.screenSpaceSignY;
        Vec3.transformMat4(v_a, v_a, this._matViewProjInv);

        if (this._proj === CameraProjection.PERSPECTIVE) {
            // camera origin
            if (this._node) { this._node.getWorldPosition(v_b); }
        } else {
            // near plane intersection
            Vec3.set(v_b, (x - cx) / cw * 2 - 1, (y - cy) / ch * 2 - 1, -1);
            v_b.y *= this._device.screenSpaceSignY;
            Vec3.transformMat4(v_b, v_b, this._matViewProjInv);
        }

        return ray.fromPoints(out, v_b, v_a);
    }

    /**
     * transform a screen position to world space
     */
    public screenToWorld (out: Vec3, screenPos: Vec3): Vec3 {
        const handle = this._poolHandle;
        const width = CameraPool.get(handle, CameraView.WIDTH);
        const height = CameraPool.get(handle, CameraView.HEIGHT);
        const cx = this._viewport.x * width;
        const cy = this._viewport.y * height;
        const cw = this._viewport.width * width;
        const ch = this._viewport.height * height;

        if (this._proj === CameraProjection.PERSPECTIVE) {
            // calculate screen pos in far clip plane
            Vec3.set(out,
                (screenPos.x - cx) / cw * 2 - 1,
                (screenPos.y - cy) / ch * 2 - 1,
                1.0,
            );

            // transform to world
            Vec3.transformMat4(out, out, this._matViewProjInv);

            // lerp to depth z
            if (this._node) { this._node.getWorldPosition(v_a); }

            Vec3.lerp(out, v_a, out, lerp(this._nearClip / this._farClip, 1, screenPos.z));
        } else {
            Vec3.set(out,
                (screenPos.x - cx) / cw * 2 - 1,
                (screenPos.y - cy) / ch * 2 - 1,
                screenPos.z * 2 - 1,
            );

            // transform to world
            Vec3.transformMat4(out, out, this.matViewProjInv);
        }

        return out;
    }

    /**
     * transform a world space position to screen space
     */
    public worldToScreen (out: Vec3, worldPos: Vec3): Vec3 {
        const handle = this._poolHandle;
        const width = CameraPool.get(handle, CameraView.WIDTH);
        const height = CameraPool.get(handle, CameraView.HEIGHT);
        const cx = this._viewport.x * width;
        const cy = this._viewport.y * height;
        const cw = this._viewport.width * width;
        const ch = this._viewport.height * height;

        Vec3.transformMat4(out, worldPos, this.matViewProj);

        out.x = cx + (out.x + 1) * 0.5 * cw;
        out.y = cy + (out.y + 1) * 0.5 * ch;
        out.z = out.z * 0.5 + 0.5;

        return out;
    }

    /**
     * transform a world space matrix to screen space
     * @param {Mat4} out the resulting vector
     * @param {Mat4} worldMatrix the world space matrix to be transformed
     * @param {number} width framebuffer width
     * @param {number} height framebuffer height
     * @returns {Mat4} the resulting vector
     */
    public worldMatrixToScreen (out: Mat4, worldMatrix: Mat4, width: number, height: number){
        Mat4.multiply(out, this._matViewProj, worldMatrix);
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        Mat4.identity(_tempMat1);
        Mat4.transform(_tempMat1, _tempMat1, Vec3.set(v_a, halfWidth, halfHeight, 0));
        Mat4.scale(_tempMat1, _tempMat1, Vec3.set(v_a, halfWidth, halfHeight, 1));

        Mat4.multiply(out, _tempMat1, out);

        return out;
    }

    private updateExposure () {
        const ev100 = Math.log2((this._apertureValue * this._apertureValue) / this._shutterValue * 100.0 / this._isoValue);
        CameraPool.set(this._poolHandle, CameraView.EXPOSURE, 0.833333 / Math.pow(2.0, ev100));
    }

    private recordFrustumInSharedMemory () {
        const frustumHandle = this._frustumHandle;
        const frstm = this._frustum;
        if (!frstm || frustumHandle === NULL_HANDLE) {
            return;
        }

        const vertices = frstm.vertices;
        let vertexOffset = FrustumView.VERTICES as const;
        for (let i = 0; i < 8; ++i) {
            FrustumPool.setVec3(frustumHandle, vertexOffset, vertices[i]);
            vertexOffset += 3;
        }

        const planes = frstm.planes;
        let planeOffset = FrustumView.PLANES as const;
        for (let i = 0; i < 6; i++, planeOffset += 4) {
            FrustumPool.setVec4(frustumHandle, planeOffset, planes[i]);
        }
    }
}
