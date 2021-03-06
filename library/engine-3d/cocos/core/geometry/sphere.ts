/**
 * @category geometry
 */

import { Mat4, Quat, Vec3 } from '../math';
import enums from './enums';
import aabb from './aabb';

const _v3_tmp = new Vec3();
const _offset = new Vec3();
const _min = new Vec3();
const _max = new Vec3();
function maxComponent (v: Vec3) { return Math.max(Math.max(v.x, v.y), v.z); }

/**
 * @en
 * Basic Geometry: sphere.
 * @zh
 * 基础几何 轴对齐球。
 */
// tslint:disable-next-line: class-name
export default class sphere {

    /**
     * @en
     * create a new sphere
     * @zh
     * 创建一个新的 sphere 实例。
     * @param cx 形状的相对于原点的 X 坐标。
     * @param cy 形状的相对于原点的 Y 坐标。
     * @param cz 形状的相对于原点的 Z 坐标。
     * @param r 球体的半径
     * @return {sphere} 返回一个 sphere。
     */
    public static create (cx: number, cy: number, cz: number, r: number): sphere {
        return new sphere(cx, cy, cz, r);
    }

    /**
     * @en
     * clone a new sphere
     * @zh
     * 克隆一个新的 sphere 实例。
     * @param {sphere} p 克隆的目标。
     * @return {sphere} 克隆出的示例。
     */
    public static clone (p: sphere): sphere {
        return new sphere(p.center.x, p.center.y, p.center.z, p.radius);
    }

    /**
     * @en
     * copy the values from one sphere to another
     * @zh
     * 将从一个 sphere 的值复制到另一个 sphere。
     * @param {sphere} out 接受操作的 sphere。
     * @param {sphere} a 被复制的 sphere。
     * @return {sphere} out 接受操作的 sphere。
     */
    public static copy (out: sphere, p: sphere): sphere {
        Vec3.copy(out.center, p.center);
        out.radius = p.radius;

        return out;
    }

    /**
     * @en
     * create a new bounding sphere from two corner points
     * @zh
     * 从两个点创建一个新的 sphere。
     * @param out - 接受操作的 sphere。
     * @param minPos - sphere 的最小点。
     * @param maxPos - sphere 的最大点。
     * @returns {sphere} out 接受操作的 sphere。
     */
    public static fromPoints (out: sphere, minPos: Vec3, maxPos: Vec3): sphere {
        Vec3.multiplyScalar(out.center, Vec3.add(_v3_tmp, minPos, maxPos), 0.5);
        out.radius = Vec3.subtract(_v3_tmp, maxPos, minPos).length() * 0.5;
        return out;
    }

    /**
     * @en
     * Set the components of a sphere to the given values
     * @zh
     * 将球体的属性设置为给定的值。
     * @param {sphere} out 接受操作的 sphere。
     * @param cx 形状的相对于原点的 X 坐标。
     * @param cy 形状的相对于原点的 Y 坐标。
     * @param cz 形状的相对于原点的 Z 坐标。
     * @param {number} r 半径。
     * @return {sphere} out 接受操作的 sphere。
     * @function
     */
    public static set (out: sphere, cx: number, cy: number, cz: number, r: number): sphere {
        out.center.x = cx;
        out.center.y = cy;
        out.center.z = cz;
        out.radius = r;

        return out;
    }

    /**
     * @zh
     * 球跟点合并
     */
    public static mergePoint (out: sphere, s: sphere, point: Vec3) {
        if (s.radius < 0.0) {
            out.center = point;
            out.radius = 0.0;
            return out;
        }

        Vec3.subtract(_offset, point, s.center);
        const dist = _offset.length();

        if (dist > s.radius) {
            const half = (dist - s.radius) * 0.5;
            out.radius += half;
            Vec3.multiplyScalar(_offset, _offset, half / dist);
            Vec3.add(out.center, out.center, _offset);
        }

        return out;
    }

    /**
     * @zh
     * 球跟立方体合并
     */
    public static mergeAABB (out: sphere, s:sphere, a: aabb) {
        a.getBoundary(_min, _max);

        sphere.mergePoint(out, s, _min);
        sphere.mergePoint(out, s, _max);

        return out;
    }

    /**
     * @en
     * The center of this sphere.
     * @zh
     * 本地坐标的中心点。
     */
    public center: Vec3;

    /**
     * @en
     * The radius of this sphere.
     * @zh
     * 半径。
     */
    public radius: number;

    /**
     * @en
     * Gets the type of the shape.
     * @zh
     * 获取形状的类型。
     */
    get type () {
        return this._type;
    }

    protected readonly _type: number;

    /**
     * @en
     * Construct a sphere.
     * @zh
     * 构造一个球。
     * @param cx 该球的世界坐标的 X 坐标。
     * @param cy 该球的世界坐标的 Y 坐标。
     * @param cz 该球的世界坐标的 Z 坐标。
     * @param {number} r 半径。
     */
    constructor (cx: number = 0, cy: number = 0, cz: number = 0, r: number = 1) {
        this._type = enums.SHAPE_SPHERE;
        this.center = new Vec3(cx, cy, cz);
        this.radius = r;
    }

    /**
     * @en
     * Get a clone.
     * @zh
     * 获得克隆。
     */
    public clone () {
        return sphere.clone(this);
    }

    /**
     * @en
     * Copy a sphere.
     * @zh
     * 拷贝对象。
     * @param a 拷贝的目标。
     */
    public copy (a: sphere) {
        return sphere.copy(this, a);
    }

    /**
     * @en
     * Get the bounding points of this shape
     * @zh
     * 获取此形状的边界点。
     * @param {Vec3} minPos 最小点。
     * @param {Vec3} maxPos 最大点。
     */
    public getBoundary (minPos: Vec3, maxPos: Vec3) {
        Vec3.set(minPos, this.center.x - this.radius, this.center.y - this.radius, this.center.z - this.radius);
        Vec3.set(maxPos, this.center.x + this.radius, this.center.y + this.radius, this.center.z + this.radius);
    }

    /**
     * @en
     * Transform this shape
     * @zh
     * 将 out 根据这个 sphere 的数据进行变换。
     * @param m 变换的矩阵。
     * @param pos 变换的位置部分。
     * @param rot 变换的旋转部分。
     * @param scale 变换的缩放部分。
     * @param out 变换的目标。
     */
    public transform (m: Mat4, pos: Vec3, rot: Quat, scale: Vec3, out: sphere) {
        Vec3.transformMat4(out.center, this.center, m);
        out.radius = this.radius * maxComponent(scale);
    }

    /**
     * @en
     * Translate and rotate this sphere.
     * @zh
     * 将 out 根据这个 sphere 的数据进行变换。
     * @param m 变换的矩阵。
     * @param rot 变换的旋转部分。
     * @param out 变换的目标。
     */
    public translateAndRotate (m: Mat4, rot: Quat, out: sphere) {
        Vec3.transformMat4(out.center, this.center, m);
    }

    /**
     * @en
     * Scaling this sphere.
     * @zh
     * 将 out 根据这个 sphere 的数据进行缩放。
     * @param scale 缩放值。
     * @param out 缩放的目标。
     */
    public setScale (scale: Vec3, out: sphere) {
        out.radius = this.radius * maxComponent(scale);
    }
}
