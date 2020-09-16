import CANNON from '@cocos/cannon';
import { Vec3 } from '../../../core/math';
import { commitShapeUpdates } from '../cannon-util';
import { CannonShape } from './cannon-shape';
import { ISimplexShape } from '../../spec/i-physics-shape';
import { IVec3Like } from '../../../core/math/type-define';
import { SimplexCollider } from '../../../../exports/physics-framework';

export class CannonSimplexShape extends CannonShape implements ISimplexShape {

    setShapeType (v: SimplexCollider.ESimplexType) {
        if (this._isBinding) {
            //TODO: change the type after init
        }
    }

    setVertices (v: IVec3Like[]) {
        const length = this.VERTICES.length;
        if (length == 4) {
            const ws = this._collider.node.worldScale;
            for (let i = 0; i < length; i++) {
                Vec3.multiply(this.VERTICES[i], ws, v[i]);
            }
            const impl = this.impl as CANNON.ConvexPolyhedron;
            impl.computeNormals();
            impl.computeEdges();
            impl.updateBoundingSphereRadius();
        } else {
            // TODO: add to center
            // const impl = this.impl as CANNON.Particle;
        }
        if (this._index != -1) {
            commitShapeUpdates(this._body);
        }
    }

    get collider () {
        return this._collider as SimplexCollider;
    }

    get impl () {
        return this._shape as CANNON.Particle | CANNON.ConvexPolyhedron;
    }

    readonly VERTICES: CANNON.Vec3[] = [];

    protected onComponentSet () {
        const type = this.collider.shapeType;
        if (type == SimplexCollider.ESimplexType.TETRAHEDRON) {
            for (let i = 0; i < 4; i++) {
                this.VERTICES[i] = new CANNON.Vec3(0, 0, 0);
            }
            this._shape = createTetra(this.VERTICES);
        } else {
            if (type != SimplexCollider.ESimplexType.VERTEX) {
                // WARN
            }
            this._shape = new CANNON.Particle();
        }
    }

    onLoad () {
        super.onLoad();
        this.collider.updateVertices();
    }

    setScale (scale: IVec3Like): void {
        super.setScale(scale);
        this.collider.updateVertices();
    }

}


const createTetra = (function () {
    const faces = [
        [0, 3, 2], // -x
        [0, 1, 3], // -y
        [0, 2, 1], // -z
        [1, 2, 3], // +xyz
    ];
    return function (verts: CANNON.Vec3[]) {
        return new CANNON.ConvexPolyhedron(verts, faces);
    }
})();